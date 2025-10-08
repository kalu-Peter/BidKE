<?php
// Debug the PUT request to user-verification-management.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing UPDATE functionality ===\n";

// Simulate the PUT request payload
$testPayload = [
    'user_id' => 2, // Use an existing user ID
    'user_status' => 'active',
    'is_verified' => true,
    'verification_status' => 'verified',
    'verified_by' => 1,
    'seller_status' => 'active'
];

try {
    require_once 'config/connect.php';
    require_once 'models/Auth.php';

    echo "✓ Required files loaded\n";

    $db = Database::getInstance()->getConnection();
    echo "✓ Database connection established\n";

    // Test if user exists
    $checkUser = $db->prepare("SELECT id, username FROM users WHERE id = :user_id");
    $checkUser->execute(['user_id' => $testPayload['user_id']]);
    $user = $checkUser->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "✓ User found: " . $user['username'] . "\n";
    } else {
        echo "✗ User not found with ID: " . $testPayload['user_id'] . "\n";
        exit;
    }

    // Test user table update
    $db->beginTransaction();

    $userUpdates = [];
    $userParams = ['user_id' => $testPayload['user_id']];

    if ($testPayload['user_status'] !== null) {
        $userUpdates[] = "status = :user_status";
        $userParams['user_status'] = $testPayload['user_status'];
    }

    if ($testPayload['is_verified'] !== null) {
        $userUpdates[] = "is_verified = :is_verified";
        $userParams['is_verified'] = $testPayload['is_verified'] ? 1 : 0;
    }

    if (!empty($userUpdates)) {
        $userUpdates[] = "updated_at = NOW()";
        $userQuery = "UPDATE users SET " . implode(', ', $userUpdates) . " WHERE id = :user_id";
        echo "User query: $userQuery\n";

        $userStmt = $db->prepare($userQuery);
        $result = $userStmt->execute($userParams);

        if ($result) {
            echo "✓ User table updated successfully\n";
        } else {
            echo "✗ User table update failed\n";
            print_r($userStmt->errorInfo());
        }
    }

    // Test seller_profiles table update
    $sellerUpdates = [];
    $sellerParams = ['user_id' => $testPayload['user_id']];

    if ($testPayload['verification_status'] !== null) {
        $sellerUpdates[] = "verification_status = :verification_status";
        $sellerParams['verification_status'] = $testPayload['verification_status'];
    }

    if ($testPayload['verified_by'] !== null) {
        $sellerUpdates[] = "verified_by = :verified_by";
        $sellerParams['verified_by'] = $testPayload['verified_by'];
    }

    if ($testPayload['seller_status'] !== null) {
        $sellerUpdates[] = "seller_status = :seller_status";
        $sellerParams['seller_status'] = $testPayload['seller_status'];
    }

    if (!empty($sellerUpdates)) {
        $sellerUpdates[] = "updated_at = NOW()";

        if ($testPayload['verification_status'] === 'verified') {
            $sellerUpdates[] = "verified_at = NOW()";
        }

        // Check if seller profile exists
        $checkQuery = "SELECT id FROM seller_profiles WHERE user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute(['user_id' => $testPayload['user_id']]);

        if ($checkStmt->rowCount() > 0) {
            // Update existing seller profile
            $sellerQuery = "UPDATE seller_profiles SET " . implode(', ', $sellerUpdates) . " WHERE user_id = :user_id";
            echo "Seller update query: $sellerQuery\n";

            $sellerStmt = $db->prepare($sellerQuery);
            $result = $sellerStmt->execute($sellerParams);

            if ($result) {
                echo "✓ Seller profile updated successfully\n";
            } else {
                echo "✗ Seller profile update failed\n";
                print_r($sellerStmt->errorInfo());
            }
        } else {
            echo "ℹ No seller profile exists for this user\n";
        }
    }

    $db->rollBack(); // Don't actually save changes
    echo "✓ Transaction rolled back (test only)\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "✗ File: " . $e->getFile() . "\n";
    echo "✗ Line: " . $e->getLine() . "\n";
    if (isset($db)) {
        $db->rollBack();
    }
}

echo "\nTest completed.\n";
