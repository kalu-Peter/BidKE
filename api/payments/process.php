<?php
header('Content-Type: application/json');

$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    $auctionId = $input['auction_id'] ?? null;
    $amount = isset($input['amount']) ? (float)$input['amount'] : null;
    $payment_method = $input['payment_method'] ?? null;
    $transaction_ref = $input['transaction_ref'] ?? null;
    $userId = $_SESSION['user_id'] ?? $input['user_id'] ?? null; // allow dev to pass user_id

    if (!$auctionId || $amount === null || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    // Start transaction
    $db->beginTransaction();

    // Lock auction row for update to avoid race conditions
    $aqStmt = $db->prepare('SELECT id, seller_id, title, status, winning_amount FROM auctions WHERE id = :id FOR UPDATE');
    $aqStmt->execute(['id' => $auctionId]);
    $auction = $aqStmt->fetch(PDO::FETCH_ASSOC);

    if (!$auction) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Auction not found']);
        exit();
    }

    // Create payments table if missing (best-effort) - integer PKs
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

    // Insert payment record as pending (gateway flow expected)
    $payStmt = $db->prepare('INSERT INTO payments (user_id, auction_id, amount, status, payment_method, transaction_ref, created_at, updated_at) VALUES (:user_id, :auction_id, :amount, :status, :payment_method, :transaction_ref, NOW(), NOW()) RETURNING payment_id');
    $status = 'pending';
    $payStmt->execute([
        'user_id' => $userId,
        'auction_id' => $auctionId,
        'amount' => $amount,
        'status' => $status,
        'payment_method' => $payment_method,
        'transaction_ref' => $transaction_ref
    ]);

    $payRow = $payStmt->fetch(PDO::FETCH_ASSOC);
    $paymentId = isset($payRow['payment_id']) ? (int)$payRow['payment_id'] : null;

    if (!$paymentId) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create payment record']);
        exit();
    }

    // Commit: commissions and payouts will be created when the payment is confirmed via webhook
    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Payment created and pending confirmation',
        'data' => [
            'payment_id' => $paymentId,
            'transaction_ref' => $transaction_ref
        ]
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Payments/process.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to process payment: ' . $e->getMessage()]);
}
