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
            // treat 'live' as any server-side state representing an active auction
            $conditions[] = "(a.status = 'approved' OR a.status = 'live' OR a.status = 'active') AND a.start_time <= NOW() AND a.end_time > NOW()";
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

        // Add price filters (use current_price column present in DB)
        if ($min_price !== null) {
            $conditions[] = "a.current_price >= :min_price";
            $params[':min_price'] = $min_price;
        }
        if ($max_price !== null) {
            $conditions[] = "a.current_price <= :max_price";
            $params[':max_price'] = $max_price;
        }

        // Combine conditions
        if (!empty($conditions)) {
            $baseQuery .= " AND " . implode(" AND ", $conditions);
        }

        // Detect whether auctions table has view_count / bid_count / total_bids columns
        $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'auctions' AND column_name IN ('view_count','bid_count','total_bids')");
        $colStmt->execute();
        $existingCols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

        $viewSelect = in_array('view_count', $existingCols) ? 'a.view_count' : '0 AS view_count';
        if (in_array('bid_count', $existingCols)) {
            $bidSelect = 'a.bid_count';
        } elseif (in_array('total_bids', $existingCols)) {
            $bidSelect = 'a.total_bids AS bid_count';
        } else {
            $bidSelect = '0 AS bid_count';
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
                a.current_price,
                a.reserve_price,
                a.start_time,
                a.end_time,
                a.status,
                a.featured,
                " . $viewSelect . ",
                " . $bidSelect . ",
                c.name as category_name,
                c.name as category_slug,
                COALESCE(u.full_name, u.username) as seller_name,
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

        // Determine image table/column available
        $tablesStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_name IN ('auction_files','auction_images')");
        $tablesStmt->execute();
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        $useAuctionFiles = in_array('auction_files', $tables);
        $useAuctionImages = in_array('auction_images', $tables) && !$useAuctionFiles;

        // Get images for each auction
        foreach ($auctions as &$auction) {
            if ($useAuctionFiles) {
                $imageQuery = "SELECT file_path FROM auction_files WHERE auction_id = :auction_id AND file_type = 'image' ORDER BY id ASC";
            } elseif ($useAuctionImages) {
                // auction_images uses image_url and has is_active/sort_order
                $imageQuery = "SELECT image_url as file_path FROM auction_images WHERE auction_id = :auction_id AND is_active = TRUE ORDER BY sort_order ASC, is_primary DESC";
            } else {
                $imageQuery = null;
            }

            $images = [];
            if ($imageQuery) {
                $imageStmt = $db->prepare($imageQuery);
                $imageStmt->execute([':auction_id' => $auction['id']]);
                $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);
            }

            $auction['images'] = $images;

            // Convert numeric fields
            $auction['id'] = (int)$auction['id'];
            $auction['starting_price'] = (float)$auction['starting_price'];
            // current_price exists in DB schema
            $auction['current_price'] = isset($auction['current_price']) ? (float)$auction['current_price'] : null;
            $auction['reserve_price'] = $auction['reserve_price'] ? (float)$auction['reserve_price'] : null;
            $auction['featured'] = (bool)$auction['featured'];
            $auction['view_count'] = isset($auction['view_count']) ? (int)$auction['view_count'] : 0;
            $auction['bid_count'] = isset($auction['bid_count']) ? (int)$auction['bid_count'] : 0;
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
