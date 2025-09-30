<?php
// Simple POST to place-bid.php for testing
$url = 'http://localhost:8000/place-bid.php';
$data = [
    'auction_id' => 9,
    'bid_amount' => 520000,
    'user_id' => 2
];
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode($data),
        'ignore_errors' => true,
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo "HTTP response:\n";
if (isset($http_response_header)) {
    foreach ($http_response_header as $h) echo $h . "\n";
}
echo "\nBODY:\n";
echo $result;
