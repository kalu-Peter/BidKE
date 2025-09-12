<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
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
require_once '../models/Auth.php';

/**
 * Email Verification Endpoint
 * Verifies user email with verification code
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
if (empty($data['user_id']) || empty($data['verification_code'])) {
    Auth::error('User ID and verification code are required');
}

$user_id = (int)$data['user_id'];
$verification_code = Auth::sanitizeInput($data['verification_code']);

// Rate limiting
$client_ip = Auth::getClientIP();
if (!Auth::checkRateLimit('verify_' . $user_id, 5, 300)) {
    Auth::error('Too many verification attempts. Please try again later.', 429);
}

try {
    // Initialize user model
    $user = new User();

    // Find user
    if (!$user->findById($user_id)) {
        Auth::error('User not found', 404);
    }

    // Check if already verified
    if ($user->is_verified) {
        Auth::response(['verified' => true], 'Email already verified', 200);
    }

    // Verify email
    if ($user->verifyEmail($verification_code)) {
        // Update user object
        $user->findById($user_id);
        
        Auth::response([
            'verified' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'is_verified' => $user->is_verified,
                'status' => $user->status
            ]
        ], 'Email verified successfully', 200);
    } else {
        Auth::error('Invalid or expired verification code', 400);
    }

} catch (Exception $e) {
    error_log("Email verification error: " . $e->getMessage());
    Auth::error('Verification failed. Please try again.', 500);
}
?>
