<?php
// Process payment for a given auction's winner (by auction_id)
// Can be called via POST (JSON body {"auction_id": 19}) or CLI: php process_auction.php 19

header('Content-Type: application/json');

$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../config/connect.php';

// Support CLI: accept auction_id as first arg
if (php_sapi_name() === 'cli') {
    $auctionId = $argv[1] ?? null;
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? $_POST['auction_id'] ?? null;
}

if (!$auctionId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing auction_id']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Find winner record
    $wstmt = $db->prepare('SELECT * FROM auction_winners WHERE auction_id = :aid LIMIT 1');
    $wstmt->execute(['aid' => $auctionId]);
    $winner = $wstmt->fetch(PDO::FETCH_ASSOC);

    if (!$winner) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'No winner record found for auction']);
        exit();
    }

    $winnerId = (int)$winner['winner_id'];
    $amount = isset($winner['winning_amount']) ? (float)$winner['winning_amount'] : null;

    if ($amount === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Winner record missing winning_amount']);
        exit();
    }

    // Check if a payment already exists for this auction and user
    $checkStmt = $db->prepare('SELECT payment_id, status FROM payments WHERE auction_id = :aid AND user_id = :uid LIMIT 1');
    $checkStmt->execute(['aid' => $auctionId, 'uid' => $winnerId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode(['success' => true, 'message' => 'Payment already exists for this winner', 'data' => $existing]);
        exit();
    }

    // Create a pending payment and return transaction_ref for gateway redirect
    $db->beginTransaction();

    // Ensure payments table exists
    $db->exec("CREATE TABLE IF NOT EXISTS payments (
        payment_id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        auction_id BIGINT NOT NULL,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(64),
        transaction_ref VARCHAR(128),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )");

    // Generate a transaction_ref if not provided (unique-ish)
    $transactionRef = 'txn_' . bin2hex(random_bytes(8));

    $payStmt = $db->prepare('INSERT INTO payments (user_id, auction_id, amount, status, payment_method, transaction_ref, created_at, updated_at) VALUES (:user_id, :auction_id, :amount, :status, :payment_method, :transaction_ref, NOW(), NOW()) RETURNING payment_id');
    $status = 'pending';
    $payStmt->execute([
        'user_id' => $winnerId,
        'auction_id' => $auctionId,
        'amount' => $amount,
        'status' => $status,
        'payment_method' => 'gateway',
        'transaction_ref' => $transactionRef
    ]);
    $payRow = $payStmt->fetch(PDO::FETCH_ASSOC);
    $paymentId = isset($payRow['payment_id']) ? (int)$payRow['payment_id'] : null;

    if (!$paymentId) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create payment record']);
        exit();
    }

    $db->commit();

    // Build a checkout_url if payment provider configured
    $checkoutUrl = null;
    if (defined('PAYMENT_PROVIDER_URL') && PAYMENT_PROVIDER_URL) {
        // Basic example: append tx and auction_id as query params
        $checkoutUrl = PAYMENT_PROVIDER_URL . (strpos(PAYMENT_PROVIDER_URL, '?') === false ? '?' : '&') . http_build_query(['tx' => $transactionRef, 'auction_id' => $auctionId]);
    }

    // Return payment id, transaction_ref and optional checkout_url so front-end can redirect to gateway
    echo json_encode(['success' => true, 'message' => 'Pending payment created', 'data' => ['payment_id' => $paymentId, 'transaction_ref' => $transactionRef, 'checkout_url' => $checkoutUrl]]);
    exit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('process_auction error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error processing payment: ' . $e->getMessage()]);
    exit();
}
