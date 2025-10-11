<?php
/**
 * Test script to verify signup creates both buyer and seller profiles
 */

// Change to the API directory so the relative paths work correctly
chdir(__DIR__ . '/../api');

require_once 'config/connect.php';
require_once 'models/User.php';
require_once 'models/Auth.php';

echo "Testing unified signup with both profiles...\n\n";

// Test data
$testUsername = 'testuser_' . time();
$testEmail = 'test_' . time() . '@example.com';
$testPhone = '+254700000' . substr(time(), -3);
$testPassword = 'TestPassword123';

try {
    $user = new User();
    
    // Set user properties
    $user->username = $testUsername;
    $user->email = $testEmail;
    $user->phone = $testPhone;
    $user->password_hash = Auth::hashPassword($testPassword);
    
    echo "Creating user with both roles...\n";
    echo "Username: $testUsername\n";
    echo "Email: $testEmail\n";
    echo "Phone: $testPhone\n\n";
    
    // Create user with both roles
    $user_id = $user->createWithBothRoles();
    
    if ($user_id) {
        echo "✓ User created successfully with ID: $user_id\n\n";
        
        // Check if buyer profile was created
        echo "Checking buyer profile...\n";
        $buyerProfile = $user->getBuyerProfile();
        if ($buyerProfile) {
            echo "✓ Buyer profile found: ID {$buyerProfile['id']}\n";
        } else {
            echo "✗ Buyer profile NOT found\n";
        }
        
        // Check if seller profile was created
        echo "Checking seller profile...\n";
        $sellerProfile = $user->getSellerProfile();
        if ($sellerProfile) {
            echo "✓ Seller profile found: ID {$sellerProfile['id']}\n";
            echo "  Business Type: {$sellerProfile['business_type']}\n";
            echo "  Verification Status: {$sellerProfile['verification_status']}\n";
            echo "  Business Verified: " . ($sellerProfile['business_verified'] ? 'Yes' : 'No') . "\n";
        } else {
            echo "✗ Seller profile NOT found\n";
        }
        
        // Check user roles
        echo "\nChecking user roles...\n";
        $roles = $user->getLoginRoles();
        foreach ($roles as $role) {
            echo "✓ Role: {$role['role_name']} (Status: {$role['role_status']}, Primary: " . ($role['is_primary'] ? 'Yes' : 'No') . ")\n";
        }
        
        echo "\n✓ Test completed successfully!\n";
        
    } else {
        echo "✗ Failed to create user\n";
    }
    
} catch (Exception $e) {
    echo "✗ Test failed with error: " . $e->getMessage() . "\n";
}
?>