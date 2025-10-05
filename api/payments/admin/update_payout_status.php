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
    if (!isset($input['payout_id']) || empty($input['payout_id'])) {
        throw new Exception('Payout ID is required');
    }

    $payout_id = (int)$input['payout_id'];

    // Get database connection
    $db = Database::getInstance()->getConnection();

    // First, check if the payout exists and is pending
    $checkStmt = $db->prepare("
        SELECT payout_id, status, seller_id, net_amount 
        FROM payouts 
        WHERE payout_id = ? AND status = 'pending'
    ");
    $checkStmt->execute([$payout_id]);
    $payout = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$payout) {
        throw new Exception('Payout not found or not in pending status');
    }

    // Update the payout status to completed
    $updateStmt = $db->prepare("
        UPDATE payouts 
        SET status = 'completed', 
            updated_at = NOW() 
        WHERE payout_id = ? AND status = 'pending'
    ");

    $success = $updateStmt->execute([$payout_id]);

    if (!$success) {
        throw new Exception('Failed to update payout status');
    }

    // Check if any rows were affected
    if ($updateStmt->rowCount() === 0) {
        throw new Exception('No rows updated - payout may have been already processed');
    }

    // Log the successful payout submission (optional)
    error_log("Payout submitted successfully: ID {$payout_id}, Amount {$payout['net_amount']}");

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Payout submitted successfully',
        'payout_id' => $payout_id,
        'previous_status' => 'pending',
        'new_status' => 'completed'
    ]);
} catch (Exception $e) {
    error_log("Error updating payout status: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
