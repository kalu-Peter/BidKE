<?php
// Payment gateway webhook handler — marks payment as completed and creates commission & payout records
header('Content-Type: application/json');

// Allow gateway IPs or origins as needed (simple dev policy)
$allowed_origins = ['http://localhost:8080'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../config/config.php';

// Read raw body and parse JSON
$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true);

// Verify webhook signature if configured (HMAC SHA256)
$sigHeader = $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? null;
if (defined('PAYMENT_WEBHOOK_SECRET') && PAYMENT_WEBHOOK_SECRET) {
    if (!$sigHeader) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Missing signature header']);
        exit();
    }
    // Signature may be in form: sha256=hex
    $provided = $sigHeader;
    if (strpos($provided, '=') !== false) {
        list($algo, $hex) = explode('=', $provided, 2);
        $provided = $hex;
    }
    $calculated = hash_hmac('sha256', $rawBody, PAYMENT_WEBHOOK_SECRET);
    if (!hash_equals($calculated, $provided)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid signature']);
        exit();
    }
}

// Continue processing
// $input already set above

$transaction_ref = $input['transaction_ref'] ?? $input['tx_ref'] ?? null;
$status = $input['status'] ?? null; // expected 'success' or similar
$amount = isset($input['amount']) ? (float)$input['amount'] : null;

if (!$transaction_ref || !$status) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing transaction_ref or status']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Find payment by transaction_ref
    $pstmt = $db->prepare('SELECT * FROM payments WHERE transaction_ref = :tx LIMIT 1 FOR UPDATE');
    $pstmt->execute(['tx' => $transaction_ref]);
    $payment = $pstmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        // No matching payment — respond 404 but do not treat as error for gateway
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment record not found']);
        exit();
    }

    // Idempotency: if payment already completed, return success
    if ($payment['status'] === 'completed') {
        echo json_encode(['success' => true, 'message' => 'Already completed']);
        exit();
    }

    // Only process if gateway reports success
    if (!in_array(strtolower($status), ['success', 'completed', 'paid'])) {
        // mark as failed
        $upd = $db->prepare('UPDATE payments SET status = :status, updated_at = NOW() WHERE payment_id = :id');
        $upd->execute(['status' => 'failed', 'id' => $payment['payment_id']]);
        echo json_encode(['success' => true, 'message' => 'Payment marked as failed']);
        exit();
    }

    // Begin transaction: mark payment completed and create commission + payout
    $db->beginTransaction();

    $upd = $db->prepare('UPDATE payments SET status = :status, updated_at = NOW() WHERE payment_id = :id');
    $upd->execute(['status' => 'completed', 'id' => $payment['payment_id']]);

    // Re-load payment row for fresh data
    $pstmt->execute(['tx' => $transaction_ref]);
    $payment = $pstmt->fetch(PDO::FETCH_ASSOC);

    $auctionId = (int)$payment['auction_id'];
    $userId = (int)$payment['user_id'];
    $amountPaid = isset($payment['amount']) ? (float)$payment['amount'] : $amount;

    // Ensure commissions table exists (best-effort)
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

    // Compute commission (10%)
    $percentage = 10.0;
    $platformFee = round($amountPaid * ($percentage / 100), 2);

    // Find seller
    $aStmt = $db->prepare('SELECT seller_id FROM auctions WHERE id = :id LIMIT 1');
    $aStmt->execute(['id' => $auctionId]);
    $auctionRow = $aStmt->fetch(PDO::FETCH_ASSOC);
    $sellerId = $auctionRow ? (int)$auctionRow['seller_id'] : null;

    // Create commission (idempotent: check if exists)
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

    // Ensure payouts table exists
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

    // Create payout if missing
    $pCheck = $db->prepare('SELECT payout_id FROM payouts WHERE payment_id = :pid LIMIT 1');
    $pCheck->execute(['pid' => $payment['payment_id']]);
    $pExists = $pCheck->fetch(PDO::FETCH_ASSOC);
    if (!$pExists) {
        $gross = $amountPaid;
        $net = round($gross - $platformFee, 2);
        $payoutStmt = $db->prepare('INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, payout_method, transaction_ref, created_at, updated_at) VALUES (:seller_id, :auction_id, :payment_id, :gross_amount, :platform_fee, :net_amount, :status, :payout_method, :transaction_ref, NOW(), NOW()) RETURNING payout_id');
        $payoutStmt->execute([
            'seller_id' => $sellerId,
            'auction_id' => $auctionId,
            'payment_id' => $payment['payment_id'],
            'gross_amount' => $gross,
            'platform_fee' => $platformFee,
            'net_amount' => $net,
            'status' => 'pending',
            'payout_method' => 'mpesa',
            'transaction_ref' => $transaction_ref
        ]);
        $payoutRow = $payoutStmt->fetch(PDO::FETCH_ASSOC);
        $payoutId = isset($payoutRow['payout_id']) ? (int)$payoutRow['payout_id'] : null;
    } else {
        $payoutId = (int)$pExists['payout_id'];
    }

    // Update auction status to paid
    $updA = $db->prepare('UPDATE auctions SET status = :status, updated_at = NOW() WHERE id = :id');
    $updA->execute(['status' => 'paid', 'id' => $auctionId]);

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Payment confirmed and commission/payout created', 'data' => ['payment_id' => $payment['payment_id'], 'commission_id' => $commissionId ?? null, 'payout_id' => $payoutId ?? null]]);
    exit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('payments/webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Webhook processing error: ' . $e->getMessage()]);
    exit();
}
