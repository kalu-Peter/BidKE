<?php
echo "Testing Admin Endpoints - Updated...\n\n";

// Test each endpoint
$endpoints = [
    'Payouts' => 'http://localhost:8000/payments/admin/list_payouts.php?page=1&limit=5',
    'Payments' => 'http://localhost:8000/payments/admin/list_payments.php?page=1&limit=5',
    'Commissions' => 'http://localhost:8000/payments/admin/list_commissions.php?page=1&limit=5'
];

foreach ($endpoints as $name => $url) {
    echo "Testing $name endpoint: $url\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Content-Type: application/json\r\n"
        ]
    ]);

    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        echo "❌ Failed to fetch $name\n";
        $error = error_get_last();
        echo "Error: " . ($error['message'] ?? 'Unknown error') . "\n\n";
    } else {
        echo "✅ $name response received\n";
        $data = json_decode($response, true);
        if ($data) {
            echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
            echo "Total records: " . ($data['total'] ?? 'N/A') . "\n";
            echo "Data count: " . (isset($data['data']) ? count($data['data']) : 'N/A') . "\n";
            if (isset($data['message'])) {
                echo "Message: " . $data['message'] . "\n";
            }
            if (isset($data['error'])) {
                echo "Error: " . $data['error'] . "\n";
            }
        } else {
            echo "Raw response: " . substr($response, 0, 300) . "\n";
        }
        echo "\n";
    }
}
