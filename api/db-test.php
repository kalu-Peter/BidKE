<?php
require_once './config/connect.php';

// Test database connection and show tables
try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Test connection
    $connectionTest = $db->testConnection();
    
    // Get table list
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    $tables = $stmt->fetchAll();
    
    // Get user count
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $userCount = $stmt->fetch()['count'];
    } catch (Exception $e) {
        $userCount = "Table not found";
    }
    
    $response = [
        'success' => true,
        'connection' => $connectionTest,
        'tables' => $tables,
        'user_count' => $userCount,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
