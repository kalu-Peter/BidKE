<?php

/**
 * Test the auctions.php endpoint for motorbikes category
 */

$base_url = 'http://localhost:8000';
$test_url = $base_url . '/auctions.php?category=motorbikes&status=live&limit=5';

echo "Testing Motorbikes API endpoint...\n";
echo "URL: $test_url\n\n";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

// Execute the request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_error($ch)) {
    echo "cURL Error: " . curl_error($ch) . "\n";
    curl_close($ch);
    exit(1);
}

curl_close($ch);

echo "HTTP Status Code: $http_code\n";
echo "Response:\n";

if ($http_code === 200) {
    $data = json_decode($response, true);
    if ($data) {
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";

        // Show some stats
        if (isset($data['data']) && is_array($data['data'])) {
            $auctions = $data['data'];
            echo "\nStats:\n";
            echo "- Total auctions returned: " . count($auctions) . "\n";
            echo "- Total available: " . ($data['pagination']['total'] ?? 'N/A') . "\n";

            if (!empty($auctions)) {
                $first_auction = $auctions[0];
                echo "- First auction title: " . ($first_auction['title'] ?? 'N/A') . "\n";
                echo "- Category: " . ($first_auction['category_name'] ?? 'N/A') . "\n";
                echo "- Has images: " . (isset($first_auction['images']) ? count($first_auction['images']) : 'N/A') . "\n";
            }
        }
    } else {
        echo "Failed to decode JSON response\n";
        echo "Raw response: $response\n";
    }
} else {
    echo "Error response: $response\n";
}
