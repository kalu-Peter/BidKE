<?php
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
    if (empty($input['email']) || empty($input['verification_code'])) {
        throw new Exception('Email and verification code are required');
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $verification_code = $input['verification_code'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Connect to database
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Get user with verification code
    $stmt = $pdo->prepare("
        SELECT id, verification_code, verification_expires, is_verified, status 
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    if ($user['is_verified']) {
        throw new Exception('Account is already verified');
    }
    
    // Check if verification code matches
    if ($user['verification_code'] !== $verification_code) {
        throw new Exception('Invalid verification code');
    }
    
    // Check if verification code has expired
    if (strtotime($user['verification_expires']) < time()) {
        throw new Exception('Verification code has expired. Please request a new one.');
    }
    
    // Update user as verified
    $stmt = $pdo->prepare("
        UPDATE users 
        SET is_verified = 1, 
            status = 'email_verified',
            verification_code = NULL,
            verification_expires = NULL,
            verified_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Account verified successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

// Function to resend verification code
function resendVerificationCode($email) {
    try {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        
        $stmt = $pdo->prepare("SELECT id, is_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            throw new Exception('User not found');
        }
        
        if ($user['is_verified']) {
            throw new Exception('Account is already verified');
        }
        
        // Generate new verification code
        $verification_code = sprintf('%06d', mt_rand(100000, 999999));
        $verification_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET verification_code = ?, verification_expires = ?
            WHERE id = ?
        ");
        $stmt->execute([$verification_code, $verification_expires, $user['id']]);
        
        // In a real application, send email/SMS here
        
        return [
            'success' => true,
            'message' => 'Verification code sent successfully',
            'verification_code' => $verification_code // Remove in production
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Handle resend verification request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'resend') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        exit;
    }
    
    $result = resendVerificationCode($input['email']);
    
    if (!$result['success']) {
        http_response_code(400);
    }
    
    echo json_encode($result);
}
?>
