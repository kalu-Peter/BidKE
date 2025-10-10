<?php

/**
 * Web endpoint for auction finalization
 * Can be called via HTTP for testing or as a webhook
 * URL: /api/cron/finalize-auctions.php
 */

header('Content-Type: application/json');

// Allow access from localhost for testing
$allowed_origins = ['http://localhost:3000', 'http://localhost:8080'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

// Simple security: only allow GET requests and require a token for production use
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Optional: Add a simple token check for production security
$expectedToken = 'finalize-2025'; // Change this in production
$providedToken = $_GET['token'] ?? '';

// For development, allow without token. For production, uncomment the check below:
// if ($providedToken !== $expectedToken) {
//     http_response_code(401);
//     echo json_encode(['success' => false, 'error' => 'Invalid token']);
//     exit;
// }

try {
    // Include the enhanced auto-finalizer
    ob_start();
    include __DIR__ . '/../../tools/auto_finalize_auctions.php';
    $output = ob_get_clean();

    // If the included script outputs JSON, use it. Otherwise, provide success response.
    if (json_decode($output)) {
        echo $output;
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Finalization process completed',
            'timestamp' => date('Y-m-d H:i:s'),
            'output' => $output
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Finalization failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
