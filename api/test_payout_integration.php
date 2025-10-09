<?php
// Test the payout methods integration
require_once 'config/connect.php';
require_once 'utils/payout_helper.php';

echo "=== Testing Payout Methods Integration ===\n\n";

try {
    $db = Database::getInstance()->getConnection();

    // First, let's create a test user and payout method
    echo "1. Creating test user and payout method...\n";

    // Check if test user exists
    $userStmt = $db->prepare("SELECT id FROM users WHERE username = 'test_seller' LIMIT 1");
    $userStmt->execute();
    $testUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$testUser) {
        // Create test user
        $createUserStmt = $db->prepare("
            INSERT INTO users (username, email, password_hash, status, created_at) 
            VALUES ('test_seller', 'test.seller@example.com', 'dummy_hash', 'active', NOW()) 
            RETURNING id
        ");
        $createUserStmt->execute();
        $userResult = $createUserStmt->fetch(PDO::FETCH_ASSOC);
        $userId = $userResult['id'];
        echo "   Created test user with ID: $userId\n";
    } else {
        $userId = $testUser['id'];
        echo "   Using existing test user with ID: $userId\n";
    }

    // Create test payout method
    $payoutMethodStmt = $db->prepare("
        INSERT INTO user_payout_methods (
            user_id, method_type, bank_name, account_number, account_name, 
            is_default, status, created_at
        ) VALUES (
            :user_id, 'bank_transfer', 'Test Bank', '1234567890', 'Test Seller Account',
            TRUE, 'active', NOW()
        ) RETURNING id
    ");
    $payoutMethodStmt->execute(['user_id' => $userId]);
    $methodResult = $payoutMethodStmt->fetch(PDO::FETCH_ASSOC);
    $methodId = $methodResult['id'];
    echo "   Created test payout method with ID: $methodId\n";

    // Test getting default payout method
    echo "\n2. Testing getUserDefaultPayoutMethod function...\n";
    $defaultMethod = getUserDefaultPayoutMethod($db, $userId);
    echo "   Default payout method: $defaultMethod\n";

    // Test getting detailed payout method
    echo "\n3. Testing getUserDefaultPayoutMethodDetails function...\n";
    $methodDetails = getUserDefaultPayoutMethodDetails($db, $userId);
    if ($methodDetails) {
        echo "   Method Type: {$methodDetails['method_type']}\n";
        echo "   Bank Name: {$methodDetails['bank_name']}\n";
        echo "   Account Name: {$methodDetails['account_name']}\n";
        echo "   Is Default: " . ($methodDetails['is_default'] ? 'Yes' : 'No') . "\n";
    } else {
        echo "   No payout method details found\n";
    }

    // Test validation function
    echo "\n4. Testing userHasValidPayoutMethod function...\n";
    $hasValidMethod = userHasValidPayoutMethod($db, $userId);
    echo "   User has valid payout method: " . ($hasValidMethod ? 'Yes' : 'No') . "\n";

    // Test with a user that has no payout methods
    echo "\n5. Testing with user that has no payout methods...\n";
    $noMethodUser = 999999; // Non-existent user ID
    $noMethod = getUserDefaultPayoutMethod($db, $noMethodUser);
    echo "   Default method for user with no methods: " . ($noMethod ? $noMethod : 'null') . "\n";

    // Clean up test data
    echo "\n6. Cleaning up test data...\n";
    $db->prepare("DELETE FROM user_payout_methods WHERE id = :id")->execute(['id' => $methodId]);
    echo "   Deleted test payout method\n";

    // Don't delete the test user as it might be used elsewhere

    echo "\n✅ All tests completed successfully!\n";
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
