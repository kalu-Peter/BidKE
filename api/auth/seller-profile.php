<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connect.php';
require_once '../models/SellerProfile.php';
require_once '../models/Auth.php';
require_once '../models/User.php';

try {
    $user = Auth::requireAuth();
    $user_id = $user['user_id'];

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $seller = new SellerProfile();
        $seller->user_id = $user_id;
        if ($seller->getByUserId($user_id)) {
            Auth::response($seller->toArray(true), 'Seller profile fetched', 200);
        } else {
            Auth::response(null, 'No seller profile found', 204);
        }
    } elseif ($method === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true) ?: [];

        $seller = new SellerProfile();
        $seller->user_id = $user_id;
        $seller->getByUserId($user_id); // may or may not exist

        $allowed = ['business_name','business_type','business_registration','tax_pin','business_permit','business_address','business_phone','business_email','website_url','business_description'];
        $update = [];
        foreach ($allowed as $k) {
            if (isset($data[$k])) $update[$k] = Auth::sanitizeInput($data[$k]);
        }

        if (empty($update)) {
            Auth::error('No valid fields to update', 400);
        }

        $ok = $seller->update($update);
        if ($ok) {
            Auth::response(['updated' => true], 'Seller profile updated', 200);
        } else {
            Auth::error('Failed to update seller profile', 500);
        }
    } else {
        Auth::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('Seller profile error: ' . $e->getMessage());
    Auth::error('Server error', 500);
}

?>