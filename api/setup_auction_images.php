<?php
// Script to create auction_images table if it doesn't exist

require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Check if auction_images table exists
    $stmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auction_images'");
    $stmt->execute();
    $exists = $stmt->fetchColumn();

    if (!$exists) {
        echo "Creating auction_images table...\n";

        // Create the auction_images table
        $createTableSQL = "
        CREATE TABLE auction_images (
            id SERIAL PRIMARY KEY,
            auction_id INTEGER NOT NULL,
            
            -- Image details
            image_url VARCHAR(500) NOT NULL,
            alt_text VARCHAR(255),
            caption TEXT,
            
            -- Image metadata
            is_primary BOOLEAN DEFAULT FALSE,
            sort_order INTEGER DEFAULT 0,
            image_type VARCHAR(20) DEFAULT 'photo' CHECK (image_type IN ('photo', 'diagram', 'document')),
            
            -- File information
            file_name VARCHAR(255),
            file_size INTEGER,
            mime_type VARCHAR(100),
            
            -- Upload tracking
            uploaded_by INTEGER NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Status
            is_active BOOLEAN DEFAULT TRUE
        );
        
        -- Create indexes for auction images
        CREATE INDEX idx_auction_images_auction_id ON auction_images(auction_id);
        CREATE INDEX idx_auction_images_primary ON auction_images(auction_id, is_primary) WHERE is_primary = TRUE;
        CREATE INDEX idx_auction_images_sort_order ON auction_images(auction_id, sort_order);
        ";

        $db->exec($createTableSQL);
        echo "auction_images table created successfully!\n";

        // Migrate existing images from auction_files if they exist
        $filesStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auction_files'");
        $filesStmt->execute();
        $filesExists = $filesStmt->fetchColumn();

        if ($filesExists) {
            echo "Migrating images from auction_files to auction_images...\n";

            $migrateSQL = "
            INSERT INTO auction_images (auction_id, image_url, alt_text, is_primary, sort_order, file_name, file_size, mime_type, uploaded_by)
            SELECT 
                auction_id,
                file_path,
                original_name,
                FALSE,
                id,
                file_name,
                file_size,
                mime_type,
                1 -- default uploaded_by to user 1
            FROM auction_files 
            WHERE file_type = 'image'
            ";

            $result = $db->exec($migrateSQL);
            echo "Migrated $result images from auction_files to auction_images\n";

            // Set primary images (first image for each auction)
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
        }
    } else {
        echo "auction_images table already exists.\n";
    }

    // Show table info
    $countStmt = $db->prepare("SELECT COUNT(*) FROM auction_images");
    $countStmt->execute();
    $count = $countStmt->fetchColumn();
    echo "Total images in auction_images table: $count\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
