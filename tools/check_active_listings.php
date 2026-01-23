<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

// Check auction statuses
echo "=== AUCTION STATUSES ===\n";
$stmt = $pdo->query('SELECT status, COUNT(*) as cnt FROM auctions GROUP BY status ORDER BY status');
$statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($statuses as $row) {
    echo "{$row['status']}: {$row['cnt']}\n";
}

// Check active/live auctions
echo "\n=== ACTIVE/LIVE AUCTIONS ===\n";
$stmt = $pdo->query("SELECT id, title, status, start_time, end_time FROM auctions WHERE status IN ('active', 'live') LIMIT 10");
$active = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($active) . "\n";
foreach ($active as $row) {
    echo "ID: {$row['id']}, Title: {$row['title']}, Status: {$row['status']}\n";
}

// Check all auctions 
echo "\n=== TOTAL AUCTIONS ===\n";
$stmt = $pdo->query('SELECT COUNT(*) as total FROM auctions');
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Total: {$result['total']}\n";
