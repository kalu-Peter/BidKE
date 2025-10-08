<?php
// Test upload path resolution

echo "Current directory: " . __DIR__ . "\n";
echo "Upload path calculation: " . __DIR__ . '/../uploads/' . "\n";

// Check if directory exists
$uploadDir = __DIR__ . '/../uploads/';
echo "Upload directory exists: " . (is_dir($uploadDir) ? 'YES' : 'NO') . "\n";
echo "Upload directory is writable: " . (is_writable($uploadDir) ? 'YES' : 'NO') . "\n";

// Resolve the full path
$realPath = realpath($uploadDir);
echo "Real path: " . ($realPath ?: 'NOT FOUND') . "\n";

// List existing files
echo "\nExisting files in upload directory:\n";
$files = glob($uploadDir . '*.jpg');
foreach ($files as $file) {
    echo "  " . basename($file) . "\n";
}
