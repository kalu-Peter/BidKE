<?php
header('Content-Type: application/json');

// CORS for local dev
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/config/connect.php';
require_once __DIR__ . '/models/Auth.php';

try {
    $user = Auth::requireAuth();
    $userId = $user['user_id'];

    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = isset($input['auction_id']) ? (int)$input['auction_id'] : null;

    if (!$auctionId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'auction_id required']);
        exit();
    }

    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    // Ensure bids table exists
    $db->exec("CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER NOT NULL,
        user_id INTEGER,
        bidder_id INTEGER,
        bid_amount DECIMAL(15,2) NOT NULL,
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active'
    )");

    // Detect bidder column name
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('user_id', $cols) ? 'user_id' : (in_array('bidder_id', $cols) ? 'bidder_id' : 'user_id');

    // Mark user's active bids on this auction as cancelled
    $cancelSql = "UPDATE bids SET status = 'cancelled' WHERE auction_id = :auction_id AND {$bidderCol} = :user_id AND status = 'active'";
    $cancelStmt = $db->prepare($cancelSql);
    $cancelStmt->execute(['auction_id' => $auctionId, 'user_id' => $userId]);

    // Recompute the highest remaining active bid for the auction
    $highestStmt = $db->prepare("SELECT bid_amount FROM bids WHERE auction_id = :auction_id AND status = 'active' ORDER BY bid_amount DESC LIMIT 1");
    $highestStmt->execute(['auction_id' => $auctionId]);
    $highest = $highestStmt->fetch(PDO::FETCH_ASSOC);

    // Update auction current_price and bid count
    $aqColStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'auctions'");
    $aqColStmt->execute();
    $aqCols = $aqColStmt->fetchAll(PDO::FETCH_COLUMN);

    $newCurrent = $highest ? (float)$highest['bid_amount'] : null;

    if (in_array('bid_count', $aqCols)) {
        // Count active bids
        $countStmt = $db->prepare("SELECT COUNT(*) as c FROM bids WHERE auction_id = :auction_id AND status = 'active'");
        $countStmt->execute(['auction_id' => $auctionId]);
        $count = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['c'];
        $upd = $db->prepare("UPDATE auctions SET current_price = :current_price, bid_count = :count, updated_at = NOW() WHERE id = :auction_id");
        $upd->execute(['current_price' => $newCurrent, 'count' => $count, 'auction_id' => $auctionId]);
    } elseif (in_array('total_bids', $aqCols)) {
        $countStmt = $db->prepare("SELECT COUNT(*) as c FROM bids WHERE auction_id = :auction_id AND status = 'active'");
        $countStmt->execute(['auction_id' => $auctionId]);
        $count = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['c'];
        $upd = $db->prepare("UPDATE auctions SET current_price = :current_price, total_bids = :count, updated_at = NOW() WHERE id = :auction_id");
        $upd->execute(['current_price' => $newCurrent, 'count' => $count, 'auction_id' => $auctionId]);
    } else {
        $upd = $db->prepare("UPDATE auctions SET current_price = :current_price, updated_at = NOW() WHERE id = :auction_id");
        $upd->execute(['current_price' => $newCurrent, 'auction_id' => $auctionId]);
    }

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Bid withdrawn', 'data' => ['auction_id' => $auctionId]]);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('withdraw-bid error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to withdraw bid']);
}
