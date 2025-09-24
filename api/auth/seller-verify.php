<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
    // Require authenticated user
    $user_data = Auth::requireAuth();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Auth::error('Method not allowed', 405);
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json, true) ?: [];

    $documents = isset($data['documents']) && is_array($data['documents']) ? $data['documents'] : [];
    $notes = isset($data['notes']) ? Auth::sanitizeInput($data['notes']) : null;
    $business_name = isset($data['business_name']) ? Auth::sanitizeInput($data['business_name']) : null;
    $business_type = isset($data['business_type']) ? Auth::sanitizeInput($data['business_type']) : 'individual';

    $user_id = $user_data['user_id'];

    $seller = new SellerProfile();
    $seller->user_id = $user_id;

    // If profile doesn't exist, create one
    if (!$seller->getByUserId($user_id)) {
        $seller->business_name = $business_name ?? '';
        $seller->business_type = $business_type;
        $seller->verification_status = 'pending';
        if (!$seller->create()) {
            Auth::error('Failed to create seller profile', 500);
        }
    } else {
        // Update business fields if provided
        $updateData = [];
        if ($business_name) $updateData['business_name'] = $business_name;
        if ($business_type) $updateData['business_type'] = $business_type;
        if (!empty($updateData)) {
            $seller->update($updateData);
        }
    }

    // Submit verification: set status to pending and store documents
    $documents_clean = array_values(array_filter(array_map(function($d) {
        return is_string($d) ? trim($d) : null;
    }, $documents)));

    if (empty($documents_clean)) {
        // Allow submission without docs (maybe only business fields), but respond with warning
        Auth::response(['submitted' => true, 'documents' => []], 'Verification submitted (no documents provided).', 200);
    }

    $ok = $seller->updateVerificationStatus('pending', null, $notes, $documents_clean);

    if ($ok) {
        // Refresh properties
        $seller = new SellerProfile();
        $seller->user_id = $user_id;
        $seller->getByUserId($user_id);

        Auth::response(['submitted' => true, 'profile' => $seller->toArray(true)], 'Verification submitted and marked as pending.', 200);
    } else {
        Auth::error('Failed to submit verification', 500);
    }

} catch (Exception $e) {
    error_log('Seller verification error: ' . $e->getMessage());
    Auth::error('Submission failed. Please try again.', 500);
}

?>
