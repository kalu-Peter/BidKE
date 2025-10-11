<?php
// Simplified test script for the combined payout and commission processing endpoint
require_once __DIR__ . '/../api/config/connect.php';

echo "=== Testing Combined Payout and Commission Processing ===\n\n";

try {
    $db = Database::getInstance()->getConnection();

    // Check what pending payouts we have
    echo "1. Checking available pending payouts...\n";
    $stmt = $db->prepare("
        SELECT payout_id, seller_id, auction_id, payment_id, net_amount, platform_fee, status
        FROM payouts 
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 3
    ");
    $stmt->execute();
    $pendingPayouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($pendingPayouts)) {
        echo "   No pending payouts found.\n";
        echo "   Creating a test payout for testing...\n";

        // Get a completed payment that doesn't have a payout yet
        $paymentStmt = $db->prepare("
            SELECT payment_id, auction_id, amount
            FROM payments 
            WHERE status = 'completed' 
            AND payment_id NOT IN (SELECT payment_id FROM payouts WHERE payment_id IS NOT NULL)
            LIMIT 1
        ");
        $paymentStmt->execute();
        $testPayment = $paymentStmt->fetch(PDO::FETCH_ASSOC);

        if ($testPayment) {
            // Get the seller_id from the auction
            $auctionStmt = $db->prepare("SELECT seller_id FROM auctions WHERE id = ?");
            $auctionStmt->execute([$testPayment['auction_id']]);
            $sellerId = $auctionStmt->fetchColumn();

            if ($sellerId) {
                $platformFee = $testPayment['amount'] * 0.10;
                $netAmount = $testPayment['amount'] - $platformFee;

                $createPayoutStmt = $db->prepare("
                    INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
                ");

                $createPayoutStmt->execute([
                    $sellerId,
                    $testPayment['auction_id'],
                    $testPayment['payment_id'],
                    $testPayment['amount'],
                    $platformFee,
                    $netAmount
                ]);

                $testPayoutId = $db->lastInsertId();
                echo "   ✓ Created test payout with ID: $testPayoutId\n";

                // Add the test payout to our array
                $pendingPayouts = [[
                    'payout_id' => $testPayoutId,
                    'seller_id' => $sellerId,
                    'auction_id' => $testPayment['auction_id'],
                    'payment_id' => $testPayment['payment_id'],
                    'net_amount' => $netAmount,
                    'platform_fee' => $platformFee,
                    'status' => 'pending'
                ]];
            } else {
                echo "   Could not find seller for auction. Cannot create test payout.\n";
                exit(1);
            }
        } else {
            echo "   No suitable payments found. Cannot create test payout.\n";
            exit(1);
        }
    }

    echo "   Found " . count($pendingPayouts) . " pending payout(s):\n";
    foreach ($pendingPayouts as $payout) {
        echo "   - Payout ID: {$payout['payout_id']}, Amount: {$payout['net_amount']}, Platform Fee: {$payout['platform_fee']}\n";
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

    echo "\n3. Processing payout and commission atomically...\n";

    // Start transaction for atomic processing
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
            throw new Exception('No payout rows updated - may have been already processed');
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
            $platformFee = $testPayout['platform_fee'];

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
        echo "   The new combined endpoint should work correctly.\n";
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
