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
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['email']) || empty($input['password'])) {
        throw new Exception('Email and password are required');
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $password = $input['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Connect to database
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Get user with profile data
    $stmt = $pdo->prepare("
        SELECT u.*, 
               CASE 
                   WHEN u.role = 'buyer' THEN bp.national_id
                   WHEN u.role = 'seller' THEN sp.business_name
                   ELSE NULL
               END as profile_data
        FROM users u
        LEFT JOIN buyer_profiles bp ON u.id = bp.user_id AND u.role = 'buyer'
        LEFT JOIN seller_profiles sp ON u.id = sp.user_id AND u.role = 'seller'
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        throw new Exception('Invalid email or password');
    }
    
    // Check if account is suspended
    if ($user['status'] === 'suspended') {
        throw new Exception('Your account has been suspended. Please contact support.');
    }
    
    // Generate session token
    $session_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    // Save session to database
    $stmt = $pdo->prepare("
        INSERT INTO user_sessions (user_id, session_token, expires_at, created_at) 
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        session_token = VALUES(session_token), 
        expires_at = VALUES(expires_at), 
        updated_at = NOW()
    ");
    $stmt->execute([$user['id'], $session_token, $expires_at]);
    
    // Set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['session_token'] = $session_token;
    $_SESSION['user_role'] = $user['role'];
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Prepare user data for response
    $user_data = [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'full_name' => $user['full_name'],
        'phone' => $user['phone'],
        'status' => $user['status'],
        'is_verified' => (bool)$user['is_verified'],
        'created_at' => $user['created_at']
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => $user_data,
        'session_token' => $session_token
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
