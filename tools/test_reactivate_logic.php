<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

// Check if there are any ended auctions
echo "=== CHECKING FOR ENDED AUCTIONS ===\n";
$stmt = $pdo->query("SELECT id, title, status, end_time FROM auctions WHERE status = 'ended' LIMIT 3");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "No ended auctions found. Creating a test one...\n";
    // Create a test ended auction by updating one of the active ones
    $stmt = $pdo->prepare("
        UPDATE auctions 
        SET status = 'ended', end_time = NOW() - INTERVAL 1 day
        WHERE id = (SELECT id FROM auctions WHERE status = 'active' LIMIT 1)
        RETURNING id, title, status, end_time
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

if (!empty($rows)) {
    echo "Found " . count($rows) . " ended auction(s):\n";
    foreach ($rows as $row) {
        echo "  - ID: {$row['id']}, Title: {$row['title']}, Status: {$row['status']}, End: {$row['end_time']}\n";
    }

    // Test the reactivate logic
    $testAuctionId = $rows[0]['id'];
    echo "\n=== TESTING REACTIVATE LOGIC ===\n";
    echo "Testing reactivate for auction ID: $testAuctionId\n";

    // Simulate the reactivate action
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $newEnd = (new DateTime('@' . ($now->getTimestamp() + 90 * 24 * 3600)))->setTimeZone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');

    echo "Current time: " . $now->format('Y-m-d H:i:s') . "\n";
    echo "New end time will be: $newEnd\n";
    echo "Duration: 90 days\n";
} else {
    echo "Could not find or create test ended auction\n";
}
