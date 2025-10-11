<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== CHECKING AUCTIONS TABLE STRUCTURE ===\n";

// Check auctions table structure
$stmt = $db->query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'auctions' ORDER BY ordinal_position");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Auctions table structure:\n";
foreach ($columns as $column) {
    echo "- {$column['column_name']} ({$column['data_type']}) " . ($column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}

// Simple check of payments without join
echo "\n=== PAYMENTS DATA ===\n";
$stmt = $db->query("SELECT payment_id, user_id, auction_id, amount, status, created_at FROM payments LIMIT 5");
$payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($payments)) {
    echo "Sample payment records:\n";
    foreach ($payments as $payment) {
        echo "- Payment ID: {$payment['payment_id']}, User: {$payment['user_id']}, Auction: {$payment['auction_id']}, Amount: {$payment['amount']}, Status: {$payment['status']}\n";
    }
} else {
    echo "No payment records found.\n";
}
