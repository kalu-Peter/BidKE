<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

// Admin confirm a pending payment by payment_id. This mirrors the webhook logic but is callable by admins.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$paymentId = isset($input['payment_id']) ? (int)$input['payment_id'] : null;

if (!$paymentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing payment_id']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Lock payment row
    $pstmt = $db->prepare('SELECT * FROM payments WHERE payment_id = :id LIMIT 1 FOR UPDATE');
    $pstmt->execute(['id' => $paymentId]);
    $payment = $pstmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found']);
        exit();
    }

    if ($payment['status'] === 'completed') {
        echo json_encode(['success' => true, 'message' => 'Already completed', 'data' => ['payment_id' => $paymentId]]);
        exit();
    }

    // Begin transaction
    $db->beginTransaction();

    // Mark payment completed
    $upd = $db->prepare('UPDATE payments SET status = :status, updated_at = NOW() WHERE payment_id = :id');
    $upd->execute(['status' => 'completed', 'id' => $paymentId]);

    // Re-load payment
    $pstmt->execute(['id' => $paymentId]);
    $payment = $pstmt->fetch(PDO::FETCH_ASSOC);

    $auctionId = (int)$payment['auction_id'];
    $amountPaid = isset($payment['amount']) ? (float)$payment['amount'] : 0.0;

    // Compute commission (10%)
    $percentage = 10.0;
    $platformFee = round($amountPaid * ($percentage / 100), 2);

    // Find seller
    $aStmt = $db->prepare('SELECT seller_id FROM auctions WHERE id = :id LIMIT 1');
    $aStmt->execute(['id' => $auctionId]);
    $auctionRow = $aStmt->fetch(PDO::FETCH_ASSOC);
    $sellerId = $auctionRow ? (int)$auctionRow['seller_id'] : null;

    // Create commission if missing
    $cCheck = $db->prepare('SELECT commission_id FROM commissions WHERE payment_id = :pid LIMIT 1');
    $cCheck->execute(['pid' => $paymentId]);
    $cExists = $cCheck->fetch(PDO::FETCH_ASSOC);
    if (!$cExists) {
        $commStmt = $db->prepare('INSERT INTO commissions (payment_id, auction_id, seller_id, platform_fee, percentage, status, created_at) VALUES (:payment_id, :auction_id, :seller_id, :platform_fee, :percentage, :status, NOW()) RETURNING commission_id');
        $commStmt->execute([
            'payment_id' => $paymentId,
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

    // Create payout if missing
    $pCheck = $db->prepare('SELECT payout_id FROM payouts WHERE payment_id = :pid LIMIT 1');
    $pCheck->execute(['pid' => $paymentId]);
    $pExists = $pCheck->fetch(PDO::FETCH_ASSOC);
    if (!$pExists) {
        $gross = $amountPaid;
        $net = round($gross - $platformFee, 2);
        $payoutStmt = $db->prepare('INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, payout_method, transaction_ref, created_at, updated_at) VALUES (:seller_id, :auction_id, :payment_id, :gross_amount, :platform_fee, :net_amount, :status, :payout_method, :transaction_ref, NOW(), NOW()) RETURNING payout_id');
        $payoutStmt->execute([
            'seller_id' => $sellerId,
            'auction_id' => $auctionId,
            'payment_id' => $paymentId,
            'gross_amount' => $gross,
            'platform_fee' => $platformFee,
            'net_amount' => $net,
            'status' => 'pending',
            'payout_method' => 'mpesa',
            'transaction_ref' => $payment['transaction_ref'] ?? null
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

    echo json_encode(['success' => true, 'message' => 'Payment confirmed by admin', 'data' => ['payment_id' => $paymentId, 'commission_id' => $commissionId ?? null, 'payout_id' => $payoutId ?? null]]);
    exit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('admin/confirm error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit();
}
