<?php
// Minimal test version of seller-profile.php
function setCorsHeaders()
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
}

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../config/connect.php';
    require_once '../models/Auth.php';
    require_once '../models/SellerProfile.php';

    $user = Auth::requireAuth();
    $user_id = $user['user_id'];

    $seller = new SellerProfile();
    $seller->user_id = $user_id;
    $exists = $seller->getByUserId($user_id);

    echo json_encode([
        'success' => true,
        'message' => 'SellerProfile instantiation works',
        'user_id' => $user_id,
        'exists' => $exists
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
