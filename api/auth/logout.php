<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get session token from request or session
    $session_token = null;
    
    // Try to get token from Authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $session_token = str_replace('Bearer ', '', $headers['Authorization']);
    }
    
    // Try to get token from session
    if (!$session_token && isset($_SESSION['session_token'])) {
        $session_token = $_SESSION['session_token'];
    }
    
    if ($session_token) {
        // Connect to database and invalidate session
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        
        $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE session_token = ?");
        $stmt->execute([$session_token]);
    }
    
    // Destroy PHP session
    session_destroy();
    
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Logout failed: ' . $e->getMessage()
    ]);
}
?>
