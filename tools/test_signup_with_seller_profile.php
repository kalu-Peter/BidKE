<?php

/**
 * Test script to verify user signup creates both buyer and seller profiles
 */

// Change to API directory to fix relative paths
chdir(__DIR__ . '/../api');

require_once 'config/connect.php';
require_once 'models/User.php';
require_once 'models/BuyerProfile.php';
require_once 'models/SellerProfile.php';

// Test user data
$testUsername = 'testuser_' . time();
$testEmail = 'test_' . time() . '@example.com';
$testPhone = '+254700' . rand(100000, 999999);
$testPassword = 'TestPassword123';

echo "Testing user signup with both buyer and seller profiles...\n";
echo "Username: $testUsername\n";
echo "Email: $testEmail\n";
echo "Phone: $testPhone\n\n";

try {
    // Create user
    $user = new User();
    $user->username = $testUsername;
    $user->email = $testEmail;
    $user->phone = $testPhone;
    $user->password_hash = password_hash($testPassword, PASSWORD_DEFAULT);

    echo "Creating user with both roles...\n";
    $userId = $user->createWithBothRoles();

    if ($userId) {
        echo "✅ User created successfully with ID: $userId\n\n";

        // Check if buyer profile was created
        $buyerProfile = new BuyerProfile();
        $buyerExists = $buyerProfile->getByUserId($userId);

        if ($buyerExists) {
            echo "✅ Buyer profile created successfully\n";
        } else {
            echo "❌ Buyer profile NOT found\n";
        }

        // Check if seller profile was created
        $sellerProfile = new SellerProfile();
        $sellerExists = $sellerProfile->getByUserId($userId);

        if ($sellerExists) {
            echo "✅ Seller profile created successfully\n";
            echo "   - Verification status: " . $sellerProfile->verification_status . "\n";
            echo "   - Seller status: " . $sellerProfile->seller_status . "\n";
            echo "   - Can list auctions: " . ($sellerProfile->can_list_auctions ? 'Yes' : 'No') . "\n";
            echo "   - Max active listings: " . $sellerProfile->max_active_listings . "\n";
            echo "   - Subscription plan: " . $sellerProfile->subscription_plan . "\n";
        } else {
            echo "❌ Seller profile NOT found\n";
        }

        // Check user roles
        $roles = $user->getLoginRoles();
        echo "\n👥 User roles:\n";
        foreach ($roles as $role) {
            echo "   - " . $role['role_name'] . " (" . $role['role_status'] . ")\n";
        }

        echo "\n🎉 All checks completed!\n";
    } else {
        echo "❌ Failed to create user\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";
