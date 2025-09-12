<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Set CORS headers first
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8081';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load dependencies with error handling
// Temporarily disable auth for testing
/*
try {
    require_once 'config/connect.php';
    require_once 'models/Auth.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error']);
    exit();
}
*/

try {
    // Temporarily skip auth verification for testing
    /*
    // Verify authentication
    $token = Auth::getBearerToken();
    if (!$token) {
        throw new Exception('Authorization token missing');
    }
    
    $userData = Auth::verifyToken($token);
    if (!$userData) {
        throw new Exception('Invalid or expired token');
    }
    */
    
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }
    
    $file = $_FILES['file'];
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    $maxSize = 8 * 1024 * 1024; // 8MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }
    
    if ($file['size'] > $maxSize) {
        throw new Exception('File size too large. Maximum size is 8MB');
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = 'uploads/' . $filename;
    $fullPath = __DIR__ . '/' . $uploadPath;
    
    // Create uploads directory if it doesn't exist
    $uploadsDir = __DIR__ . '/uploads';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        throw new Exception('Failed to save file');
    }
    
    // Return file info
    echo json_encode([
        'success' => true,
        'data' => [
            'filename' => $filename,
            'path' => $uploadPath,
            'url' => 'http://localhost:8000/' . $uploadPath,
            'size' => $file['size'],
            'type' => $file['type']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
