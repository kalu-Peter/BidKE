<?php
require_once '../config/connect.php';
require_once '../models/User.php';
require_once '../models/BuyerProfile.php';
require_once '../models/UserSession.php';

// Enhanced CORS headers for development - Allow both ports
$allowed_origins = ['http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:8081"); // Default fallback
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();
    
    $userModel = new User($pdo);
    $buyerProfileModel = new BuyerProfile($pdo);
    $sessionModel = new UserSession($pdo);

    // Get session token from Authorization header
    $headers = getallheaders();
    $sessionToken = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $sessionToken = substr($authHeader, 7);
        }
    }

    if (!$sessionToken) {
        throw new Exception('Session token required');
    }

    // Verify session and get user
    $sessionData = $sessionModel->validateSession($sessionToken);
    if (!$sessionData) {
        throw new Exception('Invalid or expired session');
    }

    $user = $userModel->findById($sessionData['user_id']);
    if (!$user) {
        throw new Exception('User not found');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch buyer profile data
        $buyerProfile = $buyerProfileModel->getByUserId($user['id']);
        
        // Get buyer statistics
        $stats = $buyerProfileModel->getBuyerStats($user['id']);
        
        // Combine user and profile data
        $response = [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'status' => $user['status'],
                'is_verified' => $user['is_verified'],
                'created_at' => $user['created_at']
            ],
            'profile' => $buyerProfile,
            'stats' => $stats
        ];

        echo json_encode([
            'success' => true,
            'data' => $response
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update buyer profile
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid input data');
        }

        // Validate required fields based on what's being updated
        $allowedFields = [
            'first_name', 'last_name', 'date_of_birth', 'address', 
            'city', 'state', 'postal_code', 'country', 'phone',
            'preferred_payment_method', 'kyc_status', 'kyc_documents'
        ];

        $updateData = [];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = $input[$field];
            }
        }

        if (empty($updateData)) {
            throw new Exception('No valid fields to update');
        }

        // Get existing buyer profile or create new one
        $existingProfile = $buyerProfileModel->getByUserId($user['id']);
        
        if ($existingProfile) {
            // Update existing profile
            $success = $buyerProfileModel->update($existingProfile['id'], $updateData);
        } else {
            // Create new profile
            $updateData['user_id'] = $user['id'];
            $success = $buyerProfileModel->create($updateData);
        }

        if (!$success) {
            throw new Exception('Failed to update profile');
        }

        // Also update user table fields if provided
        $userUpdateFields = ['phone'];
        $userUpdateData = [];
        
        foreach ($userUpdateFields as $field) {
            if (isset($input[$field])) {
                $userUpdateData[$field] = $input[$field];
            }
        }

        if (!empty($userUpdateData)) {
            $userModel->update($user['id'], $userUpdateData);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);

    } else {
        throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
