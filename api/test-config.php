<?php
// Test endpoint to verify environment configuration
require_once __DIR__ . '/config/connect.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $testResult = $db->testConnection();

    $response = [
        'success' => true,
        'message' => 'Environment configuration test',
        'environment' => [
            'db_host' => DB_HOST,
            'db_port' => DB_PORT,
            'db_name' => DB_NAME,
            'db_user' => DB_USER,
            'ssl_mode' => DB_SSLMODE,
            'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
            'http_host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
            'is_production' => isset($isProduction) ? $isProduction : 'Unknown'
        ],
        'database' => $testResult,
        'cors' => [
            'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin header',
            'headers' => getallheaders()
        ],
        'timestamp' => date('Y-m-d H:i:s T')
    ];

    sendResponse($response);
} catch (Exception $e) {
    sendError('Configuration test failed: ' . $e->getMessage(), 500);
}
