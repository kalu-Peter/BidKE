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

    // Start transaction for atomic processing
    $db->beginTransaction();

    try {
        // First, check if the payout exists and get related information
        $checkStmt = $db->prepare("
            SELECT p.payout_id, p.seller_id, p.auction_id, p.payment_id, p.net_amount, p.status, p.platform_fee,
                   pay.amount as payment_amount, pay.user_id as buyer_id
            FROM payouts p
            JOIN payments pay ON p.payment_id = pay.payment_id
            WHERE p.payout_id = ? AND p.status = 'pending'
        ");
        $checkStmt->execute([$payout_id]);
        $payout = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$payout) {
            throw new Exception('Payout not found or not in pending status');
        }

        // Update the payout status to completed
        $updatePayoutStmt = $db->prepare("
            UPDATE payouts 
            SET status = 'completed', 
                updated_at = NOW() 
            WHERE payout_id = ? AND status = 'pending'
        ");

        $payoutSuccess = $updatePayoutStmt->execute([$payout_id]);

        if (!$payoutSuccess) {
            throw new Exception('Failed to update payout status');
        }

        if ($updatePayoutStmt->rowCount() === 0) {
            throw new Exception('No rows updated - payout may have been already processed');
        }

        // Check if commission already exists for this payout/payment
        $commissionCheckStmt = $db->prepare("
            SELECT commission_id, status 
            FROM commissions 
            WHERE payment_id = ? AND auction_id = ? AND seller_id = ?
        ");
        $commissionCheckStmt->execute([$payout['payment_id'], $payout['auction_id'], $payout['seller_id']]);
        $existingCommission = $commissionCheckStmt->fetch(PDO::FETCH_ASSOC);

        $commission_id = null;

        if ($existingCommission) {
            // Update existing commission to completed
            $commission_id = $existingCommission['commission_id'];

            if ($existingCommission['status'] !== 'completed') {
                $updateCommissionStmt = $db->prepare("
                    UPDATE commissions 
                    SET status = 'completed' 
                    WHERE commission_id = ?
                ");
                $updateCommissionStmt->execute([$commission_id]);

                error_log("Updated existing commission $commission_id to completed status");
            }
        } else {
            // Create new commission record
            // Calculate platform fee (use from payout if available, otherwise calculate 10% of payment amount)
            $platform_fee = $payout['platform_fee'] ?? ($payout['payment_amount'] * 0.10);
            $commission_percentage = 10.00; // Default 10%

            $createCommissionStmt = $db->prepare("
                INSERT INTO commissions (payment_id, auction_id, seller_id, platform_fee, percentage, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'completed', NOW())
            ");

            $createCommissionStmt->execute([
                $payout['payment_id'],
                $payout['auction_id'],
                $payout['seller_id'],
                $platform_fee,
                $commission_percentage
            ]);

            $commission_id = $db->lastInsertId();

            error_log("Created new commission record with ID: $commission_id, Platform Fee: $platform_fee");
        }

        // Commit transaction
        $db->commit();

        // Log the successful processing
        error_log("Payout and commission processed successfully: Payout ID {$payout_id}, Commission ID {$commission_id}");

        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Payout and commission processed successfully',
            'payout_id' => $payout_id,
            'commission_id' => $commission_id,
            'payout_amount' => $payout['net_amount'],
            'platform_fee' => $platform_fee ?? $payout['platform_fee'],
            'previous_status' => 'pending',
            'new_status' => 'completed'
        ]);
    } catch (Exception $e) {
        // Rollback transaction on any error
        $db->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    error_log("Error processing payout and commission: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
