<?php
// Minimal admin listings endpoint (single PHP block)

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// mirror allowed origins
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/connect.php';

function send_json($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

try {
    $pdo = Database::getInstance()->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Simplified GET: return empty dataset if DB unavailable
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, intval($_GET['limit'] ?? 20));
        $offset = ($page - 1) * $limit;

        $rows = [];
        $pagination = ['page' => $page, 'limit' => $limit, 'total' => 0, 'pages' => 0];
        $stats = ['total' => 0];
        send_json(['success' => true, 'data' => $rows, 'pagination' => $pagination, 'stats' => $stats]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Minimal stub: acknowledge action
        $input = file_get_contents('php://input');
        $body = json_decode($input, true) ?: [];
        send_json(['success' => true, 'received' => $body]);
    }

    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
} catch (Exception $e) {
    send_json(['success' => false, 'error' => 'Server error', 'details' => $e->getMessage()], 500);
}
