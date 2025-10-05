<?php
require_once '../../config/connect.php';
require_once '../../utils/cors.php';

// Enable CORS for frontend communication
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Get the request body
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['payment_id']) || empty($input['payment_id'])) {
        throw new Exception('Payment ID is required');
    }

    $payment_id = (int)$input['payment_id'];
    $refund_reason = $input['refund_reason'] ?? 'Admin refund';

    // Get database connection
    $db = Database::getInstance()->getConnection();

    // Start transaction
    $db->beginTransaction();

    // First, check if the payment exists and is completed
    $checkStmt = $db->prepare("
        SELECT p.payment_id, p.user_id, p.auction_id, p.amount, p.status, p.payment_method,
               u.full_name as user_name, u.email as user_email
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.payment_id = ? AND p.status = 'completed'
    ");
    $checkStmt->execute([$payment_id]);
    $payment = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        throw new Exception('Payment not found or not in completed status');
    }

    // Check if this specific payment has already been refunded (more precise check)
    $refundCheckStmt = $db->prepare("
        SELECT COUNT(*) 
        FROM payments 
        WHERE user_id = ? AND auction_id = ? AND amount = ? AND transaction_ref LIKE ?
    ");
    $expectedRefundAmount = -abs($payment['amount']);
    $refundRef = 'REFUND_' . $payment_id . '_%';
    $refundCheckStmt->execute([$payment['user_id'], $payment['auction_id'], $expectedRefundAmount, $refundRef]);
    $existingRefunds = $refundCheckStmt->fetchColumn();

    if ($existingRefunds > 0) {
        throw new Exception('This payment has already been refunded');
    }

    // Create the refund record as a new payment with negative amount
    $refundAmount = -abs($payment['amount']); // Ensure negative amount
    $refundReference = 'REFUND_' . $payment_id . '_' . time();

    $refundStmt = $db->prepare("
        INSERT INTO payments (user_id, auction_id, amount, status, payment_method, transaction_ref, created_at, updated_at)
        VALUES (?, ?, ?, 'completed', ?, ?, NOW(), NOW())
        RETURNING payment_id
    ");

    $success = $refundStmt->execute([
        $payment['user_id'],
        $payment['auction_id'],
        $refundAmount,
        $payment['payment_method'],
        $refundReference
    ]);

    if (!$success) {
        throw new Exception('Failed to create refund record');
    }

    $refund_id = $refundStmt->fetchColumn();

    // Update the original payment status to indicate it was refunded
    // Note: We're not changing the original payment status, just creating a refund record
    // The original payment remains 'completed' for audit purposes

    // Log the refund action in audit_logs (if table exists)
    try {
        $auditStmt = $db->prepare("
            INSERT INTO audit_logs (action_type, target_type, target_id, details, created_at)
            VALUES ('refund', 'payment', ?, ?, NOW())
        ");
        $auditDetails = json_encode([
            'original_payment_id' => $payment_id,
            'refund_payment_id' => $refund_id,
            'refund_amount' => $refundAmount,
            'refund_reason' => $refund_reason,
            'user_id' => $payment['user_id'],
            'user_name' => $payment['user_name']
        ]);
        $auditStmt->execute([$payment_id, $auditDetails]);
    } catch (Exception $e) {
        // Audit logging failure shouldn't break the refund process
        error_log("Audit log failed for refund: " . $e->getMessage());
    }

    // Commit transaction
    $db->commit();

    // Log the successful refund
    error_log("Refund processed successfully: Payment ID {$payment_id}, Refund ID {$refund_id}, Amount {$refundAmount}");

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Refund processed successfully',
        'refund_id' => $refund_id,
        'original_payment_id' => $payment_id,
        'refund_amount' => abs($refundAmount),
        'refund_reference' => $refundReference,
        'user_name' => $payment['user_name'],
        'user_email' => $payment['user_email']
    ]);
} catch (Exception $e) {
    // Rollback transaction if it was started
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    error_log("Error processing refund: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
