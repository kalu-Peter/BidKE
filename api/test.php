<?php
/**
 * API Test Endpoint
 * BidKE Auction Platform
 */

require_once 'config.php';

// Get database instance
$db = Database::getInstance();

// Test database connection
$connectionTest = $db->testConnection();

// API info
$apiInfo = [
    'api_name' => 'BidKE Auction API',
    'version' => '1.0.0',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'database' => $connectionTest
];

// Send response
sendSuccess($apiInfo, 'API is working correctly');

?>
