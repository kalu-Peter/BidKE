<?php
// Simple debug script to check the most recent auction 20 upload attempt

require_once 'config/connect.php';

// Get database connection
$db = Database::getInstance();
$pdo = $db->getConnection();

echo "=== DEBUG: Recent auction 20 image uploads ===\n\n";

// Check if there are any error logs from PHP
$errorLogPath = ini_get('error_log');
echo "PHP Error log path: " . ($errorLogPath ?: 'default system log') . "\n\n";

// Check recent auction_images entries for auction 20
echo "Recent auction_images entries for auction 20:\n";
$stmt = $pdo->prepare("SELECT id, image_url, file_name, is_primary, sort_order, uploaded_at FROM auction_images WHERE auction_id = 20 ORDER BY uploaded_at DESC LIMIT 10");
$stmt->execute();
$images = $stmt->fetchAll();

foreach ($images as $image) {
    $primary = $image['is_primary'] ? '(PRIMARY)' : '';
    echo "  ID {$image['id']}: {$image['image_url']} {$primary} [sort: {$image['sort_order']}] - {$image['uploaded_at']}\n";
}

if (empty($images)) {
    echo "  No images found for auction 20\n";
}

echo "\n=== Check if new files were uploaded recently ===\n";
$uploadDir = __DIR__ . '/uploads/';
$files = glob($uploadDir . '*.jpg');

// Sort by modification time (most recent first)
usort($files, function ($a, $b) {
    return filemtime($b) - filemtime($a);
});

echo "Most recent 5 image files:\n";
for ($i = 0; $i < min(5, count($files)); $i++) {
    $file = $files[$i];
    $filename = basename($file);
    $time = date('Y-m-d H:i:s', filemtime($file));
    echo "  $filename - $time\n";
}

// Check if PHP server is logging errors
echo "\n=== Testing error logging ===\n";
error_log("DEBUG: Test error log entry from debug script");
echo "Test error log entry written (check error logs)\n";
