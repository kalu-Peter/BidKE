<?php
require_once '../config/connect.php';
require_once '../models/AdminProfile.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $adminProfile = new AdminProfile();
    
    switch ($method) {
        case 'GET':
            handleGet($adminProfile);
            break;
            
        case 'POST':
            handlePost($adminProfile);
            break;
            
        case 'PUT':
            handlePut($adminProfile);
            break;
            
        case 'DELETE':
            handleDelete($adminProfile);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Admin profile API error: " . $e->getMessage());
    sendError('Internal server error: ' . $e->getMessage(), 500);
}

function handleGet($adminProfile) {
    // Get query parameters
    $user_id = $_GET['user_id'] ?? null;
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'user':
            if (!$user_id) {
                sendError('User ID is required');
            }
            $profile = $adminProfile->getByUserId($user_id);
            if ($profile) {
                sendSuccess($profile, 'Admin profile retrieved successfully');
            } else {
                sendError('Admin profile not found', 404);
            }
            break;
            
        case 'profile':
            if (!$id) {
                sendError('Profile ID is required');
            }
            $profile = $adminProfile->getById($id);
            if ($profile) {
                sendSuccess($profile, 'Admin profile retrieved successfully');
            } else {
                sendError('Admin profile not found', 404);
            }
            break;
            
        case 'active':
            $profiles = $adminProfile->getActive();
            sendSuccess($profiles, 'Active admin profiles retrieved successfully');
            break;
            
        case 'super':
            $profiles = $adminProfile->getSuperAdmins();
            sendSuccess($profiles, 'Super admin profiles retrieved successfully');
            break;
            
        case 'stats':
            $stats = $adminProfile->getStats();
            sendSuccess($stats, 'Admin profile statistics retrieved successfully');
            break;
            
        case 'list':
        default:
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            $profiles = $adminProfile->getAll($limit, $offset);
            sendSuccess($profiles, 'Admin profiles retrieved successfully');
            break;
    }
}

function handlePost($adminProfile) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['user_id', 'full_name'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            sendError("$field is required");
        }
    }
    
    // Check if profile already exists for this user
    if ($adminProfile->existsForUser($input['user_id'])) {
        sendError('Admin profile already exists for this user', 409);
    }
    
    // Set properties
    $adminProfile->user_id = $input['user_id'];
    $adminProfile->full_name = $input['full_name'];
    $adminProfile->position = $input['position'] ?? 'Administrator';
    $adminProfile->department = $input['department'] ?? 'Administration';
    $adminProfile->employee_id = $input['employee_id'] ?? 'ADMIN' . str_pad($input['user_id'], 4, '0', STR_PAD_LEFT);
    $adminProfile->phone_extension = $input['phone_extension'] ?? null;
    $adminProfile->office_location = $input['office_location'] ?? 'Head Office';
    $adminProfile->bio = $input['bio'] ?? '';
    $adminProfile->profile_image_url = $input['profile_image_url'] ?? null;
    $adminProfile->emergency_contact_name = $input['emergency_contact_name'] ?? null;
    $adminProfile->emergency_contact_phone = $input['emergency_contact_phone'] ?? null;
    $adminProfile->emergency_contact_relationship = $input['emergency_contact_relationship'] ?? null;
    $adminProfile->date_hired = $input['date_hired'] ?? null;
    $adminProfile->permissions = $input['permissions'] ?? [];
    $adminProfile->settings = $input['settings'] ?? [];
    $adminProfile->is_super_admin = $input['is_super_admin'] ?? false;
    $adminProfile->is_active = $input['is_active'] ?? true;
    
    if ($adminProfile->create()) {
        $profile = $adminProfile->getById($adminProfile->id);
        sendSuccess($profile, 'Admin profile created successfully');
    } else {
        sendError('Failed to create admin profile', 500);
    }
}

function handlePut($adminProfile) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    $id = $input['id'] ?? $_GET['id'] ?? null;
    if (!$id) {
        sendError('Profile ID is required');
    }
    
    // Get existing profile
    $existing = $adminProfile->getById($id);
    if (!$existing) {
        sendError('Admin profile not found', 404);
    }
    
    // Update properties
    $adminProfile->id = $id;
    $adminProfile->full_name = $input['full_name'] ?? $existing['full_name'];
    $adminProfile->position = $input['position'] ?? $existing['position'];
    $adminProfile->department = $input['department'] ?? $existing['department'];
    $adminProfile->employee_id = $input['employee_id'] ?? $existing['employee_id'];
    $adminProfile->phone_extension = $input['phone_extension'] ?? $existing['phone_extension'];
    $adminProfile->office_location = $input['office_location'] ?? $existing['office_location'];
    $adminProfile->bio = $input['bio'] ?? $existing['bio'];
    $adminProfile->profile_image_url = $input['profile_image_url'] ?? $existing['profile_image_url'];
    $adminProfile->emergency_contact_name = $input['emergency_contact_name'] ?? $existing['emergency_contact_name'];
    $adminProfile->emergency_contact_phone = $input['emergency_contact_phone'] ?? $existing['emergency_contact_phone'];
    $adminProfile->emergency_contact_relationship = $input['emergency_contact_relationship'] ?? $existing['emergency_contact_relationship'];
    $adminProfile->date_hired = $input['date_hired'] ?? $existing['date_hired'];
    $adminProfile->permissions = $input['permissions'] ?? json_decode($existing['permissions'], true);
    $adminProfile->settings = $input['settings'] ?? json_decode($existing['settings'], true);
    $adminProfile->is_super_admin = isset($input['is_super_admin']) ? $input['is_super_admin'] : $existing['is_super_admin'];
    $adminProfile->is_active = isset($input['is_active']) ? $input['is_active'] : $existing['is_active'];
    
    if ($adminProfile->update()) {
        $profile = $adminProfile->getById($id);
        sendSuccess($profile, 'Admin profile updated successfully');
    } else {
        sendError('Failed to update admin profile', 500);
    }
}

function handleDelete($adminProfile) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('Profile ID is required');
    }
    
    // Check if profile exists
    if (!$adminProfile->getById($id)) {
        sendError('Admin profile not found', 404);
    }
    
    $adminProfile->id = $id;
    
    if ($adminProfile->delete()) {
        sendSuccess(['id' => $id], 'Admin profile deleted successfully');
    } else {
        sendError('Failed to delete admin profile', 500);
    }
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

function sendSuccess($data, $message = 'Success') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}
?>
