<?php
/**
 * Minimal test directly calling User methods
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Direct User model test...\n";

try {
    // Change directory to the api folder
    chdir(__DIR__ . '/../api');
    
    require_once 'config/connect.php';
    require_once 'models/User.php';
    require_once 'models/Auth.php';
    
    echo "Dependencies loaded successfully.\n";
    
    // Test data
    $username = 'directtest_' . time();
    $email = 'directtest_' . time() . '@example.com';
    $phone = '+254700' . substr(time(), -6);
    $password = 'TestPassword123';
    
    echo "Creating user: $username\n";
    
    $user = new User();
    $user->username = $username;
    $user->email = $email;
    $user->phone = $phone;
    $user->password_hash = Auth::hashPassword($password);
    
    echo "User object created, calling createWithBothRoles()...\n";
    
    $user_id = $user->createWithBothRoles();
    
    if ($user_id) {
        echo "✓ Success! User created with ID: $user_id\n";
        
        // Check profiles
        $buyer = $user->getBuyerProfile();
        $seller = $user->getSellerProfile();
        
        echo "Buyer profile: " . ($buyer ? "Found (ID: {$buyer['id']})" : "NOT FOUND") . "\n";
        echo "Seller profile: " . ($seller ? "Found (ID: {$seller['id']})" : "NOT FOUND") . "\n";
        
    } else {
        echo "✗ Failed to create user\n";
    }
    
} catch (Exception $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
?>