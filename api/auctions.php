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

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get query parameters
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
        $status = isset($_GET['status']) ? $_GET['status'] : 'live';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $category = isset($_GET['category']) ? $_GET['category'] : '';
        $min_price = isset($_GET['min_price']) ? (float)$_GET['min_price'] : null;
        $max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;

        // Calculate offset
        $offset = ($page - 1) * $limit;

        // Build base query
        $baseQuery = "
            FROM auctions a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.seller_id = u.id
            WHERE 1=1
        ";

        $params = [];
        $conditions = [];

        // Add status filter
        if ($status === 'live') {
            $conditions[] = "a.status = 'approved' AND a.start_time <= NOW() AND a.end_time > NOW()";
        } elseif ($status !== 'all') {
            $conditions[] = "a.status = :status";
            $params[':status'] = $status;
        }

        // Add search filter
        if (!empty($search)) {
            $conditions[] = "(a.title LIKE :search OR a.description LIKE :search OR c.name LIKE :search)";
            $params[':search'] = "%$search%";
        }

        // Add category filter
        if (!empty($category) && $category !== 'all') {
            $conditions[] = "LOWER(c.name) = LOWER(:category)";
            $params[':category'] = $category;
        }

        // Add price filters
        if ($min_price !== null) {
            $conditions[] = "a.current_bid >= :min_price";
            $params[':min_price'] = $min_price;
        }
        if ($max_price !== null) {
            $conditions[] = "a.current_bid <= :max_price";
            $params[':max_price'] = $max_price;
        }

        // Combine conditions
        if (!empty($conditions)) {
            $baseQuery .= " AND " . implode(" AND ", $conditions);
        }

        // Count total records
        $countQuery = "SELECT COUNT(*) as total " . $baseQuery;
        $countStmt = $db->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get auctions with pagination
        $query = "
            SELECT 
                a.id,
                a.title,
                a.description,
                a.starting_price,
                a.current_bid,
                a.reserve_price,
                a.start_time,
                a.end_time,
                a.status,
                a.featured,
                a.view_count,
                a.bid_count,
                c.name as category_name,
                c.name as category_slug,
                COALESCE(u.full_name, u.fullname, u.username) as seller_name,
                u.email as seller_email
            " . $baseQuery . "
            ORDER BY a.featured DESC, a.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        
        // Bind pagination parameters
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        // Bind other parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get images for each auction
        foreach ($auctions as &$auction) {
            $imageQuery = "SELECT file_path FROM auction_files WHERE auction_id = :auction_id AND file_type = 'image' ORDER BY id ASC";
            $imageStmt = $db->prepare($imageQuery);
            $imageStmt->execute([':auction_id' => $auction['id']]);
            $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $auction['images'] = $images;
            
            // Convert numeric fields
            $auction['id'] = (int)$auction['id'];
            $auction['starting_price'] = (float)$auction['starting_price'];
            $auction['current_bid'] = (float)$auction['current_bid'];
            $auction['reserve_price'] = $auction['reserve_price'] ? (float)$auction['reserve_price'] : null;
            $auction['featured'] = (bool)$auction['featured'];
            $auction['view_count'] = (int)$auction['view_count'];
            $auction['bid_count'] = (int)$auction['bid_count'];
        }

        // Calculate pagination info
        $totalPages = ceil($total / $limit);

        echo json_encode([
            'success' => true,
            'data' => $auctions,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => (int)$totalPages
            ]
        ]);

    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }

} catch (Exception $e) {
    error_log("Auctions API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>