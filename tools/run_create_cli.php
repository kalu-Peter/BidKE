<?php
// Helper to run auctions/create.php from CLI with simulated authenticated user
$payload = [
    'itemType' => 'vehicle',
    'title' => 'CLI Motorbike Test',
    'description' => 'Created via CLI helper',
    'startingPrice' => 100000,
    'auctionStartDate' => date('Y-m-d', strtotime('+1 day')),
    'auctionStartTime' => '10:00',
    'auctionEndDate' => date('Y-m-d', strtotime('+7 days')),
    'auctionEndTime' => '18:00',
    'vehicleType' => 'motorbike',
    'vehicleMake' => 'Honda',
    'vehicleModel' => 'CBR 600',
    'vehicleYear' => '2020',
    'vehicleMileage' => '5000',
    'vehicleCondition' => 'excellent',
    'status' => 'draft'
];

// Base64-encode payload and set environment variable expected by create.php
$encoded = base64_encode(json_encode($payload));
putenv('__CLI_PAYLOAD=' . $encoded);

// Simulate a logged-in user
$user = ['user_id' => 1, 'username' => 'cli_user'];
putenv('__CLI_USER=' . base64_encode(json_encode($user)));

// Ensure $_SERVER variables exist so endpoints that check them don't warn
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'POST';
}
if (!isset($_SERVER['HTTP_ORIGIN'])) {
    $_SERVER['HTTP_ORIGIN'] = 'http://localhost:8080';
}

// Change working directory to api/auctions so relative includes inside create.php resolve correctly
chdir(__DIR__ . '/../api/auctions');

// Require the script directly so it runs in-process
require_once __DIR__ . '/../api/auctions/create.php';
