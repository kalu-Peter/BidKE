<?php
header('Content-Type: application/json');

// Allow development ports/origins (mirror other endpoints)
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once '../config/connect.php';
require_once '../models/Auth.php';

// Ensure we have a PDO connection from the shared Database class
try {
    if (class_exists('Database')) {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
    } elseif (function_exists('getDBConnection')) {
        $pdo = getDBConnection();
    }
} catch (Exception $e) {
    error_log('DB connection failed in seller-auctions: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

try {
    // Require authentication
    $user = Auth::requireAuth();
    $sellerId = $user['user_id'];

    // Get query parameters
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Build query with status logic
    $whereClause = "WHERE seller_id = ?";
    $params = [$sellerId];

    // Handle special status filters
    if ($status !== 'all') {
        if ($status === 'live') {
            // Live = active auctions
            $whereClause .= " AND status = 'active'";
        } elseif ($status === 'sold') {
            // Sold = auctions with 'sold' status OR 'ended' status with winner
            $whereClause .= " AND (status = 'sold' OR (status = 'ended' AND EXISTS (SELECT 1 FROM auction_winners aw WHERE aw.auction_id = a.id)))";
        } elseif ($status === 'ended') {
            // Ended = ended auctions without winner
            $whereClause .= " AND status = 'ended' AND NOT EXISTS (SELECT 1 FROM auction_winners aw WHERE aw.auction_id = a.id)";
        } else {
            // Direct status match for draft, pending, cancelled
            $whereClause .= " AND status = ?";
            $params[] = $status;
        }
    }

    // Get total count using same logic
    $countQuery = "SELECT COUNT(*) as total FROM auctions a $whereClause";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get auctions with pagination and calculated status
    $stmt = $pdo->prepare("
            SELECT a.*, 
                   CASE 
                       WHEN a.status = 'active' THEN 'live'
                       WHEN a.status = 'sold' THEN 'sold'
                       WHEN a.status = 'ended' AND aw.auction_id IS NOT NULL THEN 'sold'
                       WHEN a.status = 'ended' AND aw.auction_id IS NULL THEN 'ended'
                       ELSE a.status 
                   END as calculated_status,
                   aw.winning_amount,
                   aw.winner_id,
                   (
                       SELECT af.file_path
                       FROM auction_files af
                       WHERE af.auction_id = a.id AND af.file_type = 'image'
                       ORDER BY af.uploaded_at DESC, af.id DESC
                       LIMIT 1
                   ) as image_path,
                   (
                       SELECT ai.image_url
                       FROM auction_images ai
                       WHERE ai.auction_id = a.id
                       ORDER BY ai.id DESC
                       LIMIT 1
                   ) as image_url,
                   (
                      SELECT c2.name FROM categories c2 WHERE c2.id = a.category_id LIMIT 1
                   ) as category_name,
                   (
                       SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id
                   ) as bid_count,
                   (
                       SELECT MAX(b.bid_amount) FROM bids b WHERE b.auction_id = a.id
                   ) as current_bid,
                   CASE 
                       WHEN a.end_time > NOW() THEN EXTRACT(EPOCH FROM (a.end_time - NOW()))::integer
                       ELSE 0
                   END as time_remaining,
                   CASE 
                       WHEN a.end_time <= NOW() THEN true
                       ELSE false
                   END as auction_ended
            FROM auctions a
            LEFT JOIN auction_winners aw ON a.id = aw.auction_id
            $whereClause
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ");
    $params[] = $limit;
    $params[] = $offset;
    $stmt->execute($params);
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Update status field with calculated_status for consistent frontend handling
    foreach ($auctions as &$auction) {
        if (isset($auction['calculated_status'])) {
            $auction['status'] = $auction['calculated_status'];
        }
        // Ensure numeric values are properly typed
        $auction['bid_count'] = (int)($auction['bid_count'] ?? 0);
        $auction['current_bid'] = $auction['current_bid'] ? (float)$auction['current_bid'] : null;
        $auction['time_remaining'] = (int)($auction['time_remaining'] ?? 0);
        $auction['auction_ended'] = (bool)($auction['auction_ended'] ?? false);
    }

    // Calculate pagination info
    $pages = ceil($total / $limit);

    echo json_encode([
        'success' => true,
        'data' => [
            'auctions' => $auctions,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $pages
            ]
        ]
    ]);
} catch (Exception $e) {
    // Log full exception for diagnostics
    error_log("Seller auctions exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    error_log($e->getTraceAsString());

    // Prefer centralized JSON error response if available
    if (function_exists('send_json_error_response')) {
        // Include exception message in details for dev debugging
        send_json_error_response('Internal server error', 500, ['message' => $e->getMessage()]);
    }

    // Fallback minimal JSON
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
