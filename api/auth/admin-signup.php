<?php
// Set CORS headers FIRST - before any other code
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Disable ALL error output to ensure clean JSON responses
ini_set('display_errors', 0);
error_reporting(0);

// Handle preflight requests IMMEDIATELY
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only then include other files
require_once '../config/connect.php';
require_once '../models/User.php';
require_once '../models/BuyerProfile.php';

// Try to include AdminProfile, but don't fail if it doesn't exist
if (file_exists('../models/AdminProfile.php')) {
    require_once '../models/AdminProfile.php';
    $adminProfileEnabled = true;
} else {
    $adminProfileEnabled = false;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['username', 'email', 'password', 'phone', 'fullName'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            sendError("$field is required");
        }
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email format');
    }
    
    // Validate password length
    if (strlen($input['password']) < 6) {
        sendError('Password must be at least 6 characters long');
    }
    
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$input['username']]);
        if ($stmt->fetch()) {
            throw new Exception('Username already exists');
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            throw new Exception('Email already registered');
        }
        
        // Hash password
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // First check if fullname column exists, if not add it
        $stmt = $pdo->query("SELECT column_name FROM information_schema.columns 
                             WHERE table_name = 'users' AND column_name = 'fullname'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE users ADD COLUMN fullname VARCHAR(255)");
        }
        
        // Create user record with fullname
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role, phone, fullname, is_verified, created_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $result = $stmt->execute([
            $input['username'],
            $input['email'],
            $hashedPassword,
            'admin',
            $input['phone'],
            $input['fullName'],
            1 // Admin users are auto-verified
        ]);
        
        if (!$result) {
            throw new Exception('Failed to create user account');
        }
        
        $userId = $pdo->lastInsertId();
        
        // Ensure roles exist
        $roles = ['admin', 'buyer', 'seller'];
        foreach ($roles as $roleName) {
            $stmt = $pdo->prepare("INSERT INTO roles (role_name, display_name, description, is_active, can_login) VALUES (?, ?, ?, ?, ?) ON CONFLICT (role_name) DO NOTHING");
            $stmt->execute([$roleName, ucfirst($roleName), ucfirst($roleName) . ' role', true, true]);
        }
        
        // Get role IDs and assign them
        $adminRoleStmt = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
        $adminRoleStmt->execute(['admin']);
        $adminRole = $adminRoleStmt->fetch(PDO::FETCH_ASSOC);
        
        $buyerRoleStmt = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
        $buyerRoleStmt->execute(['buyer']);
        $buyerRole = $buyerRoleStmt->fetch(PDO::FETCH_ASSOC);
        
        // Assign admin role (simplified)
        if ($adminRole) {
            $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id, is_primary, is_active, role_status) VALUES (?, ?, true, true, 'active')");
            $stmt->execute([$userId, $adminRole['id']]);
        }
        
        // Skip buyer profile creation for now - just focus on admin creation
        // $stmt = $pdo->prepare("INSERT INTO buyer_profiles (user_id, full_name) VALUES (?, ?)");
        // $stmt->execute([$userId, $input['fullName']]);
        
        // Create admin profile if AdminProfile class is available (disabled for now to avoid HTML warnings)
        /*
        if ($adminProfileEnabled && class_exists('AdminProfile')) {
            try {
                $adminProfile = new AdminProfile();
                $adminProfile->user_id = $userId;
                $adminProfile->full_name = $input['fullName'];
                $adminProfile->position = 'Administrator';
                $adminProfile->department = 'Administration';
                $adminProfile->employee_id = 'ADMIN' . str_pad($userId, 4, '0', STR_PAD_LEFT);
                $adminProfile->office_location = 'Head Office, Nairobi';
                $adminProfile->bio = 'System administrator with full platform access.';
                $adminProfile->is_super_admin = false; // Can be upgraded later
                $adminProfile->is_active = true;
                $adminProfile->permissions = [];
                $adminProfile->settings = [];
                $adminProfile->create();
            } catch (Exception $e) {
                // Log error but don't fail the entire registration
                error_log("Failed to create admin profile: " . $e->getMessage());
            }
        }
        */
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        sendSuccess([
            'user_id' => $userId,
            'username' => $input['username'],
            'email' => $input['email'],
            'fullName' => $input['fullName'],
            'role' => 'admin'
        ], 'Admin account created successfully');
        
    } catch (Exception $e) {
        // Rollback transaction
        $pdo->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Admin signup error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>
