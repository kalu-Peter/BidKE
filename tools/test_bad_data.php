<?php
// Test with potentially problematic data to trigger the 500 error

$testData = [
    'business_name' => 'Test Business',  // Valid data
    'business_type' => 'company',  // Valid enum value
    'business_registration' => 'REG123',
    'tax_pin' => 'TAX123',
    'business_address' => 'Test Address',
    'business_email' => 'test@example.com',
    'business_phone' => '123456789',
    'business_description' => 'Test description'
];

require_once __DIR__ . '/../api/config/connect.php';
require_once __DIR__ . '/../api/models/Auth.php';

try {
    $token = Auth::generateToken(99, 'testuser99', 'seller'); // Use non-existent user ID

    $url = 'http://localhost:8000/auth/seller-profile.php';
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Origin: http://localhost:5173'
    ];

    $postData = json_encode($testData);

    echo "Testing with potentially problematic data...\n";
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
        echo "HTTP Error: " . print_r($error, true) . "\n";

        // Check if error log file was created
        if (file_exists('../php_errors.log')) {
            echo "\nPHP Error Log:\n";
            echo file_get_contents('../php_errors.log');
        }
    } else {
        echo "Response: " . $result . "\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
