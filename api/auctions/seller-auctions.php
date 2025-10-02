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

    // Build query
    $whereClause = "WHERE seller_id = ?";
    $params = [$sellerId];

    if ($status !== 'all') {
        $whereClause .= " AND status = ?";
        $params[] = $status;
    }

    // Get total count
    $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM auctions $whereClause");
    $countStmt->execute($params);
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get auctions with pagination
    $stmt = $pdo->prepare("
            SELECT a.*, 
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
                   ) as category_name
            FROM auctions a
            $whereClause
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ");
    $params[] = $limit;
    $params[] = $offset;
    $stmt->execute($params);
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
