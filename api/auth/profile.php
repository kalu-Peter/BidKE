<?php
// Enhanced CORS headers for development - Allow both ports
$allowed_origins = ['http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:8081"); // Default fallback
}

header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // 24 hours
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connect.php';
require_once '../models/User.php';
require_once '../models/Auth.php';

/**
 * User Profile Endpoint
 * Handles getting current user profile data
 */

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    // Authenticate user
    $user_data = Auth::authenticate();
    
    if (!$user_data) {
        sendError('Authentication required', 401);
    }

    // Get user details
    $user = new User();
    if (!$user->findById($user_data['user_id'])) {
        sendError('User not found', 404);
    }

    // Get user roles
    $roles = $user->getLoginRoles();

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
        'current_role' => $user_data['login_role']
    ];

    sendSuccess($response_data, 'Profile retrieved successfully');

} catch (Exception $e) {
    error_log("Profile error: " . $e->getMessage());
    sendError('Failed to retrieve profile', 500);
}
?>
