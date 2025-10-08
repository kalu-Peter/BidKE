<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Check auction_files
    $stmt = $db->query("SELECT COUNT(*) FROM auction_files WHERE file_type = 'image'");
    $filesCount = $stmt->fetchColumn();
    echo "Images in auction_files: $filesCount\n";

    // Check auction_images  
    $stmt = $db->query("SELECT COUNT(*) FROM auction_images");
    $imagesCount = $stmt->fetchColumn();
    echo "Images in auction_images: $imagesCount\n";

    if ($filesCount > 0 && $imagesCount == 0) {
        echo "\nMigrating $filesCount images from auction_files to auction_images...\n";

        // Migrate images
        $migrateSQL = "
        INSERT INTO auction_images (auction_id, image_url, alt_text, is_primary, sort_order, file_name, file_size, mime_type, uploaded_by)
        SELECT 
            auction_id,
            '/' || file_path,
            original_name,
            FALSE,
            id,
            file_name,
            file_size,
            mime_type,
            1
        FROM auction_files 
        WHERE file_type = 'image'
        ";

        $result = $db->exec($migrateSQL);
        echo "Migrated $result images\n";

        // Set primary images
        $setPrimarySQL = "
        UPDATE auction_images 
        SET is_primary = TRUE 
        WHERE id IN (
            SELECT DISTINCT ON (auction_id) id 
            FROM auction_images 
            ORDER BY auction_id, sort_order ASC
        )
        ";

        $db->exec($setPrimarySQL);
        echo "Set primary images for each auction\n";

        // Show sample of migrated data
        echo "\nSample migrated images:\n";
        $stmt = $db->query("SELECT auction_id, image_url, is_primary FROM auction_images LIMIT 5");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "  Auction {$row['auction_id']}: {$row['image_url']} " . ($row['is_primary'] ? '(PRIMARY)' : '') . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
