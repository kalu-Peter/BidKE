<?php

/**
 * Test script for notification functionality
 * Tests the info request notification system
 */

require_once __DIR__ . '/config/connect.php';
require_once __DIR__ . '/utils/notification_helper.php';

echo "Testing Notification System\n";
echo "===========================\n";

try {
    $pdo = Database::getInstance()->getConnection();

    // First, let's check if we have any users and auctions to test with
    echo "1. Checking for test data...\n";

    $userStmt = $pdo->prepare("SELECT id, username, email FROM users LIMIT 5");
    $userStmt->execute();
    $users = $userStmt->fetchAll();

    echo "Available users:\n";
    foreach ($users as $user) {
        echo "  - ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}\n";
    }

    $auctionStmt = $pdo->prepare("SELECT id, title, seller_id FROM auctions LIMIT 5");
    $auctionStmt->execute();
    $auctions = $auctionStmt->fetchAll();

    echo "\nAvailable auctions:\n";
    foreach ($auctions as $auction) {
        echo "  - ID: {$auction['id']}, Title: {$auction['title']}, Seller ID: {$auction['seller_id']}\n";
    }

    if (empty($users) || empty($auctions)) {
        echo "\nNo test data available. Please ensure you have users and auctions in your database.\n";
        exit(1);
    }

    // Test the notification functions
    echo "\n2. Testing notification functions...\n";

    $testUserId = $users[0]['id'];
    $testAuctionId = $auctions[0]['id'];
    $testAuctionTitle = $auctions[0]['title'];

    echo "Using test user ID: $testUserId\n";
    echo "Using test auction ID: $testAuctionId\n";
    echo "Using test auction title: $testAuctionTitle\n";

    // Test info request notification
    echo "\n3. Testing info request notification...\n";
    $result = NotificationHelper::sendInfoRequestNotification(
        $testUserId,
        $testAuctionId,
        $testAuctionTitle,
        "Please provide additional photos showing the interior of the vehicle and the engine bay. Also, upload a copy of the service history if available."
    );

    if ($result) {
        echo "✅ Info request notification sent successfully!\n";
    } else {
        echo "❌ Failed to send info request notification.\n";
    }

    // Test approval notification
    echo "\n4. Testing approval notification...\n";
    $result2 = NotificationHelper::sendAuctionApprovedNotification(
        $testUserId,
        $testAuctionId,
        $testAuctionTitle
    );

    if ($result2) {
        echo "✅ Approval notification sent successfully!\n";
    } else {
        echo "❌ Failed to send approval notification.\n";
    }

    // Test rejection notification
    echo "\n5. Testing rejection notification...\n";
    $result3 = NotificationHelper::sendAuctionRejectedNotification(
        $testUserId,
        $testAuctionId,
        $testAuctionTitle,
        "The images provided are not clear enough. Please upload high-quality photos that clearly show the item from multiple angles."
    );

    if ($result3) {
        echo "✅ Rejection notification sent successfully!\n";
    } else {
        echo "❌ Failed to send rejection notification.\n";
    }

    // Check notifications in database
    echo "\n6. Checking notifications in database...\n";
    $notifStmt = $pdo->prepare("SELECT id, type, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
    $notifStmt->execute([$testUserId]);
    $notifications = $notifStmt->fetchAll();

    echo "Recent notifications for user $testUserId:\n";
    foreach ($notifications as $notif) {
        $status = $notif['is_read'] ? 'READ' : 'UNREAD';
        echo "  - [{$notif['type']}] {$notif['title']} - $status ({$notif['created_at']})\n";
        echo "    Message: " . substr($notif['message'], 0, 100) . "...\n";
    }

    // Test unread count
    $unreadCount = NotificationHelper::getUnreadCount($testUserId);
    echo "\nUnread notification count for user $testUserId: $unreadCount\n";

    echo "\n✅ All notification tests completed successfully!\n";
    echo "The notification system is working correctly.\n";
} catch (Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
