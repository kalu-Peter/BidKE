<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "=== AUCTION_IMAGES TABLE ===\n";
    $stmt = $db->query("SELECT auction_id, image_url, file_name FROM auction_images ORDER BY auction_id, id");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Auction {$row['auction_id']}: {$row['image_url']} (file: {$row['file_name']})\n";
    }

    echo "\n=== ACTUAL FILES ON DISK ===\n";
    $uploadsDir = __DIR__ . '/../uploads';
    $files = scandir($uploadsDir);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) == 'jpg') {
            echo "File: $file\n";
        }
    }

    echo "\n=== AUCTION_FILES TABLE (for comparison) ===\n";
    $stmt = $db->query("SELECT auction_id, file_path, file_name FROM auction_files WHERE file_type = 'image' ORDER BY auction_id, id");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Auction {$row['auction_id']}: {$row['file_path']} (file: {$row['file_name']})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
