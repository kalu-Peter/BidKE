<?php
header('Content-Type: application/json');

// CORS: allow common local dev origins
$allowed_origins = ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check DEV_MODE via environment or config constant
$devModeEnv = getenv('DEV_MODE');
$devModeConst = defined('DEV_MODE') ? (bool)constant('DEV_MODE') : false;
$devMode = ($devModeEnv === '1') || $devModeConst;

echo json_encode(['success' => true, 'dev_mode' => $devMode]);
exit();
