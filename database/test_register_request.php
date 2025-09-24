<?php
// Test script for registration endpoint
$data = [
    'username' => 'newbuyer1',
    'email' => 'newbuyer1@example.com',
    'password' => 'Password1',
    'phone' => '+254700000003'
];
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];
$context = stream_context_create($opts);
$response = @file_get_contents('http://localhost:8000/auth/register.php', false, $context);
if ($response === false) {
    echo "No response.\n";
    if (isset($http_response_header)) print_r($http_response_header);
    exit(1);
}
echo "Response body:\n" . $response . "\n\n";
if (isset($http_response_header)) {
    echo "Response headers:\n";
    foreach ($http_response_header as $h) echo $h . "\n";
}
?>