<?php
// Simple debug endpoint to capture errors
ini_set('display_errors', 1);
error_reporting(E_ALL);

function setCorsHeaders()
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
}

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../config/connect.php';
    require_once '../models/SellerProfile.php';
    require_once '../models/Auth.php';
    require_once '../models/User.php';

    $user = Auth::requireAuth();
    $user_id = $user['user_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true) ?: [];

        echo json_encode([
            'success' => true,
            'debug' => [
                'user_id' => $user_id,
                'raw_input' => $json,
                'parsed_data' => $data,
                'data_types' => array_map('gettype', $data)
            ]
        ]);
    } else {
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
