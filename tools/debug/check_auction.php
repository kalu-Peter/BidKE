<?php
require_once __DIR__ . '/../../api/config/connect.php';

$auctionId = $argv[1] ?? 7;
try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->prepare('SELECT * FROM auctions WHERE id = :id');
    $stmt->execute([':id' => $auctionId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Auction row:\n";
    print_r($row);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
