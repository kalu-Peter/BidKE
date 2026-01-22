<?php
// CORS Headers - Allow all development ports
$allowed_origins = ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:8082'); // Default fallback
}

header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../models/Auth.php';

try {
    $admin = Auth::requireAuth();
    if (!Auth::hasRole('admin', $admin)) {
        Auth::error('Insufficient permissions', 403);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $db = Database::getInstance()->getConnection();

    if ($method === 'GET') {
        // Get users with their seller profile data
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $user_status = isset($_GET['user_status']) ? $_GET['user_status'] : '';
        $verification_status = isset($_GET['verification_status']) ? $_GET['verification_status'] : '';

        // Build the query with optional filters
        $whereConditions = [];
        $params = [];

        if (!empty($search)) {
            $whereConditions[] = "(u.username LIKE :search OR u.email LIKE :search OR u.full_name LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        if (!empty($user_status)) {
            $whereConditions[] = "u.status = :user_status";
            $params['user_status'] = $user_status;
        }

        if (!empty($verification_status)) {
            $whereConditions[] = "sp.verification_status = :verification_status";
            $params['verification_status'] = $verification_status;
        }

        $whereClause = '';
        if (!empty($whereConditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
        }

        $query = "
            SELECT 
                u.id as user_id,
                u.username,
                u.email,
                u.phone,
                u.full_name,
                u.status as user_status,
                u.is_verified as user_verified,
                u.created_at as user_created_at,
                u.updated_at as user_updated_at,
                sp.id as seller_profile_id,
                sp.business_name,
                sp.business_type,
                sp.verification_status,
                sp.verified_by,
                sp.seller_status,
                sp.verified_at as verification_date,
                sp.verification_notes as rejection_reason,
                sp.created_at as seller_created_at,
                sp.updated_at as seller_updated_at,
                admin_u.username as verified_by_username
            FROM users u
            LEFT JOIN seller_profiles sp ON u.id = sp.user_id
            LEFT JOIN users admin_u ON sp.verified_by = admin_u.id
            $whereClause
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        foreach ($params as $key => $value) {
            $stmt->bindParam(':' . $key, $value);
        }

        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN seller_profiles sp ON u.id = sp.user_id
            $whereClause
        ";

        $countStmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindParam(':' . $key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        Auth::response([
            'users' => $users,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ], 'Users fetched successfully', 200);
        exit;
    }

    if ($method === 'PUT') {
        // Update user verification status
        $rawInput = file_get_contents('php://input');
        error_log('PUT request raw input: ' . $rawInput);

        $payload = json_decode($rawInput, true) ?: [];
        error_log('PUT request parsed payload: ' . print_r($payload, true));

        $user_id = isset($payload['user_id']) ? (int)$payload['user_id'] : null;
        $user_status = !empty($payload['user_status']) ? $payload['user_status'] : null;
        $is_verified = isset($payload['is_verified']) ? (bool)$payload['is_verified'] : null;
        $verification_status = !empty($payload['verification_status']) ? $payload['verification_status'] : null;
        $verified_by = isset($payload['verified_by']) ? (int)$payload['verified_by'] : null;
        $seller_status = !empty($payload['seller_status']) ? $payload['seller_status'] : null;
        $rejection_reason = !empty($payload['rejection_reason']) ? $payload['rejection_reason'] : null;

        if (!$user_id) {
            Auth::error('User ID is required', 400);
        }

        // Validate enum values
        if ($verification_status && !in_array($verification_status, ['pending', 'under_review', 'verified', 'rejected', 'expired'])) {
            Auth::error('Invalid verification status', 400);
        }

        if ($seller_status && !in_array($seller_status, ['pending', 'active', 'suspended', 'restricted', 'banned'])) {
            Auth::error('Invalid seller status', 400);
        }

        try {
            $db->beginTransaction();

            // Update users table
            $userUpdates = [];
            $userParams = ['user_id' => $user_id];

            if ($user_status !== null) {
                $userUpdates[] = "status = :user_status";
                $userParams['user_status'] = $user_status;
            }

            if ($is_verified !== null) {
                $userUpdates[] = "is_verified = :is_verified";
                $userParams['is_verified'] = $is_verified ? 1 : 0;
            }

            if (!empty($userUpdates)) {
                $userUpdates[] = "updated_at = NOW()";
                $userQuery = "UPDATE users SET " . implode(', ', $userUpdates) . " WHERE id = :user_id";
                $userStmt = $db->prepare($userQuery);
                $userStmt->execute($userParams);
            }

            // Update seller_profiles table if seller profile exists
            $sellerUpdates = [];
            $sellerParams = ['user_id' => $user_id];

            if ($verification_status !== null) {
                $sellerUpdates[] = "verification_status = :verification_status";
                $sellerParams['verification_status'] = $verification_status;
            }

            if ($verified_by !== null) {
                $sellerUpdates[] = "verified_by = :verified_by";
                $sellerParams['verified_by'] = $verified_by;
            }

            if ($seller_status !== null) {
                $sellerUpdates[] = "seller_status = :seller_status";
                $sellerParams['seller_status'] = $seller_status;
            }

            if ($rejection_reason !== null) {
                $sellerUpdates[] = "verification_notes = :rejection_reason";
                $sellerParams['rejection_reason'] = $rejection_reason;
            }

            if (!empty($sellerUpdates)) {
                $sellerUpdates[] = "updated_at = NOW()";

                // Add verified_at if status is being set to verified
                if ($verification_status === 'verified') {
                    $sellerUpdates[] = "verified_at = NOW()";
                }

                // Check if seller profile exists
                $checkQuery = "SELECT id FROM seller_profiles WHERE user_id = :user_id";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->execute(['user_id' => $user_id]);

                if ($checkStmt->rowCount() > 0) {
                    // Update existing seller profile
                    $sellerQuery = "UPDATE seller_profiles SET " . implode(', ', $sellerUpdates) . " WHERE user_id = :user_id";
                    $sellerStmt = $db->prepare($sellerQuery);
                    $sellerStmt->execute($sellerParams);
                } else {
                    // Create new seller profile with provided data
                    $insertFields = ['user_id'];
                    $insertValues = [':user_id'];
                    $insertParams = ['user_id' => $user_id];

                    foreach ($sellerParams as $key => $value) {
                        if ($key !== 'user_id') {
                            $insertFields[] = $key;
                            $insertValues[] = ':' . $key;
                            $insertParams[$key] = $value;
                        }
                    }

                    $insertFields[] = 'created_at';
                    $insertFields[] = 'updated_at';
                    $insertValues[] = 'NOW()';
                    $insertValues[] = 'NOW()';

                    $insertQuery = "INSERT INTO seller_profiles (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
                    $insertStmt = $db->prepare($insertQuery);
                    $insertStmt->execute($insertParams);
                }
            }

            $db->commit();

            Auth::response([
                'success' => true,
                'user_id' => $user_id,
                'updated' => true
            ], 'User verification status updated successfully', 200);
        } catch (Exception $e) {
            $db->rollBack();
            error_log('admin/user-verification-management.php error: ' . $e->getMessage());
            error_log('admin/user-verification-management.php stack trace: ' . $e->getTraceAsString());
            Auth::error('Failed to update user verification status: ' . $e->getMessage(), 500);
        }
        exit;
    }

    Auth::error('Method not allowed', 405);
} catch (Exception $e) {
    error_log('admin/user-verification-management.php outer error: ' . $e->getMessage());
    Auth::error('Server error', 500);
}
