<?php
require_once __DIR__ . '/../config/connect.php';
$db = Database::getInstance()->getConnection();
$aid = $argv[1] ?? null;
if (!$aid) {
    echo "Usage: php check_auction_state.php <auction_id>\n";
    exit(1);
}
$aid = (int)$aid;
$stmt = $db->prepare('SELECT id, status, current_price, current_bidder_id, end_time FROM auctions WHERE id = :id');
$stmt->execute([':id' => $aid]);
$a = $stmt->fetch(PDO::FETCH_ASSOC);
echo "AUCTION:\n";
print_r($a);
$bstmt = $db->prepare('SELECT id, bidder_id, bid_amount, bid_status FROM bids WHERE auction_id = :aid');
$bstmt->execute([':aid' => $aid]);
$b = $bstmt->fetchAll(PDO::FETCH_ASSOC);
echo "BIDS:\n";
print_r($b);
$wstmt = $db->prepare("SELECT * FROM information_schema.tables WHERE table_name = 'auction_winners'");
$wstmt->execute();
if ($wstmt->fetchColumn()) {
    $win = $db->prepare('SELECT * FROM auction_winners WHERE auction_id = :aid');
    $win->execute([':aid' => $aid]);
    echo "AUCTION_WINNERS:\n";
    print_r($win->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo "No auction_winners table present\n";
}
