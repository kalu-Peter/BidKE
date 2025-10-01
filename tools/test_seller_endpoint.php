<?php
// Test script to call seller-profile.php directly
require_once '../api/config/connect.php';

// Simulate a logged-in user (replace with actual token)
$testToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6InRlc3RzZWxsZXIxIiwibG9naW5fcm9sZSI6InNlbGxlciIsInNlc3Npb25faWQiOm51bGwsImlhdCI6MTcyNzc4MDgzOSwiZXhwIjoxNzI3ODY3MjM5fQ.example";

// Simple test data
$testData = [
    'business_name' => 'Test Business',
    'business_type' => 'retail',
    'business_address' => 'Test Address'
];

// Make HTTP request to the endpoint
$url = 'http://localhost:8000/auth/seller-profile.php';
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $testToken
];

$context = stream_context_create([
    'http' => [
        'method' => 'PUT',
        'header' => implode("\r\n", $headers),
        'content' => json_encode($testData)
    ]
]);

echo "Testing seller-profile.php endpoint...\n";
echo "URL: $url\n";
echo "Data: " . json_encode($testData) . "\n\n";

$result = file_get_contents($url, false, $context);

if ($result === false) {
    echo "ERROR: Request failed\n";
    $error = error_get_last();
    echo "PHP Error: " . $error['message'] . "\n";
} else {
    echo "Response: " . $result . "\n";
}
