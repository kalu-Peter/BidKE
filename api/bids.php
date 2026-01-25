<?php
header('Content-Type: application/json');

// CORS for local dev
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    $db = Database::getInstance()->getConnection();

    // Detect bidder column name in bids table (bidder_id or user_id)
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : null);

    // Detect auctions bid count column
    $aqStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'auctions' AND column_name IN ('bid_count','total_bids')");
    $aqStmt->execute();
    $aqCols = $aqStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidCountExpr = in_array('bid_count', $aqCols) ? 'a.bid_count' : (in_array('total_bids', $aqCols) ? 'a.total_bids AS bid_count' : '0 AS bid_count');

    // Buyer bids: auctions the user has placed bids on, with user's latest/max bid and auction summary
    $buyerBids = [];
    if ($bidderCol) {
        $buyerQuery = "SELECT a.id as auction_id, a.title, a.category_id, c.name AS category_name, a.seller_id, u.username AS seller_name,
                        COALESCE(a.current_price, a.starting_price) AS current_bid, {$bidCountExpr},
                        MAX(b.bid_amount) AS my_bid, MAX(b.bid_time) AS last_bid_time, a.start_time, a.end_time, a.status
                        FROM bids b
                        JOIN auctions a ON b.auction_id = a.id
                        LEFT JOIN categories c ON a.category_id = c.id
                        LEFT JOIN users u ON a.seller_id = u.id
                        WHERE b.{$bidderCol} = :user_id
                        GROUP BY a.id, a.title, a.category_id, c.name, a.seller_id, u.username, a.current_price, a.starting_price, a.start_time, a.end_time, a.status
                        ORDER BY last_bid_time DESC";

        $stmt = $db->prepare($buyerQuery);
        $stmt->execute([':user_id' => $userId]);
        $buyerBids = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Seller listings with recent bids summary
    $sellerListings = [];
    $sellerQuery = "SELECT a.id as auction_id, a.title, COALESCE(a.current_price, a.starting_price) AS current_bid, {$bidCountExpr}, a.start_time, a.end_time, a.status
                    FROM auctions a
                    WHERE a.seller_id = :seller_id
                    ORDER BY a.created_at DESC LIMIT 50";
    $sStmt = $db->prepare($sellerQuery);
    $sStmt->execute([':seller_id' => $userId]);
    $sellerListings = $sStmt->fetchAll(PDO::FETCH_ASSOC);

    // For seller listings, attach last bid if bids table exists
    if ($bidderCol && !empty($sellerListings)) {
        $ids = array_map(function ($r) {
            return (int)$r['auction_id'];
        }, $sellerListings);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $lastBidQuery = "SELECT auction_id, bid_amount, bid_time, " . ($bidderCol === 'bidder_id' ? 'bidder_id' : 'user_id') . " as bidder_id FROM bids WHERE auction_id IN ($placeholders) ORDER BY bid_time DESC";
        $lbStmt = $db->prepare($lastBidQuery);
        $lbStmt->execute($ids);
        $lastBids = $lbStmt->fetchAll(PDO::FETCH_ASSOC);
        $lastByAuction = [];
        foreach ($lastBids as $lb) {
            $aid = $lb['auction_id'];
            if (!isset($lastByAuction[$aid])) {
                $lastByAuction[$aid] = $lb;
            }
        }
        foreach ($sellerListings as &$sl) {
            $aid = $sl['auction_id'];
            if (isset($lastByAuction[$aid])) {
                $sl['last_bid'] = $lastByAuction[$aid];
            } else {
                $sl['last_bid'] = null;
            }
        }
        unset($sl);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'buyer_bids' => $buyerBids,
            'seller_listings' => $sellerListings
        ]
    ]);
} catch (Exception $e) {
    error_log('bids.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error', 'message' => $e->getMessage()]);
}
