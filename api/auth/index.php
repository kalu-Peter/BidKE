<?php
// Enhanced CORS headers for development
header("Access-Control-Allow-Origin: http://localhost:8080");
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

/**
 * Auth API Index
 * Shows available authentication endpoints
 */

$endpoints = [
    'register' => [
        'method' => 'POST',
        'url' => '/auth/register.php',
        'description' => 'User registration with automatic buyer role assignment'
    ],
    'login' => [
        'method' => 'POST', 
        'url' => '/auth/login.php',
        'description' => 'User login with JWT token generation'
    ],
    'logout' => [
        'method' => 'POST',
        'url' => '/auth/logout.php',
        'description' => 'User logout and session invalidation'
    ],
    'profile' => [
        'method' => 'GET',
        'url' => '/auth/profile.php',
        'description' => 'Get current user profile (requires authentication)'
    ]
];

sendSuccess([
    'message' => 'BidKE Authentication API',
    'version' => '1.0.0',
    'endpoints' => $endpoints
], 'Authentication API endpoints');
?>
