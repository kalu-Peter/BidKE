<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    $auctionId = $input['auction_id'] ?? null;
    $bidAmount = $input['bid_amount'] ?? null;
    $userId = $input['user_id'] ?? null;

    if (!$auctionId || !$bidAmount || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    $bidAmount = (float)$bidAmount;

    // Start transaction
    $db->beginTransaction();

    // Get current auction details
    $auctionQuery = "
        SELECT 
            id, title, current_price as current_bid, bid_increment, end_time, status, seller_id
        FROM auctions 
        WHERE id = :auction_id
    ";
    $auctionStmt = $db->prepare($auctionQuery);
    $auctionStmt->execute(['auction_id' => $auctionId]);
    $auction = $auctionStmt->fetch(PDO::FETCH_ASSOC);

    if (!$auction) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Auction not found']);
        exit();
    }

    // Check if auction is still active
    $now = new DateTime();
    $endTime = new DateTime($auction['end_time']);

    if ($now >= $endTime) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Auction has ended']);
        exit();
    }

    // Check if auction is live
    if ($auction['status'] !== 'live' && $auction['status'] !== 'approved') {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Auction is not currently active']);
        exit();
    }

    // Check if user is not the seller
    if ($auction['seller_id'] == $userId) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'You cannot bid on your own auction']);
        exit();
    }

    // Check minimum bid amount
    $minimumBid = $auction['current_bid'] + ($auction['bid_increment'] ?: 1000);

    if ($bidAmount < $minimumBid) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Bid must be at least KES " . number_format($minimumBid)
        ]);
        exit();
    }

    // Create bids table if it doesn't exist
    $createBidsTable = "
        CREATE TABLE IF NOT EXISTS bids (
            id SERIAL PRIMARY KEY,
            auction_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            bid_amount DECIMAL(15,2) NOT NULL,
            bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'active',
            FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ";
    $db->exec($createBidsTable);

    // Insert new bid
    $bidQuery = "
        INSERT INTO bids (auction_id, user_id, bid_amount, bid_time, status)
        VALUES (:auction_id, :user_id, :bid_amount, NOW(), 'active')
    ";
    $bidStmt = $db->prepare($bidQuery);
    $bidStmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId,
        'bid_amount' => $bidAmount
    ]);

    // Update auction with new current price and increment bid count
    $updateAuctionQuery = "
        UPDATE auctions 
        SET current_price = :bid_amount, 
            bid_count = bid_count + 1,
            updated_at = NOW()
        WHERE id = :auction_id
    ";
    $updateAuctionStmt = $db->prepare($updateAuctionQuery);
    $updateAuctionStmt->execute([
        'bid_amount' => $bidAmount,
        'auction_id' => $auctionId
    ]);

    // Mark previous bids as outbid
    $outbidQuery = "
        UPDATE bids 
        SET status = 'outbid' 
        WHERE auction_id = :auction_id 
        AND user_id != :user_id 
        AND status = 'active'
    ";
    $outbidStmt = $db->prepare($outbidQuery);
    $outbidStmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId
    ]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Bid placed successfully',
        'data' => [
            'auction_id' => $auctionId,
            'bid_amount' => $bidAmount,
            'new_current_bid' => $bidAmount,
            'bid_count' => $auction['bid_count'] + 1
        ]
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Place Bid API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to place bid: ' . $e->getMessage()
    ]);
}
