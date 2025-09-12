<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8081');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Database connection
function getDBConnection() {
    try {
        $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
        $connection = new PDO($dsn, 'postgres', 'webwiz', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        return $connection;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit();
    }
}

try {
    $auctionId = $_GET['id'] ?? null;
    
    if (!$auctionId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Auction ID is required']);
        exit();
    }
    
    $pdo = getDBConnection();
    
    // Get detailed auction information
    $query = "
        SELECT 
            a.id, a.title, a.description, a.starting_price, a.reserve_price,
            a.current_bid, a.bid_increment, a.start_time, a.end_time, a.status, 
            a.featured, a.view_count, a.bid_count, a.created_at, a.updated_at,
            u.id as seller_id, u.fullname as seller_name, u.email as seller_email, 
            u.phone as seller_phone, u.avatar_url as seller_avatar,
            c.id as category_id, c.name as category_name, c.slug as category_slug,
            CASE 
                WHEN v.id IS NOT NULL THEN 'vehicle'
                WHEN e.id IS NOT NULL THEN 'electronics'
                ELSE 'other'
            END as item_type,
            v.vehicle_type, v.make, v.model, v.year, v.registration_number,
            v.engine_capacity, v.fuel_type, v.transmission, v.mileage,
            v.color, v.condition as vehicle_condition, v.location as vehicle_location,
            e.category as electronics_category, e.brand, e.model as electronics_model,
            e.specs, e.serial_number, e.condition as electronics_condition,
            e.warranty, e.location as electronics_location
        FROM auctions a
        LEFT JOIN users u ON a.seller_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN vehicles v ON a.id = v.auction_id
        LEFT JOIN electronics e ON a.id = e.auction_id
        WHERE a.id = :auction_id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['auction_id' => $auctionId]);
    $auction = $stmt->fetch();
    
    if (!$auction) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Auction not found']);
        exit();
    }
    
    // Format the response based on item type
    $response = [
        'id' => (int)$auction['id'],
        'title' => $auction['title'],
        'description' => $auction['description'],
        'starting_price' => (float)$auction['starting_price'],
        'reserve_price' => $auction['reserve_price'] ? (float)$auction['reserve_price'] : null,
        'current_bid' => (float)$auction['current_bid'],
        'bid_increment' => (float)$auction['bid_increment'],
        'start_time' => $auction['start_time'],
        'end_time' => $auction['end_time'],
        'status' => $auction['status'],
        'featured' => (bool)$auction['featured'],
        'view_count' => (int)$auction['view_count'],
        'bid_count' => (int)$auction['bid_count'],
        'created_at' => $auction['created_at'],
        'updated_at' => $auction['updated_at'],
        'item_type' => $auction['item_type'],
        'seller' => [
            'id' => (int)$auction['seller_id'],
            'name' => $auction['seller_name'],
            'email' => $auction['seller_email'],
            'phone' => $auction['seller_phone'],
            'avatar' => $auction['seller_avatar']
        ],
        'category' => [
            'id' => (int)$auction['category_id'],
            'name' => $auction['category_name'],
            'slug' => $auction['category_slug']
        ]
    ];
    
    // Add item-specific details
    if ($auction['item_type'] === 'vehicle') {
        $response['vehicle_details'] = [
            'vehicle_type' => $auction['vehicle_type'],
            'make' => $auction['make'],
            'model' => $auction['model'],
            'year' => $auction['year'] ? (int)$auction['year'] : null,
            'registration_number' => $auction['registration_number'],
            'engine_capacity' => $auction['engine_capacity'],
            'fuel_type' => $auction['fuel_type'],
            'transmission' => $auction['transmission'],
            'mileage' => $auction['mileage'] ? (int)$auction['mileage'] : null,
            'color' => $auction['color'],
            'condition' => $auction['vehicle_condition'],
            'location' => $auction['vehicle_location']
        ];
    } elseif ($auction['item_type'] === 'electronics') {
        $response['electronics_details'] = [
            'category' => $auction['electronics_category'],
            'brand' => $auction['brand'],
            'model' => $auction['electronics_model'],
            'specs' => $auction['specs'],
            'serial_number' => $auction['serial_number'],
            'condition' => $auction['electronics_condition'],
            'warranty' => (bool)$auction['warranty'],
            'location' => $auction['electronics_location']
        ];
    }
    
    // Calculate auction duration
    $start = new DateTime($response['start_time']);
    $end = new DateTime($response['end_time']);
    $response['auction_duration'] = $start->diff($end)->days;
    
    // TODO: Get actual images and documents
    $response['images'] = [];
    $response['documents'] = [];
    $response['verification_status'] = 'documents_uploaded';
    
    // Get bidding history if auction is live
    if ($response['status'] === 'live') {
        $bidQuery = "
            SELECT COUNT(*) as total_bids,
                   MAX(amount) as highest_bid,
                   MIN(amount) as lowest_bid
            FROM bids 
            WHERE auction_id = :auction_id
        ";
        $bidStmt = $pdo->prepare($bidQuery);
        $bidStmt->execute(['auction_id' => $auctionId]);
        $bidStats = $bidStmt->fetch();
        
        $response['bid_stats'] = $bidStats;
        
        // Calculate time remaining
        $now = new DateTime();
        $endTime = new DateTime($response['end_time']);
        if ($endTime > $now) {
            $diff = $now->diff($endTime);
            $response['time_remaining'] = [
                'days' => $diff->days,
                'hours' => $diff->h,
                'minutes' => $diff->i,
                'formatted' => $diff->days . 'd ' . $diff->h . 'h ' . $diff->i . 'm'
            ];
        } else {
            $response['time_remaining'] = null;
            $response['status'] = 'ended'; // Auto-update status if expired
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $response
    ]);
    
} catch (Exception $e) {
    error_log("Auction details error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch auction details']);
}
?>
