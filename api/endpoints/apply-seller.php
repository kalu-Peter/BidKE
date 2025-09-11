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
 * Apply for Seller Role Endpoint
 * Allows buyers to apply for seller privileges
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Auth::error('Method not allowed', 405);
}

try {
    // Authenticate user
    $user_data = Auth::requireAuth();
    
    // Get posted data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Optional fields
    $business_name = isset($data['business_name']) ? Auth::sanitizeInput($data['business_name']) : null;
    $business_type = isset($data['business_type']) ? Auth::sanitizeInput($data['business_type']) : 'individual';

    // Validate business type
    $valid_business_types = [
        'individual', 'sole_proprietorship', 'partnership', 'company', 
        'auctioneer', 'bank', 'microfinance', 'sacco', 'dealer', 
        'leasing_company', 'government', 'ngo', 'other'
    ];

    if (!in_array($business_type, $valid_business_types)) {
        Auth::error('Invalid business type', 400, ['valid_types' => $valid_business_types]);
    }

    // Initialize user model
    $user = new User();
    
    if (!$user->findById($user_data['user_id'])) {
        Auth::error('User not found', 404);
    }

    // Apply for seller role
    if ($user->applyForSellerRole($business_name, $business_type)) {
        Auth::response([
            'application_submitted' => true,
            'status' => 'pending',
            'business_name' => $business_name,
            'business_type' => $business_type
        ], 'Seller role application submitted successfully. It will be reviewed by our team.', 201);
    } else {
        Auth::error('Failed to submit application. You may already have seller privileges or there was an error.', 400);
    }

} catch (Exception $e) {
    error_log("Seller application error: " . $e->getMessage());
    Auth::error('Application failed. Please try again.', 500);
}
?>
