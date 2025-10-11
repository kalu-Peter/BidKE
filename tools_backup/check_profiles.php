<?php

/**
 * Check if the last registered user has both buyer and seller profiles
 */

// Change to API directory to fix relative paths
chdir(__DIR__ . '/../api');

try {
    require_once 'config/connect.php';

    $db = Database::getInstance()->getConnection();

    // Get the most recent user
    $userQuery = "SELECT * FROM users ORDER BY id DESC LIMIT 1";
    $userStmt = $db->prepare($userQuery);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if ($user) {
        echo "Most recent user:\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Username: " . $user['username'] . "\n";
        echo "Email: " . $user['email'] . "\n\n";

        // Check buyer profile
        $buyerQuery = "SELECT * FROM buyer_profiles WHERE user_id = ?";
        $buyerStmt = $db->prepare($buyerQuery);
        $buyerStmt->execute([$user['id']]);
        $buyerProfile = $buyerStmt->fetch();

        if ($buyerProfile) {
            echo "✅ Buyer profile exists (ID: " . $buyerProfile['id'] . ")\n";
        } else {
            echo "❌ Buyer profile NOT found\n";
        }

        // Check seller profile
        $sellerQuery = "SELECT * FROM seller_profiles WHERE user_id = ?";
        $sellerStmt = $db->prepare($sellerQuery);
        $sellerStmt->execute([$user['id']]);
        $sellerProfile = $sellerStmt->fetch();

        if ($sellerProfile) {
            echo "✅ Seller profile exists (ID: " . $sellerProfile['id'] . ")\n";
            echo "   - Verification status: " . $sellerProfile['verification_status'] . "\n";
            echo "   - Seller status: " . $sellerProfile['seller_status'] . "\n";
            echo "   - Can list auctions: " . ($sellerProfile['can_list_auctions'] ? 'Yes' : 'No') . "\n";
            echo "   - Max active listings: " . $sellerProfile['max_active_listings'] . "\n";
        } else {
            echo "❌ Seller profile NOT found\n";
        }

        // Check user roles
        $rolesQuery = "SELECT r.role_name, ur.is_primary, ur.role_status 
                       FROM user_roles ur 
                       JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = ?";
        $rolesStmt = $db->prepare($rolesQuery);
        $rolesStmt->execute([$user['id']]);
        $roles = $rolesStmt->fetchAll();

        echo "\n👥 User roles:\n";
        if ($roles) {
            foreach ($roles as $role) {
                $primary = $role['is_primary'] ? ' (Primary)' : '';
                echo "   - " . $role['role_name'] . $primary . " (" . $role['role_status'] . ")\n";
            }
        } else {
            echo "   ❌ No roles found\n";
        }
    } else {
        echo "❌ No users found in database\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\nDatabase check completed.\n";
