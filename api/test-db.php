<?php
header('Content-Type: application/json');

try {
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    // Simple test query
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Database connection successful',
        'test_result' => $result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
}
?>