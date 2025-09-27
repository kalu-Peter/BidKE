<?php
// Temporary debug runner to execute api/auctions.php with GET params in CLI
$_SERVER['REQUEST_METHOD'] = 'GET';
// Provide minimal origin header similar to browser
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:8080';

// Provide query parameters expected by endpoint
$_GET['page'] = 1;
$_GET['limit'] = 12;
$_GET['status'] = 'live';
$_GET['search'] = '';

// Ensure errors are visible in CLI for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../../api/auctions.php';
