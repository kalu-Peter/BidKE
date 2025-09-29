<?php
// Disable HTML error output and set JSON header immediately
ini_set('display_errors', 0);
error_reporting(0);

// Set CORS headers first - specific origin for credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8080';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error handling to ensure headers are always sent
function sendErrorResponse($message, $code = 400)
{
    global $origin;
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

try {
    require_once '../config/connect.php';
    require_once '../models/User.php';
    require_once '../models/BuyerProfile.php';
    require_once '../models/UserSession.php';

    $database = Database::getInstance();
    $pdo = $database->getConnection();

    $userModel = new User();
    $buyerProfileModel = new BuyerProfile();
    $sessionModel = new UserSession();

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
        sendErrorResponse('Session token required', 401);
    }

    // Verify session and get user
    $sessionData = $sessionModel->validateSession($sessionToken);
    if (!$sessionData) {
        sendErrorResponse('Invalid or expired session', 401);
    }

    $user = $userModel->findById($sessionData['user_id']);
    if (!$user) {
        sendErrorResponse('User not found', 404);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch buyer profile data
        $buyerProfile = $buyerProfileModel->getByUserId($user['id']);

        // Get buyer statistics
        $stats = $buyerProfileModel->getBuyerStats($user['id']);

        // Combine user and profile data - include ALL user fields from users table
        $response = [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'status' => $user['status'],
                'is_verified' => $user['is_verified'],
                'created_at' => $user['created_at'],
                // Personal information fields from users table
                'full_name' => $user['full_name'],
                'date_of_birth' => $user['date_of_birth'],
                'address' => $user['address'],
                'city' => $user['city'],
                'state' => $user['state'],
                'postal_code' => $user['postal_code'],
                'country' => $user['country'],
                'avatar_url' => $user['avatar_url'],
                'bio' => $user['bio'],
                'preferred_language' => $user['preferred_language'],
                'timezone' => $user['timezone'],
                'email_notifications' => $user['email_notifications'],
                'sms_notifications' => $user['sms_notifications']
            ],
            'profile' => $buyerProfile,
            'stats' => $stats
        ];

        echo json_encode([
            'success' => true,
            'data' => $response
        ]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update buyer profile and user data
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            sendErrorResponse('Invalid input data', 400);
        }

        // Separate fields that belong to users table vs buyer_profiles table
        $userFields = [
            'full_name',
            'date_of_birth',
            'address',
            'city',
            'state',
            'postal_code',
            'country',
            'phone',
            'bio',
            'preferred_language',
            'timezone',
            'email_notifications',
            'sms_notifications'
        ];

        $buyerProfileFields = [
            'national_id',
            'kyc_documents',
            'kyc_type',
            'preferred_categories',
            'max_bid_limit',
            'auto_bid_enabled',
            'default_shipping_address',
            'preferred_payment_methods',
            'bid_notifications',
            'outbid_notifications',
            'winning_notifications',
            'auction_ending_notifications'
        ];

        // Prepare data for users table update with validation
        $userUpdateData = [];
        foreach ($userFields as $field) {
            if (isset($input[$field])) {
                $value = $input[$field];

                // Special handling for date fields
                if ($field === 'date_of_birth') {
                    // Only add if not empty and valid date format
                    if (!empty($value) && $value !== '' && strtotime($value) !== false) {
                        $userUpdateData[$field] = $value;
                    } elseif (empty($value) || $value === '') {
                        // Set to NULL for empty dates
                        $userUpdateData[$field] = null;
                    }
                } else {
                    // For other fields, handle empty strings
                    $userUpdateData[$field] = empty($value) ? null : $value;
                }
            }
        }

        // Prepare data for buyer_profiles table update with validation
        $profileUpdateData = [];
        // Pre-process buyer profile fields
        foreach ($buyerProfileFields as $field) {
            if (isset($input[$field])) {
                $value = $input[$field];

                // Handle array fields - PostgreSQL array format
                if (in_array($field, ['preferred_categories', 'preferred_payment_methods'])) {
                    if (is_array($value) && !empty($value)) {
                        // Convert to PostgreSQL array format: {val1,val2,val3}
                        $escapedValues = array_map(function ($item) {
                            return '"' . str_replace('"', '""', $item) . '"';
                        }, $value);
                        $profileUpdateData[$field] = '{' . implode(',', $escapedValues) . '}';
                    } else {
                        // Empty array or null
                        $profileUpdateData[$field] = null;
                    }
                } elseif ($field === 'kyc_documents' || $field === 'national_id_document_url') {
                    // Accept either kyc_documents (array or JSON) or legacy national_id_document_url
                    if ($field === 'national_id_document_url') {
                        // Legacy single url - normalize later
                        $profileUpdateData['national_id_document_url'] = empty($value) ? null : $value;
                    } else {
                        // kyc_documents expected as array or JSON string
                        if (is_array($value)) {
                            $profileUpdateData['kyc_documents'] = $value;
                        } elseif (is_string($value) && $value !== '') {
                            $decoded = json_decode($value, true);
                            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                                $profileUpdateData['kyc_documents'] = $decoded;
                            } else {
                                // treat single URL string as single-element array
                                $profileUpdateData['kyc_documents'] = [$value];
                            }
                        } else {
                            $profileUpdateData['kyc_documents'] = [];
                        }
                    }
                } else {
                    $profileUpdateData[$field] = empty($value) ? null : $value;
                }
            }
        }

        // If a legacy national_id_document_url was provided, normalize into kyc_documents if not present
        if (isset($profileUpdateData['national_id_document_url']) && !isset($profileUpdateData['kyc_documents'])) {
            $v = $profileUpdateData['national_id_document_url'];
            if ($v === null) {
                $profileUpdateData['kyc_documents'] = [];
            } else {
                $profileUpdateData['kyc_documents'] = [$v];
            }
            unset($profileUpdateData['national_id_document_url']);
        }

        // Validate KYC: ensure file counts match kyc_type
        if (isset($profileUpdateData['kyc_type'])) {
            $type = $profileUpdateData['kyc_type'];
            $docs = $profileUpdateData['kyc_documents'] ?? [];
            $count = is_array($docs) ? count($docs) : 0;
            if ($type === 'national_id' && $count !== 2) {
                sendErrorResponse('National ID requires 2 document images (front and back)', 400);
            }
            if (($type === 'passport' || $type === 'driving_license') && $count !== 1) {
                sendErrorResponse('Passport or driving license requires exactly 1 document image', 400);
            }
        }

        $success = true;
        $message = 'Profile updated successfully';

        // Update users table if there are user fields to update
        if (!empty($userUpdateData)) {
            $userSuccess = $userModel->update($user['id'], $userUpdateData);
            if (!$userSuccess) {
                $success = false;
                $message = 'Failed to update user information';
            }
        }

        // Update or create buyer profile if there are profile fields to update
        if (!empty($profileUpdateData) && $success) {
            $existingProfile = $buyerProfileModel->getByUserId($user['id']);

            if ($existingProfile) {
                // Update existing profile
                $profileSuccess = $buyerProfileModel->update($existingProfile['id'], $profileUpdateData);
            } else {
                // Create new profile
                $profileUpdateData['user_id'] = $user['id'];
                $profileSuccess = $buyerProfileModel->create($profileUpdateData);
            }

            if (!$profileSuccess) {
                $success = false;
                $message = 'Failed to update buyer profile';
            }
        }

        if (!$success) {
            sendErrorResponse($message, 400);
        }

        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    } else {
        throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}
