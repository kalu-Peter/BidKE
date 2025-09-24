<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connect.php';
require_once '../models/SellerProfile.php';
require_once '../models/Auth.php';

try {
    $user = Auth::requireAuth();

    // Only allow admin role
    if (!Auth::hasRole('admin', $user)) {
        Auth::error('Insufficient permissions', 403);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // list pending verifications
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = SellerProfile::getPendingVerifications($limit, $offset);
        Auth::response($data, 'Pending verifications fetched', 200);
    } elseif ($method === 'POST') {
        // Approve or reject
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true) ?: [];

        $action = $payload['action'] ?? null; // 'approve' or 'reject'
        $user_id = $payload['user_id'] ?? null;
        $notes = isset($payload['notes']) ? Auth::sanitizeInput($payload['notes']) : null;

        if (!$action || !$user_id) {
            Auth::error('Missing action or user_id', 400);
        }

        $seller = new SellerProfile();
        $seller->user_id = $user_id;
        if (!$seller->getByUserId($user_id)) {
            Auth::error('Seller profile not found', 404);
        }

        if ($action === 'approve') {
            $ok = $seller->updateVerificationStatus('verified', $user['user_id'], $notes);
            if ($ok) {
                Auth::response(['approved' => true, 'user_id' => $user_id], 'Seller verification approved', 200);
            } else {
                Auth::error('Failed to approve', 500);
            }
        } elseif ($action === 'reject') {
            $ok = $seller->updateVerificationStatus('rejected', $user['user_id'], $notes);
            if ($ok) {
                Auth::response(['rejected' => true, 'user_id' => $user_id], 'Seller verification rejected', 200);
            } else {
                Auth::error('Failed to reject', 500);
            }
        } else {
            Auth::error('Invalid action', 400);
        }
    } else {
        Auth::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('Admin seller verifications error: ' . $e->getMessage());
    Auth::error('Server error', 500);
}

?>