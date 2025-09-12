<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8081';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connect.php';
require_once '../models/User.php';
require_once '../models/UserSession.php';
require_once '../models/Auth.php';

/**
 * User Login Endpoint
 * Handles role-based login (buyer/seller)
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Auth::error('Method not allowed', 405);
}

// Get posted data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    Auth::error('Invalid JSON data');
}

// Validate required fields
$required_fields = ['username', 'password', 'login_role'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    Auth::error('Missing required fields: ' . implode(', ', $missing_fields), 400, [
        'missing_fields' => $missing_fields
    ]);
}

// Sanitize input
$username = Auth::sanitizeInput($data['username']);
$password = $data['password']; // Don't sanitize password
$login_role = Auth::sanitizeInput($data['login_role']);

// Validate login role
$valid_roles = ['buyer', 'seller', 'admin'];
if (!in_array($login_role, $valid_roles)) {
    Auth::error('Invalid login role', 400);
}

// Rate limiting
$client_ip = Auth::getClientIP();
if (!Auth::checkRateLimit('login_' . $client_ip, 10, 300)) {
    Auth::error('Too many login attempts. Please try again later.', 429);
}

try {
    // Initialize user model
    $user = new User();

    // Find user by username
    if (!$user->findByUsername($username)) {
        // Rate limit failed attempts
        Auth::checkRateLimit('failed_login_' . $username, 5, 900); // 15 minutes
        Auth::error('Invalid credentials', 401);
    }

    // Check if account is locked
    if ($user->isAccountLocked()) {
        Auth::error('Account is temporarily locked due to multiple failed attempts', 423);
    }

    // Verify password
    if (!$user->verifyPassword($password)) {
        // Update failed login attempts
        $user->updateFailedLoginAttempts();
        
        // Lock account after 5 failed attempts
        if ($user->failed_login_attempts >= 5) {
            $user->lockAccount(30); // Lock for 30 minutes
        }
        
        Auth::error('Invalid credentials', 401);
    }

    // Check if user is verified
    if (!$user->is_verified) {
        Auth::error('Please verify your email before logging in', 403, [
            'verification_required' => true,
            'user_id' => $user->id
        ]);
    }

    // Check if user status allows login
    if (!in_array($user->status, ['active'])) {
        Auth::error('Account is not active', 403, ['account_status' => $user->status]);
    }

    // Get user's available roles
    $available_roles = $user->getLoginRoles();
    
    if (empty($available_roles)) {
        Auth::error('No active roles found for this user', 403);
    }

    // Check if user has the requested role
    $has_role = false;
    foreach ($available_roles as $role) {
        if ($role['role_name'] === $login_role && $role['can_login']) {
            $has_role = true;
            break;
        }
    }

    if (!$has_role) {
        Auth::error('You don\'t have permission to login as ' . $login_role, 403, [
            'available_roles' => array_column($available_roles, 'role_name')
        ]);
    }

    // Generate session tokens
    $session_token = Auth::generateRandomString(64);
    $refresh_token = Auth::generateRefreshToken();

    // Get client information
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $device_info = UserSession::parseUserAgent($user_agent);
    $device_fingerprint = UserSession::generateDeviceFingerprint($client_ip, $user_agent);

    // Create session
    $session = new UserSession();
    $session->user_id = $user->id;
    $session->session_token = $session_token;
    $session->refresh_token = $refresh_token;
    $session->login_role = $login_role;
    $session->ip_address = $client_ip;
    $session->user_agent = $user_agent;
    $session->device_fingerprint = $device_fingerprint;
    $session->device_type = $device_info['device_type'];
    $session->browser = $device_info['browser'];
    $session->operating_system = $device_info['operating_system'];
    $session->expires_at = date('Y-m-d H:i:s', time() + 2592000); // 30 days

    if (!$session->create()) {
        Auth::error('Failed to create session', 500);
    }

    // Log the login
    $user->logLogin($login_role, $session_token, $client_ip, $user_agent);

    // Generate JWT token
    $jwt_token = Auth::generateToken($user->id, $user->username, $login_role, $session->id);

    // Get profile data based on role
    $profile_data = null;
    if ($login_role === 'buyer') {
        $profile_data = $user->getBuyerProfile();
    } elseif ($login_role === 'seller') {
        $profile_data = $user->getSellerProfile();
    }

    // Prepare response
    $response_data = [
        'user' => $user->toArray(),
        'token' => $jwt_token,
        'refresh_token' => $refresh_token,
        'login_role' => $login_role,
        'available_roles' => $available_roles,
        'profile' => $profile_data,
        'session' => [
            'id' => $session->id,
            'expires_at' => $session->expires_at,
            'device_type' => $session->device_type,
            'browser' => $session->browser
        ]
    ];

    Auth::response($response_data, 'Login successful', 200);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Auth::error('Login failed. Please try again.', 500);
}
?>
