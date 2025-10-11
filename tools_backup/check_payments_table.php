<?php
require_once __DIR__ . '/../api/config/connect.php';

echo "Checking payments table structure...\n";

try {
    $db = Database::getInstance()->getConnection();

    $stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' AND table_schema = 'public' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Payments table columns: " . implode(', ', $columns) . "\n";

    echo "\nChecking payouts table structure...\n";
    $stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payouts' AND table_schema = 'public' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Payouts table columns: " . implode(', ', $columns) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
