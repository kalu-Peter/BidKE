<?php
require_once __DIR__ . '/../api/config/connect.php';
require_once __DIR__ . '/../api/models/Auth.php';

$pdo = Database::getInstance()->getConnection();

// Test seller-auctions endpoint logic
echo "=== TESTING SELLER AUCTIONS QUERY ===\n";

// Assume user_id = 1 for testing
$sellerId = 1;
$status = 'all';

$whereClause = "WHERE seller_id = ?";
$params = [$sellerId];

// Count
$countQuery = "SELECT COUNT(*) as total FROM auctions a $whereClause";
$countStmt = $pdo->prepare($countQuery);
$countStmt->execute($params);
$total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

echo "Total auctions for seller_id=$sellerId: $total\n";

// Get sample auctions
$query = "SELECT id, title, status, seller_id FROM auctions $whereClause LIMIT 5";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nSample auctions:\n";
foreach ($auctions as $auction) {
    echo "  ID: {$auction['id']}, Title: {$auction['title']}, Status: {$auction['status']}, Seller: {$auction['seller_id']}\n";
}

// Test bids endpoint logic
echo "\n=== TESTING BIDS QUERY ===\n";

$userId = 1;

// Detect bidder column
$colStmt = $pdo->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
$colStmt->execute();
$cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
$bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : null);

echo "Bidder column in bids table: " . ($bidderCol ?: 'NOT FOUND') . "\n";

// Count bids
if ($bidderCol) {
    $bidCountQuery = "SELECT COUNT(*) as total FROM bids WHERE $bidderCol = ?";
    $bidCountStmt = $pdo->prepare($bidCountQuery);
    $bidCountStmt->execute([$userId]);
    $bidCount = $bidCountStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo "Total bids placed by user_id=$userId: $bidCount\n";
    
    // Get sample bids
    $bidQuery = "SELECT b.auction_id, b.$bidderCol, a.title FROM bids b
                 JOIN auctions a ON b.auction_id = a.id
                 WHERE b.$bidderCol = ?
                 LIMIT 5";
    $bidStmt = $pdo->prepare($bidQuery);
    $bidStmt->execute([$userId]);
    $bids = $bidStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nSample bids:\n";
    foreach ($bids as $bid) {
        echo "  Auction ID: {$bid['auction_id']}, Title: {$bid['title']}\n";
    }
} else {
    echo "ERROR: Could not find bidder column in bids table\n";
}
?>
