<?php
// Test the actual seller-auctions API endpoint

require_once 'auctions/seller-auctions.php';

// This should include the actual API logic
// Let's make a simple HTTP test instead

echo "Testing seller auctions API endpoint...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/auctions/seller-auctions.php?sellerId=9&status=all&page=1&limit=5');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6Imtpc2gxIiwibG9naW5fcm9sZSI6ImJ1eWVyIiwic2Vzc2lvbl9pZCI6bnVsbCwiaWF0IjoxNzU5OTQ4NzA3LCJleHAiOjE3NjAwMzUxMDd9.0jGMm3dYzJ07gSZ6i_3mMtoH5JRmipOaV18_l7wIWWk'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";

if ($response) {
    $data = json_decode($response, true);
    if ($data && isset($data['success']) && $data['success']) {
        $auctions = $data['data']['auctions'] ?? [];
        echo "Found " . count($auctions) . " auctions\n";

        if (!empty($auctions)) {
            $auction = $auctions[0];
            echo "\nFirst auction sample:\n";
            echo "  ID: " . ($auction['id'] ?? 'N/A') . "\n";
            echo "  Title: " . ($auction['title'] ?? 'N/A') . "\n";
            echo "  Primary Image: " . ($auction['primary_image'] ?? 'N/A') . "\n";
            echo "  Images Count: " . (count($auction['images'] ?? [])) . "\n";
            echo "  Image URL (legacy): " . ($auction['image_url'] ?? 'N/A') . "\n";
        }
    } else {
        echo "API Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "No response received\n";
}
