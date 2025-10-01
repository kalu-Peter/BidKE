<?php
// Direct test of the seller-profile.php endpoint with realistic data

$testData = [
    'business_name' => 'Test Business Name',
    'business_type' => 'company',  // Using valid enum value
    'business_registration' => 'REG123456',
    'tax_pin' => 'TAX789',
    'business_address' => '123 Test Street, Test City',
    'business_email' => 'business@test.com',
    'business_phone' => '+254700000000',
    'business_description' => 'A test business description'
];

// Get a valid JWT token first
require_once __DIR__ . '/../api/config/connect.php';
require_once __DIR__ . '/../api/models/Auth.php';

// Simulate login to get a valid token
try {
    echo "Getting authentication token...\n";

    // For testing, let's generate a token for user ID 2 (testseller1)
    $token = Auth::generateToken(2, 'testseller1', 'seller');
    echo "Token generated: " . substr($token, 0, 50) . "...\n";

    // Now make the API call
    $url = 'http://localhost:8000/auth/seller-profile.php';
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Origin: http://localhost:5173'
    ];

    $postData = json_encode($testData);

    echo "Making API call...\n";
    echo "URL: $url\n";
    echo "Data: $postData\n\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'PUT',
            'header' => implode("\r\n", $headers),
            'content' => $postData
        ]
    ]);

    $result = file_get_contents($url, false, $context);

    if ($result === false) {
        echo "ERROR: Request failed\n";
        $error = error_get_last();
        echo "PHP Error: " . print_r($error, true) . "\n";
    } else {
        echo "SUCCESS: Response received\n";
        echo "Response: " . $result . "\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
