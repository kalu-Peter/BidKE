<?php
// Simple test script to POST JSON to the admin-signup endpoint and print response and headers
$data = [
    'username' => 'peteradmin',
    'email' => 'peter@admin.com',
    'password' => 'peter123',
    'phone' => '+254700000000',
    'fullName' => 'Peter Admin'
];
$json = json_encode($data);
$options = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $json,
        'ignore_errors' => true
    ]
];
$context = stream_context_create($options);
$response = @file_get_contents('http://localhost:8000/auth/admin-signup.php', false, $context);
if ($response === false) {
    echo "No response received.\n";
    if (isset($http_response_header)) {
        echo "Response headers:\n";
        print_r($http_response_header);
    }
    exit(1);
}

echo "Response body:\n";
echo $response . "\n\n";

if (isset($http_response_header)) {
    echo "Response headers:\n";
    foreach ($http_response_header as $h) {
        echo $h . "\n";
    }
}

?>