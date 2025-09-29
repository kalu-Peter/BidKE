<?php
require_once __DIR__ . '/../config/connect.php';

// Expects ?user_id=123 or POST { user_id }
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $userId = null;
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    } else {
        $body = json_decode(file_get_contents('php://input'), true);
        $userId = isset($body['user_id']) ? (int)$body['user_id'] : null;
    }

    if (!$userId) {
        sendError('user_id is required', 400);
    }

    // Get user basic fields from users table
    $sql = "SELECT id, username, email, phone, full_name, address, city, state, postal_code, country, created_at FROM users WHERE id = :id LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendError('User not found', 404);
    }

    // Get buyer profile fields (if any)
    $profileSql = "SELECT id, user_id, national_id, national_id_verified, kyc_type, kyc_documents, preferred_payment_methods FROM buyer_profiles WHERE user_id = :uid LIMIT 1";
    $pstmt = $conn->prepare($profileSql);
    $pstmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $pstmt->execute();
    $profile = $pstmt->fetch(PDO::FETCH_ASSOC);

    // Normalize kyc_documents if present and stored as JSON string
    // Ensure $profile is an array with expected keys to simplify frontend usage
    if (!$profile) {
        $profile = [
            'id' => null,
            'user_id' => $userId,
            'national_id' => null,
            'national_id_verified' => null,
            'kyc_type' => null,
            'kyc_documents' => [],
            'preferred_payment_methods' => []
        ];
    } else {
        // Normalize kyc_documents if present and stored as JSON string or Postgres array
        if (isset($profile['kyc_documents'])) {
            $kd = $profile['kyc_documents'];
            if (is_string($kd)) {
                $decoded = json_decode($kd, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $profile['kyc_documents'] = $decoded;
                } else {
                    // attempt to treat as single url
                    $profile['kyc_documents'] = $kd === '' ? [] : [$kd];
                }
            } elseif (is_array($kd)) {
                // already array
            } else {
                $profile['kyc_documents'] = [];
            }
        } else {
            $profile['kyc_documents'] = [];
        }

        // Preferred payment methods normalize (could be Postgres array or JSON)
        if (isset($profile['preferred_payment_methods'])) {
            $ppm = $profile['preferred_payment_methods'];
            if (is_string($ppm)) {
                $decoded = json_decode($ppm, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $profile['preferred_payment_methods'] = $decoded;
                } else {
                    // Postgres array format {a,b}
                    if (preg_match('/^\{.*\}$/', $ppm)) {
                        $vals = trim($ppm, '{}');
                        $parts = array_map('trim', explode(',', $vals));
                        $profile['preferred_payment_methods'] = $parts;
                    } else {
                        // single string fallback
                        $profile['preferred_payment_methods'] = $ppm === '' ? [] : [$ppm];
                    }
                }
            } elseif (is_array($ppm)) {
                // already array
            } else {
                $profile['preferred_payment_methods'] = [];
            }
        } else {
            $profile['preferred_payment_methods'] = [];
        }
    }

    // Preferred payment methods normalize (could be Postgres array or JSON)
    if ($profile && isset($profile['preferred_payment_methods'])) {
        $ppm = $profile['preferred_payment_methods'];
        if (is_string($ppm)) {
            $decoded = json_decode($ppm, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $profile['preferred_payment_methods'] = $decoded;
            } else {
                // Postgres array format {a,b}
                if (preg_match('/^\{.*\}$/', $ppm)) {
                    $vals = trim($ppm, '{}');
                    $parts = array_map('trim', explode(',', $vals));
                    $profile['preferred_payment_methods'] = $parts;
                }
            }
        }
    }

    $response = [
        'user' => $user,
        'profile' => $profile
    ];

    sendSuccess($response);
} catch (Exception $e) {
    error_log('admin/user-details.php error: ' . $e->getMessage());
    sendError('Failed to fetch user details', 500, $e->getMessage());
}
