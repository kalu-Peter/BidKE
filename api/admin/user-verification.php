<?php
// Admin endpoint for user verification (buyer-focused)
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../../api/models/BuyerProfile.php';
require_once __DIR__ . '/../../api/models/User.php';
require_once __DIR__ . '/../../api/models/Auth.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $admin = Auth::requireAuth();
    if (!Auth::hasRole('admin', $admin)) {
        Auth::error('Insufficient permissions', 403);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Accept ?user_id=123 to fetch combined user + buyer profile
        $uid = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        if (!$uid) {
            Auth::error('user_id is required', 400);
        }

        $db = Database::getInstance()->getConnection();
        $userStmt = $db->prepare('SELECT id, username, email, phone, full_name, address, city, state, postal_code, country, status, is_verified FROM users WHERE id = ? LIMIT 1');
        $userStmt->execute([$uid]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            Auth::error('User not found', 404);
        }

        $bpStmt = $db->prepare('SELECT id, user_id, national_id, national_id_verified, kyc_type, kyc_documents, preferred_payment_methods, restriction_reason FROM buyer_profiles WHERE user_id = ? LIMIT 1');
        $bpStmt->execute([$uid]);
        $profile = $bpStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        Auth::response(['user' => $user, 'profile' => $profile], 'User details fetched', 200);
        exit;
    }

    if ($method !== 'POST') {
        Auth::error('Method not allowed', 405);
    }

    // POST: perform approve or reject
    $payload = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = $payload['action'] ?? null; // approve | reject
    $user_id = isset($payload['user_id']) ? (int)$payload['user_id'] : null;
    $message = isset($payload['message']) ? trim($payload['message']) : null; // rejection message

    if (!$action || !$user_id) {
        Auth::error('Missing action or user_id', 400);
    }

    $db = Database::getInstance()->getConnection();

    try {
        $db->beginTransaction();

        // Ensure buyer profile exists (create if missing)
        $bp = new BuyerProfile();
        $bpExists = $bp->getByUserId($user_id);
        if (!$bpExists) {
            // create minimal buyer profile for this user
            $created = $bp->create(['user_id' => $user_id]);
            if (!$created) {
                $db->rollBack();
                Auth::error('Failed to create buyer profile', 500);
            }
        }

        if ($action === 'approve') {
            // Mark buyer profile verified and update user
            $stmt = $db->prepare('UPDATE buyer_profiles SET national_id_verified = TRUE, updated_at = NOW() WHERE user_id = ?');
            $stmt->execute([$user_id]);

            // Use allowed status value from users.status CHECK (schema expects 'active' etc.)
            $uStmt = $db->prepare('UPDATE users SET status = ?, is_verified = TRUE, updated_at = NOW() WHERE id = ?');
            $uStmt->execute(['active', $user_id]);

            $db->commit();
            Auth::response(['success' => true, 'approved' => true, 'user_id' => $user_id], 'User approved', 200);
            exit;
        } elseif ($action === 'reject') {
            // Save rejection message to buyer_profiles.restriction_reason
            if (!$message || $message === '') {
                // allow empty message but prefer one
                $message = 'Your verification was rejected by admin';
            }

            $stmt = $db->prepare('UPDATE buyer_profiles SET national_id_verified = FALSE, restriction_reason = ?, updated_at = NOW() WHERE user_id = ?');
            $stmt->execute([$message, $user_id]);

            // We do not change is_verified to true; explicitly set false
            // Use an allowed status for rejected users (set to 'inactive')
            $uStmt = $db->prepare('UPDATE users SET status = ?, is_verified = FALSE, updated_at = NOW() WHERE id = ?');
            $uStmt->execute(['inactive', $user_id]);

            $db->commit();
            // Return only a rejection message as requested
            echo json_encode(['success' => true, 'rejected' => true, 'user_id' => $user_id, 'message' => $message]);
            exit;
        } else {
            $db->rollBack();
            Auth::error('Invalid action', 400);
        }
    } catch (Exception $e) {
        try {
            $db->rollBack();
        } catch (Exception $_) {
        }
        error_log('admin/user-verification.php error: ' . $e->getMessage());
        Auth::error('Failed to update verification', 500);
    }
} catch (Exception $e) {
    error_log('admin/user-verification.php outer error: ' . $e->getMessage());
    Auth::error('Server error', 500);
}
