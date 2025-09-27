<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $auctionId = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$auctionId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Auction ID is required'
            ]);
            exit();
        }

        // Get auction details with seller and category info
        $query = "
            SELECT 
                a.id,
                a.title,
                a.description,
                a.starting_price,
                a.current_bid,
                a.reserve_price,
                a.bid_increment,
                a.start_time,
                a.end_time,
                a.status,
                a.featured,
                a.view_count,
                a.bid_count,
                a.created_at,
                c.name as category_name,
                c.name as category_slug,
                COALESCE(u.full_name, u.fullname, u.username) as seller_name,
                u.email as seller_email,
                u.phone as seller_phone
            FROM auctions a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.seller_id = u.id
            WHERE a.id = :auction_id
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':auction_id' => $auctionId]);
        $auction = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$auction) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Auction not found'
            ]);
            exit();
        }

        // Get images for the auction
        $imageQuery = "SELECT file_path FROM auction_files WHERE auction_id = :auction_id AND file_type = 'image' ORDER BY id ASC";
        $imageStmt = $db->prepare($imageQuery);
        $imageStmt->execute([':auction_id' => $auctionId]);
        $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

        $auction['images'] = array_map(function ($path) {
            return 'http://localhost:8000' . $path;
        }, $images);

        // If no images, add default based on category
        if (empty($auction['images'])) {
            switch (strtolower($auction['category_name'])) {
                case 'cars':
                    $auction['images'] = ['/src/assets/category-cars.jpg'];
                    break;
                case 'motorbikes':
                    $auction['images'] = ['/src/assets/category-motorbikes.jpg'];
                    break;
                case 'electronics':
                    $auction['images'] = ['/src/assets/category-electronics.jpg'];
                    break;
                default:
                    $auction['images'] = ['/placeholder.svg'];
            }
        }

        // Get bid history (mock for now - would come from bids table)
        $auction['bid_history'] = [
            [
                'id' => 1,
                'bidder' => 'Buyer#1023',
                'amount' => (float)$auction['current_bid'],
                'timestamp' => date('H:i', strtotime('-30 minutes')),
                'isCurrentUser' => false
            ],
            [
                'id' => 2,
                'bidder' => 'Buyer#0987',
                'amount' => (float)$auction['current_bid'] - 5000,
                'timestamp' => date('H:i', strtotime('-45 minutes')),
                'isCurrentUser' => false
            ]
        ];

        // Calculate time remaining
        $endTime = new DateTime($auction['end_time']);
        $now = new DateTime();
        $timeRemaining = $now < $endTime ? $endTime->getTimestamp() - $now->getTimestamp() : 0;

        $auction['time_remaining'] = $timeRemaining;
        $auction['auction_ended'] = $timeRemaining <= 0;

        // Convert numeric fields
        $auction['id'] = (int)$auction['id'];
        $auction['starting_price'] = (float)$auction['starting_price'];
        $auction['current_bid'] = (float)$auction['current_bid'];
        $auction['reserve_price'] = $auction['reserve_price'] ? (float)$auction['reserve_price'] : null;
        $auction['bid_increment'] = $auction['bid_increment'] ? (float)$auction['bid_increment'] : 1000;
        $auction['featured'] = (bool)$auction['featured'];
        $auction['view_count'] = (int)$auction['view_count'];
        $auction['bid_count'] = (int)$auction['bid_count'];

        // Increment view count
        $updateViewQuery = "UPDATE auctions SET view_count = view_count + 1 WHERE id = :auction_id";
        $updateViewStmt = $db->prepare($updateViewQuery);
        $updateViewStmt->execute([':auction_id' => $auctionId]);

        echo json_encode([
            'success' => true,
            'data' => $auction
        ]);
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }
} catch (Exception $e) {
    error_log("Auction Details API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
