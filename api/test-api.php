<?php
// Test the auction-details API
$url = 'http://localhost:8000/auction-details.php?id=4';

// Create a stream context with headers
$options = [
    'http' => [
        'method' => 'GET',
        'header' => [
            'Origin: http://localhost:8080',
            'Content-Type: application/json'
        ]
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === false) {
    echo "Error: Failed to fetch from API\n";
    echo "Last error: " . error_get_last()['message'] . "\n";
} else {
    echo "API Response:\n";
    echo $result . "\n";
}
?>