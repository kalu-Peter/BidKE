<?php
// Set CORS headers first - specific origin for credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connect.php';
require_once '../models/User.php';
require_once '../models/Auth.php';

/**
 * User Login Endpoint
 * Handles username-based login with JWT tokens
 */

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get and validate JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    sendError('Invalid JSON data', 400);
}

// Log the received data for debugging (without password)
$debug_data = $data;
unset($debug_data['password']);
error_log("Login attempt: " . print_r($debug_data, true));

// Validate required fields
$required_fields = ['username', 'password'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    sendError('Missing required fields: ' . implode(', ', $missing_fields), 400, [
        'missing_fields' => $missing_fields
    ]);
}

// Sanitize input
$username = Auth::sanitizeInput($data['username']);
$password = $data['password']; // Don't sanitize password

// Rate limiting
$client_ip = Auth::getClientIP();
if (!Auth::checkRateLimit('login_' . $client_ip, 5, 300)) {
    sendError('Too many login attempts. Please try again later.', 429);
}

try {
    // Initialize user model
    $user = new User();

    // Find user by username
    if (!$user->findByUsername($username)) {
        sendError('Invalid username or password', 401);
    }

    // Check if user account is not suspended or banned
    if ($user->status === 'suspended' || $user->status === 'banned') {
        sendError('Account is ' . $user->status . '. Please contact support.', 403, [
            'status' => $user->status
        ]);
    }

    // Verify password
    if (!password_verify($password, $user->password_hash)) {
        sendError('Invalid username or password', 401);
    }

    // Get user roles
    $roles = $user->getLoginRoles();
    
    if (empty($roles)) {
        sendError('User has no assigned roles. Please contact support.', 403);
    }

    // For multi-role users, use the first role as login role
    $login_role = $roles[0];
    $login_role_name = $login_role['role_name'];

    // Generate JWT token using the correct method
    $jwt_token = Auth::generateToken($user->id, $user->username, $login_role_name);

    // Log successful login
    $user->logLogin($login_role_name, $jwt_token, $client_ip, $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');

    // Prepare response data
    $response_data = [
        'user' => [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'is_verified' => $user->is_verified,
            'created_at' => $user->created_at,
            'last_login_at' => $user->last_login_at
        ],
        'roles' => $roles,
        'token' => $jwt_token,
        'expires_at' => date('c', time() + 86400) // ISO 8601 format, 24 hours
    ];

    sendSuccess($response_data, 'Login successful');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    sendError('Login failed. Please try again.', 500);
}
?>
