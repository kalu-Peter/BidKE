<?php

/**
 * Payout Method Helper Functions
 * 
 * Helper functions for managing and retrieving user payout methods
 */

/**
 * Get the user's default payout method for use in payout creation
 * 
 * @param PDO $db Database connection
 * @param int $userId User ID
 * @return string|null Default payout method string or null if none found
 */
function getUserDefaultPayoutMethod($db, $userId)
{
    try {
        $query = "
            SELECT 
                method_type,
                bank_name,
                account_number,
                phone_number,
                paypal_email
            FROM user_payout_methods 
            WHERE user_id = :user_id 
                AND is_default = TRUE 
                AND status = 'active'
            LIMIT 1
        ";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $method = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$method) {
            // No default method found, fallback to any active method
            $fallbackQuery = "
                SELECT 
                    method_type,
                    bank_name,
                    account_number,
                    phone_number,
                    paypal_email
                FROM user_payout_methods 
                WHERE user_id = :user_id 
                    AND status = 'active'
                ORDER BY created_at ASC
                LIMIT 1
            ";

            $fallbackStmt = $db->prepare($fallbackQuery);
            $fallbackStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $fallbackStmt->execute();

            $method = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$method) {
            return null; // No payout method configured
        }

        // Format the payout method string based on type
        return formatPayoutMethodString($method);
    } catch (Exception $e) {
        error_log("Error getting user default payout method for user $userId: " . $e->getMessage());
        return null;
    }
}

/**
 * Format payout method data into a standardized string for storage
 * 
 * @param array $method Payout method data from database
 * @return string Formatted payout method string
 */
function formatPayoutMethodString($method)
{
    switch ($method['method_type']) {
        case 'bank_transfer':
            $bankName = $method['bank_name'] ?? 'Unknown Bank';
            $accountNumber = $method['account_number'] ?? '';
            // Mask account number for security (show last 4 digits)
            $maskedAccount = strlen($accountNumber) > 4
                ? str_repeat('*', strlen($accountNumber) - 4) . substr($accountNumber, -4)
                : str_repeat('*', strlen($accountNumber));
            return "Bank Transfer - {$bankName} (****{$maskedAccount})";

        case 'mpesa':
            $phoneNumber = $method['phone_number'] ?? '';
            // Mask phone number (show last 4 digits)
            $maskedPhone = strlen($phoneNumber) > 4
                ? substr($phoneNumber, 0, 3) . str_repeat('*', strlen($phoneNumber) - 7) . substr($phoneNumber, -4)
                : str_repeat('*', strlen($phoneNumber));
            return "M-Pesa - {$maskedPhone}";

        case 'paypal':
            $email = $method['paypal_email'] ?? '';
            // Mask email
            $atPos = strpos($email, '@');
            if ($atPos !== false && $atPos > 2) {
                $maskedEmail = substr($email, 0, 2) . str_repeat('*', $atPos - 2) . substr($email, $atPos);
            } else {
                $maskedEmail = str_repeat('*', strlen($email));
            }
            return "PayPal - {$maskedEmail}";

        default:
            return $method['method_type'] ?? 'Unknown Method';
    }
}

/**
 * Get detailed payout method information for processing
 * 
 * @param PDO $db Database connection
 * @param int $userId User ID
 * @return array|null Detailed payout method data or null if none found
 */
function getUserDefaultPayoutMethodDetails($db, $userId)
{
    try {
        $query = "
            SELECT *
            FROM user_payout_methods 
            WHERE user_id = :user_id 
                AND is_default = TRUE 
                AND status = 'active'
            LIMIT 1
        ";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $method = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$method) {
            // No default method found, fallback to any active method
            $fallbackQuery = "
                SELECT *
                FROM user_payout_methods 
                WHERE user_id = :user_id 
                    AND status = 'active'
                ORDER BY created_at ASC
                LIMIT 1
            ";

            $fallbackStmt = $db->prepare($fallbackQuery);
            $fallbackStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $fallbackStmt->execute();

            $method = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
        }

        return $method ?: null;
    } catch (Exception $e) {
        error_log("Error getting user default payout method details for user $userId: " . $e->getMessage());
        return null;
    }
}

/**
 * Validate if a user has a valid payout method configured
 * 
 * @param PDO $db Database connection
 * @param int $userId User ID
 * @return bool True if user has a valid payout method, false otherwise
 */
function userHasValidPayoutMethod($db, $userId)
{
    try {
        $query = "
            SELECT COUNT(*) as count
            FROM user_payout_methods 
            WHERE user_id = :user_id 
                AND status = 'active'
        ";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['count'] > 0;
    } catch (Exception $e) {
        error_log("Error checking payout method for user $userId: " . $e->getMessage());
        return false;
    }
}
