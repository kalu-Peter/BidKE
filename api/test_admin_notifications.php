<?php

/**
 * Test admin listings API with notification integration
 */

echo "Testing Admin Listings API with Notifications\n";
echo "============================================\n";

$baseUrl = 'http://localhost:8000/admin/listings.php';

// Test data
$testData = [
    'auction_id' => 13, // Kawasaki auction
    'action' => 'request_info',
    'message' => 'Please provide additional photos of the engine and a detailed maintenance history. Also include the registration documents.'
];

echo "1. Testing request_info action...\n";
echo "Request data: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $baseUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($testData),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $responseData = json_decode($response, true);
    if ($responseData && $responseData['success']) {
        echo "✅ Admin action completed successfully!\n";

        // Now check if notification was sent to seller (user_id = 18 for Kawasaki auction)
        echo "\n2. Checking if notification was sent to seller...\n";

        require_once __DIR__ . '/config/connect.php';

        try {
            $pdo = Database::getInstance()->getConnection();

            // Get the seller ID for the auction
            $auctionStmt = $pdo->prepare("SELECT seller_id, title FROM auctions WHERE id = ?");
            $auctionStmt->execute([13]);
            $auction = $auctionStmt->fetch();

            if ($auction) {
                $sellerId = $auction['seller_id'];
                echo "Seller ID: $sellerId\n";
                echo "Auction Title: {$auction['title']}\n";

                // Check recent notifications for this seller
                $notifStmt = $pdo->prepare("
                    SELECT id, type, title, message, is_read, created_at 
                    FROM notifications 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 3
                ");
                $notifStmt->execute([$sellerId]);
                $notifications = $notifStmt->fetchAll();

                echo "Recent notifications for seller:\n";
                foreach ($notifications as $notif) {
                    $status = $notif['is_read'] ? 'READ' : 'UNREAD';
                    echo "  - [{$notif['type']}] {$notif['title']} - $status ({$notif['created_at']})\n";

                    if ($notif['type'] === 'info_request') {
                        echo "    ✅ Info request notification found!\n";
                        echo "    Message preview: " . substr($notif['message'], 0, 150) . "...\n";
                    }
                }
            } else {
                echo "❌ Auction not found\n";
            }
        } catch (Exception $e) {
            echo "❌ Database error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "❌ Admin action failed: " . ($responseData['error'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ HTTP request failed with status code: $httpCode\n";
}

echo "\n3. Testing notification API endpoint...\n";

// Test getting notifications via API
$notifUrl = 'http://localhost:8000/notifications.php?user_id=18&limit=5';

$ch2 = curl_init();
curl_setopt_array($ch2, [
    CURLOPT_URL => $notifUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json'
    ]
]);

$notifResponse = curl_exec($ch2);
$notifHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "Notifications API HTTP Status: $notifHttpCode\n";

if ($notifHttpCode === 200) {
    $notifData = json_decode($notifResponse, true);
    if ($notifData && $notifData['success']) {
        echo "✅ Notifications API working!\n";
        echo "Unread count: {$notifData['unread_count']}\n";
        echo "Recent notifications:\n";

        foreach ($notifData['data'] as $notif) {
            $status = $notif['is_read'] ? 'READ' : 'unread';
            echo "  - [{$notif['type']}] {$notif['title']} ($status)\n";
        }
    } else {
        echo "❌ Notifications API error: " . ($notifData['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Notifications API failed with status: $notifHttpCode\n";
}

echo "\n✅ Admin listings notification integration test completed!\n";
