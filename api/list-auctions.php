<?php
header('Content-Type: application/json');

try {
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    // Get some basic auction info
    $stmt = $db->query("SELECT id, title, status FROM auctions LIMIT 5");
    $auctions = $stmt->fetchAll();
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Auctions found',
        'data' => $auctions
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>