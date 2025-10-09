<?php
// Test script for payout methods API
session_start();

// Mock user session for testing
$_SESSION['user_id'] = 1; // Assuming user with ID 1 exists

// Test creating a payout method
$testData = [
    'method_type' => 'bank_transfer',
    'bank_name' => 'Standard Chartered Bank',
    'account_number' => '1234567890',
    'account_name' => 'John Doe',
    'branch_code' => 'SCB001',
    'is_default' => true
];

echo "Testing Payout Methods API...\n";

// Test POST request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/payout-methods.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, '');
curl_setopt($ch, CURLOPT_COOKIEJAR, '');

// Set session cookie
curl_setopt($ch, CURLOPT_COOKIE, 'PHPSESSID=' . session_id());

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "POST Response (Code: $httpCode):\n";
echo $response . "\n\n";

// Test GET request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/payout-methods.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIE, 'PHPSESSID=' . session_id());

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "GET Response (Code: $httpCode):\n";
echo $response . "\n";
