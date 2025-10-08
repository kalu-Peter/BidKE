<?php
// Test PUT request to user-verification-management.php
header('Content-Type: application/json');

// Test payload
$testData = [
    'user_id' => 2,
    'user_status' => 'active',
    'is_verified' => true,
    'verification_status' => 'verified',
    'verified_by' => 1,
    'seller_status' => 'active'
];

$url = 'http://localhost:8000/admin/user-verification-management.php';

// You would need to get a real admin token for this to work
// For now, let's just test the request format
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer fake-token-for-test'
]);

echo "Testing PUT request to: $url\n";
echo "Payload: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($error) {
    echo "CURL Error: $error\n";
}
