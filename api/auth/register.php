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
    $required_fields = ['email', 'password', 'role', 'full_name', 'phone'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '$field' is required");
        }
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $password = $input['password'];
    $role = $input['role'];
    $full_name = trim($input['full_name']);
    $phone = trim($input['phone']);
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate role
    if (!in_array($role, ['buyer', 'seller'])) {
        throw new Exception('Invalid role. Must be buyer or seller');
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        throw new Exception('Password must be at least 8 characters long');
    }
    
    // Connect to database
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        throw new Exception('Email already registered');
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate verification code
    $verification_code = sprintf('%06d', mt_rand(100000, 999999));
    $verification_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (email, password_hash, role, full_name, phone, verification_code, verification_expires, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$email, $password_hash, $role, $full_name, $phone, $verification_code, $verification_expires]);
        
        $user_id = $pdo->lastInsertId();
        
        // Create role-specific profile
        if ($role === 'buyer') {
            // Additional buyer fields
            $national_id = $input['national_id'] ?? null;
            $date_of_birth = $input['date_of_birth'] ?? null;
            $address = $input['address'] ?? null;
            
            $stmt = $pdo->prepare("
                INSERT INTO buyer_profiles (user_id, national_id, date_of_birth, address, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$user_id, $national_id, $date_of_birth, $address]);
            
        } elseif ($role === 'seller') {
            // Additional seller fields
            $business_name = $input['business_name'] ?? null;
            $business_type = $input['business_type'] ?? null;
            $business_registration = $input['business_registration'] ?? null;
            $tax_pin = $input['tax_pin'] ?? null;
            $business_address = $input['business_address'] ?? null;
            $business_phone = $input['business_phone'] ?? null;
            
            $stmt = $pdo->prepare("
                INSERT INTO seller_profiles (
                    user_id, business_name, business_type, business_registration, 
                    tax_pin, business_address, business_phone, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $user_id, $business_name, $business_type, $business_registration,
                $tax_pin, $business_address, $business_phone
            ]);
        }
        
        $pdo->commit();
        
        // In a real application, send verification email/SMS here
        // For demo purposes, we'll include the code in the response
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful. Please verify your email.',
            'user_id' => $user_id,
            'verification_code' => $verification_code // Remove in production
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
