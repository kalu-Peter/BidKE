<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== COMMISSIONS TABLE ANALYSIS ===\n";

// Check commissions table structure
$stmt = $db->query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'commissions' ORDER BY ordinal_position");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Commissions table structure:\n";
foreach ($columns as $column) {
    echo "- {$column['column_name']} ({$column['data_type']}) " . ($column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}

// Check sample data
$stmt = $db->query("SELECT * FROM commissions LIMIT 5");
$commissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nSample commission records:\n";
foreach ($commissions as $commission) {
    echo "- ID: {$commission['commission_id']}, Platform Fee: {$commission['platform_fee']}, Percentage: {$commission['percentage']}, Status: {$commission['status']}\n";
}

// Check total revenue from platform fees
$stmt = $db->query("SELECT SUM(platform_fee) as total_revenue, COUNT(*) as total_commissions FROM commissions WHERE status = 'completed'");
$revenue = $stmt->fetch(PDO::FETCH_ASSOC);

echo "\nRevenue Summary:\n";
echo "Total Revenue (from platform_fee): {$revenue['total_revenue']}\n";
echo "Total Completed Commissions: {$revenue['total_commissions']}\n";
