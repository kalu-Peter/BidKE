<?php
// Debug version of buyer-profile.php to check incoming data
ini_set('display_errors', 0);
error_reporting(0);

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log the incoming data
    file_put_contents(__DIR__ . '/debug.log', 
        "Incoming data: " . print_r($input, true) . "\n", 
        FILE_APPEND | LOCK_EX
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Debug: Data received and logged',
        'received_data' => $input
    ]);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Debug endpoint working',
    'method' => $_SERVER['REQUEST_METHOD']
]);
?>
