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
require_once '../models/Auth.php';
require_once '../models/UserSession.php';

/**
 * User Logout Endpoint
 * Handles token invalidation and session cleanup
 */

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    // Get token from Authorization header
    $token = Auth::getBearerToken();
    
    if (!$token) {
        sendError('No token provided', 400);
    }

    // Verify and decode token
    $payload = Auth::verifyToken($token);
    
    if (!$payload) {
        sendError('Invalid token', 401);
    }

    // If session_id is present, invalidate the session
    if (isset($payload['session_id'])) {
        $session = new UserSession();
        if ($session->findByToken($token)) {
            $session->deactivate();
        }
    }

    // In a more complete implementation, you would also:
    // 1. Add token to a blacklist
    // 2. Clear any refresh tokens
    // 3. Log the logout activity

    sendSuccess(null, 'Logout successful');

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    sendError('Logout failed', 500);
}
?>
