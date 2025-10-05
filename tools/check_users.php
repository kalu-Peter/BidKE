<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== USERS TABLE STRUCTURE ===\n";

// Check users table structure
$stmt = $db->query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Users table structure:\n";
foreach ($columns as $column) {
    echo "- {$column['column_name']} ({$column['data_type']}) " . ($column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}
