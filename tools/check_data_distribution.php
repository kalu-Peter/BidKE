<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

echo "=== ALL USERS ===\n";
$stmt = $pdo->query("SELECT id, username, email FROM users LIMIT 10");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $user) {
    echo "ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}\n";
}

echo "\n=== AUCTIONS BY USER ===\n";
$stmt = $pdo->query("SELECT seller_id, COUNT(*) as count FROM auctions GROUP BY seller_id ORDER BY count DESC");
$sellers = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($sellers as $seller) {
    $stmt2 = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $stmt2->execute([$seller['seller_id']]);
    $user = $stmt2->fetch(PDO::FETCH_ASSOC);
    $username = $user['username'] ?? 'Unknown';
    echo "User ID: {$seller['seller_id']} ($username) - {$seller['count']} auctions\n";
}

echo "\n=== BIDS BY USER ===\n";
$stmt = $pdo->query("SELECT bidder_id, COUNT(*) as count FROM bids GROUP BY bidder_id ORDER BY count DESC");
$bidders = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($bidders as $bidder) {
    $stmt2 = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $stmt2->execute([$bidder['bidder_id']]);
    $user = $stmt2->fetch(PDO::FETCH_ASSOC);
    $username = $user['username'] ?? 'Unknown';
    echo "User ID: {$bidder['bidder_id']} ($username) - {$bidder['count']} bids\n";
}

echo "\n=== ACTIVE AUCTIONS ===\n";
$stmt = $pdo->query("SELECT id, title, seller_id, status FROM auctions WHERE status IN ('active', 'live', 'approved') LIMIT 5");
$auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($auctions) . "\n";
foreach ($auctions as $auction) {
    $stmt2 = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $stmt2->execute([$auction['seller_id']]);
    $user = $stmt2->fetch(PDO::FETCH_ASSOC);
    $username = $user['username'] ?? 'Unknown';
    echo "ID: {$auction['id']}, Title: {$auction['title']}, Seller: $username, Status: {$auction['status']}\n";
}
?>
