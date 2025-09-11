<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
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
 * User Registration Endpoint
 * Handles unified signup with username
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
$required_fields = ['username', 'email', 'password'];
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
$email = Auth::sanitizeInput($data['email']);
$phone = isset($data['phone']) ? Auth::sanitizeInput($data['phone']) : null;
$password = $data['password']; // Don't sanitize password

// Validate input
$validation_errors = [];

if (!Auth::validateUsername($username)) {
    $validation_errors['username'] = 'Username must be 3-50 characters, letters, numbers and underscores only';
}

if (!Auth::validateEmail($email)) {
    $validation_errors['email'] = 'Invalid email format';
}

if ($phone && !Auth::validatePhone($phone)) {
    $validation_errors['phone'] = 'Invalid phone number format';
}

if (!Auth::validatePassword($password)) {
    $validation_errors['password'] = 'Password must be at least 8 characters with letters and numbers';
}

if (!empty($validation_errors)) {
    Auth::error('Validation failed', 400, ['validation_errors' => $validation_errors]);
}

// Rate limiting
$client_ip = Auth::getClientIP();
if (!Auth::checkRateLimit('signup_' . $client_ip, 3, 300)) {
    Auth::error('Too many signup attempts. Please try again later.', 429);
}

try {
    // Initialize user model
    $user = new User();

    // Check if username already exists
    if ($user->usernameExists($username)) {
        Auth::error('Username already exists', 409, ['field' => 'username']);
    }

    // Check if email already exists
    if ($user->emailExists($email)) {
        Auth::error('Email already exists', 409, ['field' => 'email']);
    }

    // Hash password
    $password_hash = Auth::hashPassword($password);

    // Set user properties
    $user->username = $username;
    $user->email = $email;
    $user->phone = $phone;
    $user->password_hash = $password_hash;

    // Create user (this automatically assigns buyer role)
    $user_id = $user->create();

    if ($user_id) {
        // Get the created user data
        $user->findById($user_id);
        
        // Get user roles for response
        $roles = $user->getLoginRoles();
        
        // Generate verification code for email
        $verification_code = $user->generateVerificationCode();
        
        // Prepare response data
        $response_data = [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'is_verified' => $user->is_verified,
                'created_at' => $user->created_at
            ],
            'roles' => $roles,
            'verification_required' => true,
            'verification_code' => $verification_code // In production, send via email
        ];

        Auth::response($response_data, 'User registered successfully. Please verify your email.', 201);

    } else {
        Auth::error('Failed to create user account', 500);
    }

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    Auth::error('Registration failed. Please try again.', 500);
}
?>
