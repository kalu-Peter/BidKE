<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo json_encode([
        'success' => true,
        'message' => 'Basic endpoint working',
        'data' => [],
        'total' => 0,
        'page' => 1,
        'limit' => 5
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
