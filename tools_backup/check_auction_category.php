<?php
require_once __DIR__ . '/../api/config/connect.php';
$db = Database::getInstance()->getConnection();
$id = $argv[1] ?? 0;
if (!$id) {
    echo "Usage: php check_auction_category.php <auction_id>\n";
    exit(1);
}
$stmt = $db->prepare('SELECT id, category_id FROM auctions WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo "Auction not found\n";
    exit(1);
}
echo json_encode($row) . PHP_EOL;
