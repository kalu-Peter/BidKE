<?php
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "=== Database Data Check ===\n\n";

    echo "Payments (first 3):\n";
    $stmt = $db->query('SELECT payment_id, auction_id, amount, status FROM payments ORDER BY created_at DESC LIMIT 3');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        echo "  ID: {$row['payment_id']}, Auction: {$row['auction_id']}, Amount: {$row['amount']}, Status: {$row['status']}\n";
    }

    echo "\nPayouts (first 3):\n";
    $stmt = $db->query('SELECT payout_id, payment_id, status, net_amount FROM payouts ORDER BY created_at DESC LIMIT 3');
    $payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($payouts)) {
        echo "  No payouts found.\n";
    } else {
        foreach ($payouts as $row) {
            echo "  ID: {$row['payout_id']}, Payment: {$row['payment_id']}, Status: {$row['status']}, Amount: {$row['net_amount']}\n";
        }
    }

    echo "\nCommissions (first 3):\n";
    $stmt = $db->query('SELECT commission_id, payment_id, status, platform_fee FROM commissions ORDER BY created_at DESC LIMIT 3');
    $commissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($commissions)) {
        echo "  No commissions found.\n";
    } else {
        foreach ($commissions as $row) {
            echo "  ID: {$row['commission_id']}, Payment: {$row['payment_id']}, Status: {$row['status']}, Platform Fee: {$row['platform_fee']}\n";
        }
    }

    // Check if we have any pending payouts for testing
    echo "\nPending payouts:\n";
    $stmt = $db->query("SELECT payout_id, seller_id, net_amount, status FROM payouts WHERE status = 'pending'");
    $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($pending)) {
        echo "  No pending payouts found.\n";

        // Let's create a test payout if we have any completed payments
        echo "\nLet me try to create a test payout...\n";
        $stmt = $db->query("SELECT COUNT(*) FROM payments WHERE status = 'completed'");
        $completedCount = $stmt->fetchColumn();
        echo "  Completed payments available: $completedCount\n";

        if ($completedCount > 0) {
            // Try to create a simple test payout
            $stmt = $db->prepare("INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, created_at) VALUES (1, 1, 1, 100.00, 10.00, 90.00, 'pending', NOW())");
            try {
                $stmt->execute();
                echo "  ✓ Created test payout with ID: " . $db->lastInsertId() . "\n";
            } catch (Exception $e) {
                echo "  Could not create test payout: " . $e->getMessage() . "\n";
            }
        }
    } else {
        foreach ($pending as $row) {
            echo "  ID: {$row['payout_id']}, Seller: {$row['seller_id']}, Amount: {$row['net_amount']}, Status: {$row['status']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
