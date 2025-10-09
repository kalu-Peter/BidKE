<?php
// Development-only: Mark payment completed and create commission/payout idempotently.
header('Content-Type: application/json');

// CORS: allow common local dev origins
$allowed_origins = ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/payout_helper.php';

// Guard: only allow this endpoint in development mode.
// Enable by setting environment variable DEV_MODE=1 or defining DEV_MODE constant in config.
$devModeEnv = getenv('DEV_MODE');
$devModeConst = defined('DEV_MODE') ? (bool)constant('DEV_MODE') : null;
if (!($devModeEnv === '1' || $devModeConst === true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'dev_confirm endpoint disabled. Enable DEV_MODE to use.']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$transaction_ref = $input['transaction_ref'] ?? null;
$payment_id = isset($input['payment_id']) ? (int)$input['payment_id'] : null;

if (!$transaction_ref && !$payment_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provide transaction_ref or payment_id']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Locate payment
    if ($transaction_ref) {
        $pstmt = $db->prepare('SELECT * FROM payments WHERE transaction_ref = :tx LIMIT 1 FOR UPDATE');
        $pstmt->execute(['tx' => $transaction_ref]);
    } else {
        $pstmt = $db->prepare('SELECT * FROM payments WHERE payment_id = :id LIMIT 1 FOR UPDATE');
        $pstmt->execute(['id' => $payment_id]);
    }
    $payment = $pstmt->fetch(PDO::FETCH_ASSOC);
    if (!$payment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found']);
        exit();
    }

    // If already completed, return success
    if ($payment['status'] === 'completed') {
        echo json_encode(['success' => true, 'message' => 'Already completed']);
        exit();
    }

    // Begin transaction
    $db->beginTransaction();

    $upd = $db->prepare('UPDATE payments SET status = :status, updated_at = NOW() WHERE payment_id = :id');
    $upd->execute(['status' => 'completed', 'id' => $payment['payment_id']]);

    // Create commission table if missing
    $db->exec("CREATE TABLE IF NOT EXISTS commissions (
        commission_id BIGSERIAL PRIMARY KEY,
        payment_id BIGINT NOT NULL,
        auction_id BIGINT NOT NULL,
        seller_id BIGINT NOT NULL,
        platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )");

    $auctionId = (int)$payment['auction_id'];
    $amountPaid = isset($payment['amount']) ? (float)$payment['amount'] : null;
    $percentage = 10.0;
    $platformFee = $amountPaid !== null ? round($amountPaid * ($percentage / 100), 2) : 0;

    // Find seller
    $aStmt = $db->prepare('SELECT seller_id FROM auctions WHERE id = :id LIMIT 1');
    $aStmt->execute(['id' => $auctionId]);
    $auctionRow = $aStmt->fetch(PDO::FETCH_ASSOC);
    $sellerId = $auctionRow ? (int)$auctionRow['seller_id'] : null;

    // Create commission if missing
    $cCheck = $db->prepare('SELECT commission_id FROM commissions WHERE payment_id = :pid LIMIT 1');
    $cCheck->execute(['pid' => $payment['payment_id']]);
    $cExists = $cCheck->fetch(PDO::FETCH_ASSOC);
    if (!$cExists) {
        $commStmt = $db->prepare('INSERT INTO commissions (payment_id, auction_id, seller_id, platform_fee, percentage, status, created_at) VALUES (:payment_id, :auction_id, :seller_id, :platform_fee, :percentage, :status, NOW()) RETURNING commission_id');
        $commStmt->execute([
            'payment_id' => $payment['payment_id'],
            'auction_id' => $auctionId,
            'seller_id' => $sellerId,
            'platform_fee' => $platformFee,
            'percentage' => $percentage,
            'status' => 'pending'
        ]);
        $commRow = $commStmt->fetch(PDO::FETCH_ASSOC);
        $commissionId = isset($commRow['commission_id']) ? (int)$commRow['commission_id'] : null;
    } else {
        $commissionId = (int)$cExists['commission_id'];
    }

    // Create payouts table if missing and insert payout (idempotent)
    $db->exec("CREATE TABLE IF NOT EXISTS payouts (
        payout_id BIGSERIAL PRIMARY KEY,
        seller_id BIGINT NOT NULL,
        auction_id BIGINT NOT NULL,
        payment_id BIGINT,
        gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payout_method VARCHAR(64),
        transaction_ref VARCHAR(128),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )");

    $pCheck = $db->prepare('SELECT payout_id FROM payouts WHERE payment_id = :pid LIMIT 1');
    $pCheck->execute(['pid' => $payment['payment_id']]);
    $pExists = $pCheck->fetch(PDO::FETCH_ASSOC);
    if (!$pExists) {
        $gross = $amountPaid;
        $net = $gross !== null ? round($gross - $platformFee, 2) : 0;

        // Get seller's default payout method
        $defaultPayoutMethod = getUserDefaultPayoutMethod($db, $sellerId);
        if (!$defaultPayoutMethod) {
            $defaultPayoutMethod = 'not_configured'; // Fallback if no method is set up
        }

        $payoutStmt = $db->prepare('INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, payout_method, transaction_ref, created_at, updated_at) VALUES (:seller_id, :auction_id, :payment_id, :gross_amount, :platform_fee, :net_amount, :status, :payout_method, :transaction_ref, NOW(), NOW()) RETURNING payout_id');
        $payoutStmt->execute([
            'seller_id' => $sellerId,
            'auction_id' => $auctionId,
            'payment_id' => $payment['payment_id'],
            'gross_amount' => $gross,
            'platform_fee' => $platformFee,
            'net_amount' => $net,
            'status' => 'pending',
            'payout_method' => $defaultPayoutMethod,
            'transaction_ref' => $payment['transaction_ref'] ?? null
        ]);
        $payoutRow = $payoutStmt->fetch(PDO::FETCH_ASSOC);
        $payoutId = isset($payoutRow['payout_id']) ? (int)$payoutRow['payout_id'] : null;
    } else {
        $payoutId = (int)$pExists['payout_id'];
    }

    // Update auction status to a valid value per schema (sold)
    $updA = $db->prepare('UPDATE auctions SET status = :status, updated_at = NOW() WHERE id = :id');
    $updA->execute(['status' => 'sold', 'id' => $auctionId]);

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Payment marked completed (dev)', 'data' => ['payment_id' => $payment['payment_id'], 'commission_id' => $commissionId ?? null, 'payout_id' => $payoutId ?? null]]);
    exit();
} catch (Exception $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Dev confirm error: ' . $e->getMessage()]);
    exit();
}
