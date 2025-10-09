<?php

/**
 * Payout Methods API
 * 
 * Manages user payout method preferences (bank accounts, M-Pesa, etc.)
 * 
 * Endpoints:
 * GET /payout-methods.php - Get user's payout methods
 * POST /payout-methods.php - Create new payout method
 * PUT /payout-methods.php?id={id} - Update payout method
 * DELETE /payout-methods.php?id={id} - Delete payout method
 * PUT /payout-methods.php?id={id}&action=set_default - Set as default method
 */

require_once __DIR__ . '/config/connect.php';
require_once __DIR__ . '/utils/cors.php';
require_once __DIR__ . '/models/Auth.php';

// Get database connection
$db = Database::getInstance();
$pdo = $db->getConnection();

// Handle CORS
setCORSHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class PayoutMethodsAPI
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    public function handleRequest()
    {
        $method = $_SERVER['REQUEST_METHOD'];

        try {
            switch ($method) {
                case 'GET':
                    return $this->getPayoutMethods();
                case 'POST':
                    return $this->createPayoutMethod();
                case 'PUT':
                    return $this->updatePayoutMethod();
                case 'DELETE':
                    return $this->deletePayoutMethod();
                default:
                    return $this->sendResponse(false, 'Method not allowed', null, 405);
            }
        } catch (Exception $e) {
            error_log("Payout Methods API Error: " . $e->getMessage());
            return $this->sendResponse(false, 'Internal server error', null, 500);
        }
    }

    private function getPayoutMethods()
    {
        // Get user ID from session (you might need to adjust this based on your auth system)
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->sendResponse(false, 'User not authenticated', null, 401);
        }

        $query = "
            SELECT 
                id,
                method_type,
                bank_name,
                account_number,
                account_name,
                branch_code,
                phone_number,
                paypal_email,
                is_default,
                is_verified,
                status,
                created_at,
                updated_at
            FROM user_payout_methods 
            WHERE user_id = :user_id AND status = 'active'
            ORDER BY is_default DESC, created_at DESC
        ";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $methods = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Mask sensitive information
        foreach ($methods as &$method) {
            if ($method['account_number']) {
                $method['account_number_masked'] = $this->maskAccountNumber($method['account_number']);
            }
            if ($method['phone_number']) {
                $method['phone_number_masked'] = $this->maskPhoneNumber($method['phone_number']);
            }
            // Remove full account number and phone number from response for security
            unset($method['account_number']);
            unset($method['phone_number']);
        }

        return $this->sendResponse(true, 'Payout methods retrieved successfully', $methods);
    }

    private function createPayoutMethod()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->sendResponse(false, 'User not authenticated', null, 401);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            return $this->sendResponse(false, 'Invalid JSON input', null, 400);
        }

        // Validate required fields
        $methodType = $input['method_type'] ?? '';
        if (!in_array($methodType, ['bank_transfer', 'mpesa', 'paypal'])) {
            return $this->sendResponse(false, 'Invalid method type', null, 400);
        }

        // Validate method-specific fields
        $validationResult = $this->validateMethodFields($methodType, $input);
        if (!$validationResult['valid']) {
            return $this->sendResponse(false, $validationResult['message'], null, 400);
        }

        try {
            $this->db->beginTransaction();

            // Check if this should be the default method (if user has no other methods)
            $isDefault = $input['is_default'] ?? false;
            if (!$isDefault) {
                // If user has no other methods, make this the default
                $checkQuery = "SELECT COUNT(*) FROM user_payout_methods WHERE user_id = :user_id AND status = 'active'";
                $checkStmt = $this->db->prepare($checkQuery);
                $checkStmt->bindParam(':user_id', $userId);
                $checkStmt->execute();
                $existingCount = $checkStmt->fetchColumn();

                if ($existingCount == 0) {
                    $isDefault = true;
                }
            }

            // Insert new payout method
            $query = "
                INSERT INTO user_payout_methods (
                    user_id, method_type, bank_name, account_number, account_name, 
                    branch_code, phone_number, paypal_email, is_default, status
                ) VALUES (
                    :user_id, :method_type, :bank_name, :account_number, :account_name,
                    :branch_code, :phone_number, :paypal_email, :is_default, 'active'
                ) RETURNING id
            ";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':method_type', $methodType);
            $stmt->bindParam(':bank_name', $input['bank_name'] ?? null);
            $stmt->bindParam(':account_number', $input['account_number'] ?? null);
            $stmt->bindParam(':account_name', $input['account_name'] ?? null);
            $stmt->bindParam(':branch_code', $input['branch_code'] ?? null);
            $stmt->bindParam(':phone_number', $input['phone_number'] ?? null);
            $stmt->bindParam(':paypal_email', $input['paypal_email'] ?? null);
            $stmt->bindParam(':is_default', $isDefault, PDO::PARAM_BOOL);

            $stmt->execute();
            $newId = $stmt->fetchColumn();

            $this->db->commit();

            return $this->sendResponse(true, 'Payout method created successfully', ['id' => $newId]);
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error creating payout method: " . $e->getMessage());
            return $this->sendResponse(false, 'Failed to create payout method', null, 500);
        }
    }

    private function updatePayoutMethod()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->sendResponse(false, 'User not authenticated', null, 401);
        }

        $id = $_GET['id'] ?? null;
        $action = $_GET['action'] ?? null;

        if (!$id) {
            return $this->sendResponse(false, 'Payout method ID is required', null, 400);
        }

        // Handle set default action
        if ($action === 'set_default') {
            return $this->setDefaultMethod($userId, $id);
        }

        // Handle regular update
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            return $this->sendResponse(false, 'Invalid JSON input', null, 400);
        }

        // Verify ownership
        if (!$this->verifyOwnership($userId, $id)) {
            return $this->sendResponse(false, 'Payout method not found or access denied', null, 404);
        }

        // Get current method details
        $currentMethod = $this->getMethodById($id);
        if (!$currentMethod) {
            return $this->sendResponse(false, 'Payout method not found', null, 404);
        }

        // Validate updated fields
        $methodType = $input['method_type'] ?? $currentMethod['method_type'];
        $validationResult = $this->validateMethodFields($methodType, $input);
        if (!$validationResult['valid']) {
            return $this->sendResponse(false, $validationResult['message'], null, 400);
        }

        try {
            $this->db->beginTransaction();

            $query = "
                UPDATE user_payout_methods SET 
                    bank_name = COALESCE(:bank_name, bank_name),
                    account_number = COALESCE(:account_number, account_number),
                    account_name = COALESCE(:account_name, account_name),
                    branch_code = COALESCE(:branch_code, branch_code),
                    phone_number = COALESCE(:phone_number, phone_number),
                    paypal_email = COALESCE(:paypal_email, paypal_email),
                    updated_at = now()
                WHERE id = :id AND user_id = :user_id
            ";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':bank_name', $input['bank_name'] ?? null);
            $stmt->bindParam(':account_number', $input['account_number'] ?? null);
            $stmt->bindParam(':account_name', $input['account_name'] ?? null);
            $stmt->bindParam(':branch_code', $input['branch_code'] ?? null);
            $stmt->bindParam(':phone_number', $input['phone_number'] ?? null);
            $stmt->bindParam(':paypal_email', $input['paypal_email'] ?? null);

            $stmt->execute();

            $this->db->commit();

            return $this->sendResponse(true, 'Payout method updated successfully');
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error updating payout method: " . $e->getMessage());
            return $this->sendResponse(false, 'Failed to update payout method', null, 500);
        }
    }

    private function deletePayoutMethod()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->sendResponse(false, 'User not authenticated', null, 401);
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            return $this->sendResponse(false, 'Payout method ID is required', null, 400);
        }

        // Verify ownership
        if (!$this->verifyOwnership($userId, $id)) {
            return $this->sendResponse(false, 'Payout method not found or access denied', null, 404);
        }

        // Check if this is the default method
        $method = $this->getMethodById($id);
        if ($method['is_default']) {
            // Check if user has other methods
            $otherMethodsQuery = "SELECT COUNT(*) FROM user_payout_methods WHERE user_id = :user_id AND id != :id AND status = 'active'";
            $stmt = $this->db->prepare($otherMethodsQuery);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->fetchColumn() > 0) {
                return $this->sendResponse(false, 'Cannot delete default payout method. Please set another method as default first.', null, 400);
            }
        }

        try {
            // Soft delete by setting status to inactive
            $query = "UPDATE user_payout_methods SET status = 'inactive', updated_at = now() WHERE id = :id AND user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            return $this->sendResponse(true, 'Payout method deleted successfully');
        } catch (Exception $e) {
            error_log("Error deleting payout method: " . $e->getMessage());
            return $this->sendResponse(false, 'Failed to delete payout method', null, 500);
        }
    }

    private function setDefaultMethod($userId, $id)
    {
        // Verify ownership
        if (!$this->verifyOwnership($userId, $id)) {
            return $this->sendResponse(false, 'Payout method not found or access denied', null, 404);
        }

        try {
            $this->db->beginTransaction();

            // Unset all other defaults for this user
            $unsetQuery = "UPDATE user_payout_methods SET is_default = FALSE WHERE user_id = :user_id";
            $stmt = $this->db->prepare($unsetQuery);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            // Set the specified method as default
            $setQuery = "UPDATE user_payout_methods SET is_default = TRUE, updated_at = now() WHERE id = :id AND user_id = :user_id";
            $stmt = $this->db->prepare($setQuery);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            $this->db->commit();

            return $this->sendResponse(true, 'Default payout method updated successfully');
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error setting default payout method: " . $e->getMessage());
            return $this->sendResponse(false, 'Failed to update default payout method', null, 500);
        }
    }

    private function validateMethodFields($methodType, $input)
    {
        switch ($methodType) {
            case 'bank_transfer':
                if (empty($input['bank_name']) || empty($input['account_number']) || empty($input['account_name'])) {
                    return ['valid' => false, 'message' => 'Bank name, account number, and account name are required for bank transfer'];
                }
                break;

            case 'mpesa':
                if (empty($input['phone_number'])) {
                    return ['valid' => false, 'message' => 'Phone number is required for M-Pesa'];
                }
                // Validate phone number format
                if (!preg_match('/^254[0-9]{9}$|^0[0-9]{9}$/', $input['phone_number'])) {
                    return ['valid' => false, 'message' => 'Invalid phone number format. Use 254XXXXXXXXX or 0XXXXXXXXX'];
                }
                break;

            case 'paypal':
                if (empty($input['paypal_email']) || !filter_var($input['paypal_email'], FILTER_VALIDATE_EMAIL)) {
                    return ['valid' => false, 'message' => 'Valid PayPal email is required'];
                }
                break;
        }

        return ['valid' => true, 'message' => ''];
    }

    private function verifyOwnership($userId, $methodId)
    {
        $query = "SELECT COUNT(*) FROM user_payout_methods WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $methodId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        return $stmt->fetchColumn() > 0;
    }

    private function getMethodById($id)
    {
        $query = "SELECT * FROM user_payout_methods WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getUserId()
    {
        // Use the same authentication method as other endpoints
        $user = Auth::authenticate();
        return $user ? $user['user_id'] : null;
    }

    private function maskAccountNumber($accountNumber)
    {
        $length = strlen($accountNumber);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }
        return str_repeat('*', $length - 4) . substr($accountNumber, -4);
    }

    private function maskPhoneNumber($phoneNumber)
    {
        $length = strlen($phoneNumber);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }
        return substr($phoneNumber, 0, 3) . str_repeat('*', $length - 7) . substr($phoneNumber, -4);
    }

    private function sendResponse($success, $message, $data = null, $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');

        $response = [
            'success' => $success,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        echo json_encode($response);
        exit;
    }
}

// Initialize and handle request
try {
    $api = new PayoutMethodsAPI($pdo);
    $api->handleRequest();
} catch (Exception $e) {
    error_log("Payout Methods API Fatal Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
