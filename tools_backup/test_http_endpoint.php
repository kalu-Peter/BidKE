<?php
// Test the actual HTTP endpoint
echo "=== Testing HTTP Endpoint ===\n\n";

// First, let's create another test payout for testing
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Create another test payout
    $stmt = $db->prepare("INSERT INTO payouts (seller_id, auction_id, payment_id, gross_amount, platform_fee, net_amount, status, created_at) VALUES (1, 1, 1, 150.00, 15.00, 135.00, 'pending', NOW())");
    $stmt->execute();
    $testPayoutId = $db->lastInsertId();
    echo "Created test payout ID: $testPayoutId\n\n";

    // Test the HTTP endpoint
    $url = 'http://localhost:8000/payments/admin/process_payout_and_commission.php';
    $data = json_encode(['payout_id' => $testPayoutId]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    echo "Calling endpoint: $url\n";
    echo "Request data: $data\n\n";

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo "❌ cURL Error: $error\n";
    } else {
        echo "HTTP Status Code: $httpCode\n";
        echo "Response: $response\n\n";

        $responseData = json_decode($response, true);

        if ($responseData && $responseData['success']) {
            echo "✅ Endpoint test successful!\n";
            echo "   Payout ID: {$responseData['payout_id']}\n";
            echo "   Commission ID: {$responseData['commission_id']}\n";
            echo "   Payout Amount: {$responseData['payout_amount']}\n";
            echo "   Platform Fee: {$responseData['platform_fee']}\n";
        } else {
            echo "❌ Endpoint returned error: " . ($responseData['message'] ?? 'Unknown error') . "\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
}

echo "\n=== HTTP Test Complete ===\n";
