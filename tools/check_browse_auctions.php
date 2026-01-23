<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

// Check auction table structure
echo "=== AUCTION TABLE COLUMNS ===\n";
$stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'auctions' ORDER BY ordinal_position");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['column_name']}: {$col['data_type']}\n";
}

// Check active auctions with time data
echo "\n=== ACTIVE AUCTIONS WITH TIME DATA ===\n";
$stmt = $pdo->query("
    SELECT 
        id, 
        title, 
        status, 
        start_time, 
        end_time,
        NOW() as current_time,
        (start_time <= NOW()) as start_ok,
        (end_time > NOW()) as end_ok
    FROM auctions 
    WHERE status = 'active'
    LIMIT 5
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    echo "\nID: {$row['id']}, Title: {$row['title']}\n";
    echo "  Status: {$row['status']}\n";
    echo "  Start Time: {$row['start_time']}\n";
    echo "  End Time: {$row['end_time']}\n";
    echo "  Current Time: {$row['current_time']}\n";
    echo "  Start OK: " . ($row['start_ok'] ? 'YES' : 'NO') . "\n";
    echo "  End OK: " . ($row['end_ok'] ? 'YES' : 'NO') . "\n";
}

// Check total active vs live-condition auctions
echo "\n=== AUCTION STATUS COUNTS ===\n";
$stmt = $pdo->query("SELECT COUNT(*) as cnt FROM auctions WHERE status = 'active'");
$total_active = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
echo "Total with status='active': $total_active\n";

$stmt = $pdo->query("SELECT COUNT(*) as cnt FROM auctions WHERE (status = 'approved' OR status = 'live' OR status = 'active') AND start_time <= NOW() AND end_time > NOW()");
$live_condition = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
echo "With live condition (start<=now AND end>now): $live_condition\n";
