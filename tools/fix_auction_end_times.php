<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

// Update all active auctions to have future end times (90 days from now)
$future_end = date('Y-m-d H:i:s', strtotime('+90 days'));

echo "Updating active auctions to end on: $future_end\n\n";

$stmt = $pdo->prepare("
    UPDATE auctions 
    SET end_time = :end_time 
    WHERE status = 'active'
");

$stmt->execute([':end_time' => $future_end]);
$affected = $stmt->rowCount();

echo "Updated $affected auctions\n\n";

// Verify update
$stmt = $pdo->query("
    SELECT 
        id, 
        title, 
        status,
        end_time,
        (end_time > NOW()) as will_show_in_browse
    FROM auctions 
    WHERE status = 'active'
    LIMIT 5
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "=== UPDATED ACTIVE AUCTIONS ===\n";
foreach ($rows as $row) {
    echo "ID: {$row['id']}, Title: {$row['title']}\n";
    echo "  Status: {$row['status']}, End Time: {$row['end_time']}\n";
    echo "  Will show in browse: " . ($row['will_show_in_browse'] ? 'YES ✓' : 'NO ✗') . "\n\n";
}

// Final count
$stmt = $pdo->query("SELECT COUNT(*) as cnt FROM auctions WHERE (status = 'approved' OR status = 'live' OR status = 'active') AND start_time <= NOW() AND end_time > NOW()");
$live_count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
echo "Total auctions that will show in browse: $live_count\n";
