<?php
// Simulate POST to auctions/create.php with minimal data and fake Auth::requireAuth

// Provide origin header
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:8080';
$_SERVER['REQUEST_METHOD'] = 'POST';

// Minimal payload
$payload = [
    'itemType' => 'electronic',
    'title' => 'CLI Test Item',
    'description' => 'Created via CLI test runner',
    'startingPrice' => 5000,
    'auctionStartDate' => date('Y-m-d', strtotime('+1 day')),
    'auctionStartTime' => '10:00',
    'auctionEndDate' => date('Y-m-d', strtotime('+2 days')),
    'auctionEndTime' => '10:00',
    'electronicsBrand' => 'CLI Brand',
    'electronicsModel' => 'CLI-1',
    'electronicsYear' => '2024',
    'electronicsCondition' => 'good',
    'status' => 'draft'
];

// Set environment variable for create.php to read as debug payload and provide a CLI user id
putenv('__CLI_PAYLOAD=' . base64_encode(json_encode($payload)));
putenv('__CLI_USER=' . base64_encode(json_encode(['user_id' => 1])));

// Change working directory to api/auctions so create.php's relative requires resolve
chdir(__DIR__ . '/../../api/auctions');

// Include the endpoint
require __DIR__ . '/../../api/auctions/create.php';
