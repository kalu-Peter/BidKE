<?php
// Ultra simple auction endpoint for testing

// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Basic headers with dynamic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8081';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper functions
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

function sendSuccess($data, $message = 'Success') {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data]);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    sendError('Invalid JSON data', 400);
}

// Return success without any database operations
sendSuccess([
    'received' => true,
    'item_type' => $data['itemType'] ?? 'unknown',
    'title' => $data['title'] ?? 'unknown',
    'timestamp' => date('Y-m-d H:i:s')
], 'Data received successfully - no database operations');
?>
