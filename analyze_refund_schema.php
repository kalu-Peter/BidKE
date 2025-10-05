<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== ANALYZING REFUND DATABASE SCHEMA ===\n\n";

// Get all table names
$stmt = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo "Available tables:\n";
foreach ($tables as $table) {
    echo "- $table\n";
}

// Check for refund-related tables
$refundTables = array_filter($tables, function ($table) {
    return strpos(strtolower($table), 'refund') !== false;
});

if (!empty($refundTables)) {
    echo "\nRefund-related tables found:\n";
    foreach ($refundTables as $table) {
        echo "- $table\n";
    }
} else {
    echo "\nNo dedicated refund tables found. Checking payments table structure...\n";

    // Check payments table structure
    $stmt = $db->query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\nPayments table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['column_name']} ({$column['data_type']}) " . ($column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
    }

    // Check payment statuses
    $stmt = $db->query("SELECT DISTINCT status FROM payments WHERE status IS NOT NULL");
    $paymentStatuses = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($paymentStatuses)) {
        echo "\nExisting payment statuses:\n";
        foreach ($paymentStatuses as $status) {
            echo "- $status\n";
        }
    }
}

// Check recent completed payments that could be refunded
echo "\n=== REFUNDABLE TRANSACTIONS ===\n";
$stmt = $db->query("
    SELECT p.payment_id, p.amount, p.status, p.created_at,
           a.title as auction_title, a.auction_id
    FROM payments p
    LEFT JOIN auctions a ON p.auction_id = a.auction_id  
    WHERE p.status = 'completed'
    ORDER BY p.created_at DESC 
    LIMIT 5
");
$refundablePayments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($refundablePayments)) {
    echo "Completed auction payments that could be refunded:\n";
    foreach ($refundablePayments as $payment) {
        echo "- Payment ID: {$payment['payment_id']}, Amount: {$payment['amount']}, Auction: {$payment['auction_title']}, Date: {$payment['created_at']}\n";
    }
} else {
    echo "No completed auction payments found for testing refunds.\n";

    // Let's check what payment records exist
    $stmt = $db->query("SELECT COUNT(*) as total, status FROM payments GROUP BY status ORDER BY total DESC");
    $paymentSummary = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\nPayment records summary:\n";
    foreach ($paymentSummary as $summary) {
        echo "- Status: {$summary['status']}, Count: {$summary['total']}\n";
    }
}
