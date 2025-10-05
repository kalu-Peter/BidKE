<?php
// Test script for updated list_payments.php with refunded filter
echo "=== Testing Updated list_payments.php with refunded filter ===\n\n";

// Test normal payments
echo "1. Testing normal payments (no filter):\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/payments/admin/list_payments.php?page=1&limit=5');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "   ✓ Normal payments endpoint working\n";
        echo "   Total payments: " . $data['total'] . "\n";
        echo "   Sample payment types: ";
        foreach ($data['data'] as $payment) {
            echo $payment['type'] . " ";
        }
        echo "\n\n";
    } else {
        echo "   ❌ Error: " . ($data['message'] ?? 'Unknown error') . "\n\n";
    }
} else {
    echo "   ❌ Failed to connect to endpoint\n\n";
}

// Test refunded payments filter
echo "2. Testing refunded payments filter:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/payments/admin/list_payments.php?page=1&limit=5&refunded_only=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "   ✓ Refunded payments filter working\n";
        echo "   Total refunded payments: " . $data['total'] . "\n";
        if (!empty($data['data'])) {
            echo "   Sample refunded payment:\n";
            $sample = $data['data'][0];
            echo "     - Type: " . $sample['type'] . "\n";
            echo "     - Refunded: " . ($sample['refunded'] ? 'Yes' : 'No') . "\n";
            echo "     - Description: " . $sample['description'] . "\n";
        } else {
            echo "   No refunded payments found\n";
        }
    } else {
        echo "   ❌ Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "   ❌ Failed to connect to refunded payments endpoint\n";
}

echo "\n=== Test Complete ===\n";
