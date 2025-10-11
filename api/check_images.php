<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "Checking auction_images table for auction ID 16:\n";
    $stmt = $db->prepare('SELECT id, image_url, is_primary, sort_order, is_active FROM auction_images WHERE auction_id = 16 ORDER BY sort_order ASC, is_primary DESC');
    $stmt->execute();
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($images)) {
        echo "No images found in auction_images table for auction ID 16\n";

        // Check if the table exists
        $tableStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_name = 'auction_images'");
        $tableStmt->execute();
        $tableExists = $tableStmt->fetch();

        if ($tableExists) {
            echo "auction_images table exists\n";

            // Check how many total images are in the table
            $countStmt = $db->prepare('SELECT COUNT(*) as total FROM auction_images');
            $countStmt->execute();
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);
            echo "Total images in auction_images table: " . $count['total'] . "\n";

            // Check what auction IDs have images
            $auctionStmt = $db->prepare('SELECT DISTINCT auction_id FROM auction_images LIMIT 10');
            $auctionStmt->execute();
            $auctionIds = $auctionStmt->fetchAll(PDO::FETCH_COLUMN);
            echo "Auction IDs with images: " . implode(', ', $auctionIds) . "\n";
        } else {
            echo "auction_images table does not exist\n";
        }

        // Check auction_files table as fallback
        echo "\nChecking auction_files table for auction ID 16:\n";
        $filesStmt = $db->prepare('SELECT id, file_path, file_type FROM auction_files WHERE auction_id = 16');
        $filesStmt->execute();
        $files = $filesStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($files)) {
            echo "Found files in auction_files table:\n";
            print_r($files);
        } else {
            echo "No files found in auction_files table either\n";
        }
    } else {
        echo "Found images:\n";
        print_r($images);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
