<?php
// Test script for the combined payout and commission processing endpoint
require_once __DIR__ . '/../api/config/connect.php';

echo "=== Testing Combined Payout and Commission Processing ===\n\n";

try {
    $db = Database::getInstance()->getConnection();

    // First, let's check what pending payouts we have
    echo "1. Checking available pending payouts...\n";
    $stmt = $db->prepare("
        SELECT p.payout_id, p.seller_id, p.auction_id, p.payment_id, p.net_amount, p.status, p.platform_fee,
               pay.amount as payment_amount, pay.user_id as buyer_id,
               a.title as auction_title
        FROM payouts p
        JOIN payments pay ON p.payment_id = pay.payment_id
        LEFT JOIN auctions a ON p.auction_id = a.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $pendingPayouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($pendingPayouts)) {
        echo "   No pending payouts found. Creating a test payout...\n";

        // Check for a completed payment to create a test payout
        $paymentStmt = $db->prepare("
            SELECT payment_id, auction_id, user_id as buyer_id, amount, seller_id
            FROM payments 
            WHERE status = 'completed' 
            AND payment_id NOT IN (SELECT payment_id FROM payouts WHERE payment_id IS NOT NULL)
            LIMIT 1
        ");
        $paymentStmt->execute();
        $testPayment = $paymentStmt->fetch(PDO::FETCH_ASSOC);

        if ($testPayment) {
            // Calculate net amount (90% of payment after platform fee)
            $platformFee = $testPayment['amount'] * 0.10;
            $netAmount = $testPayment['amount'] - $platformFee;

            $createPayoutStmt = $db->prepare("
                INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
            ");

            $createPayoutStmt->execute([
                $testPayment['seller_id'],
                $testPayment['auction_id'],
                $testPayment['payment_id'],
                $testPayment['amount'],
                $platformFee,
                $netAmount
            ]);

            $testPayoutId = $db->lastInsertId();
            echo "   Created test payout with ID: $testPayoutId\n";

            // Refresh the pending payouts list
            $stmt->execute();
            $pendingPayouts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            echo "   No suitable payments found to create test payout.\n";
            echo "   Please ensure you have completed payments in your database.\n";
            exit(1);
        }
    }

    echo "   Found " . count($pendingPayouts) . " pending payout(s):\n";
    foreach ($pendingPayouts as $payout) {
        echo "   - Payout ID: {$payout['payout_id']}, Amount: {$payout['net_amount']}, Auction: " .
            ($payout['auction_title'] ?? 'Unknown') . "\n";
    }

    // Test with the first pending payout
    $testPayout = $pendingPayouts[0];
    $testPayoutId = $testPayout['payout_id'];

    echo "\n2. Testing combined processing with Payout ID: $testPayoutId\n";

    // Check existing commission status
    $commissionCheckStmt = $db->prepare("
        SELECT commission_id, status, platform_fee 
        FROM commissions 
        WHERE payment_id = ? AND auction_id = ? AND seller_id = ?
    ");
    $commissionCheckStmt->execute([
        $testPayout['payment_id'],
        $testPayout['auction_id'],
        $testPayout['seller_id']
    ]);
    $existingCommission = $commissionCheckStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingCommission) {
        echo "   Existing commission found: ID {$existingCommission['commission_id']}, Status: {$existingCommission['status']}\n";
    } else {
        echo "   No existing commission found. Will create new one.\n";
    }

    // Simulate the API call
    echo "\n3. Simulating API processing...\n";

    // Start transaction
    $db->beginTransaction();

    try {
        // Update payout status
        $updatePayoutStmt = $db->prepare("
            UPDATE payouts 
            SET status = 'completed', updated_at = NOW() 
            WHERE payout_id = ? AND status = 'pending'
        ");
        $updatePayoutStmt->execute([$testPayoutId]);

        if ($updatePayoutStmt->rowCount() === 0) {
            throw new Exception('No payout rows updated');
        }
        echo "   ✓ Payout status updated to completed\n";

        // Handle commission
        if ($existingCommission) {
            if ($existingCommission['status'] !== 'completed') {
                $updateCommissionStmt = $db->prepare("
                    UPDATE commissions SET status = 'completed' WHERE commission_id = ?
                ");
                $updateCommissionStmt->execute([$existingCommission['commission_id']]);
                echo "   ✓ Commission status updated to completed\n";
            } else {
                echo "   ✓ Commission already completed\n";
            }
            $commission_id = $existingCommission['commission_id'];
        } else {
            // Create new commission
            $platformFee = $testPayout['platform_fee'] ?? ($testPayout['payment_amount'] * 0.10);

            $createCommissionStmt = $db->prepare("
                INSERT INTO commissions (payment_id, auction_id, seller_id, platform_fee, percentage, status, created_at)
                VALUES (?, ?, ?, ?, 10.00, 'completed', NOW())
            ");
            $createCommissionStmt->execute([
                $testPayout['payment_id'],
                $testPayout['auction_id'],
                $testPayout['seller_id'],
                $platformFee
            ]);
            $commission_id = $db->lastInsertId();
            echo "   ✓ New commission created with ID: $commission_id, Platform Fee: $platformFee\n";
        }

        // Commit transaction
        $db->commit();
        echo "   ✓ Transaction committed successfully\n";

        echo "\n4. Verification:\n";

        // Verify payout status
        $verifyPayoutStmt = $db->prepare("SELECT status FROM payouts WHERE payout_id = ?");
        $verifyPayoutStmt->execute([$testPayoutId]);
        $payoutStatus = $verifyPayoutStmt->fetchColumn();
        echo "   Payout Status: $payoutStatus\n";

        // Verify commission status
        $verifyCommissionStmt = $db->prepare("SELECT status, platform_fee FROM commissions WHERE commission_id = ?");
        $verifyCommissionStmt->execute([$commission_id]);
        $commissionData = $verifyCommissionStmt->fetch(PDO::FETCH_ASSOC);
        echo "   Commission Status: {$commissionData['status']}, Platform Fee: {$commissionData['platform_fee']}\n";

        echo "\n✅ Test completed successfully!\n";
        echo "   Both payout and commission have been processed atomically.\n";
    } catch (Exception $e) {
        $db->rollBack();
        echo "   ❌ Transaction rolled back due to error: " . $e->getMessage() . "\n";
        throw $e;
    }
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Test Complete ===\n";
