<?php
// Usage (CLI): php debug_auction.php <auction_id> [--finalize]
chdir(__DIR__);
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/finalize_helper.php';

$argc = $_SERVER['argc'];
$argv = $_SERVER['argv'];
if ($argc < 2) {
    echo "Usage: php debug_auction.php <auction_id> [--finalize]\n";
    exit(1);
}

$auctionId = (int)$argv[1];
$doFinalize = in_array('--finalize', $argv, true);

$db = Database::getInstance()->getConnection();

echo "Inspecting auction id: $auctionId\n";

$stmt = $db->prepare("SELECT * FROM auctions WHERE id = :id");
$stmt->execute([':id' => $auctionId]);
$auction = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$auction) {
    echo "Auction not found\n";
    exit(1);
}

echo "Auction row:\n";
print_r($auction);

// List bids
$bstmt = $db->prepare("SELECT * FROM bids WHERE auction_id = :aid ORDER BY bid_time ASC");
$bstmt->execute([':aid' => $auctionId]);
$bids = $bstmt->fetchAll(PDO::FETCH_ASSOC);
echo "Bids (" . count($bids) . "):\n";
foreach ($bids as $b) {
    print_r($b);
}

if ($doFinalize) {
    echo "\nRunning finalizeAuction...\n";
    $res = finalizeAuction($db, $auctionId);
    echo "Result:\n";
    print_r($res);

    // Re-fetch auction and bids after finalize
    $stmt->execute([':id' => $auctionId]);
    $auction2 = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nAuction after finalize:\n";
    print_r($auction2);
    $bstmt->execute([':aid' => $auctionId]);
    $bids2 = $bstmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Bids after finalize:\n";
    foreach ($bids2 as $b) print_r($b);
}

echo "Done.\n";
