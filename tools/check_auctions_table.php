<?php
require_once __DIR__ . '/../api/config/connect.php';

echo "Checking auctions table structure...\n";

try {
    $db = Database::getInstance()->getConnection();

    $stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'auctions' AND table_schema = 'public' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Auctions table columns: " . implode(', ', $columns) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
