<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Fix double URLs
    $stmt = $db->prepare("UPDATE auction_images SET image_url = REPLACE(image_url, '/http://localhost:8000', '') WHERE image_url LIKE '/http://localhost:8000%'");
    $result = $stmt->execute();
    echo "Fixed image URLs with double paths\n";

    // Show sample of fixed data
    echo "Sample fixed images:\n";
    $stmt = $db->query("SELECT auction_id, image_url, is_primary FROM auction_images LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  Auction {$row['auction_id']}: {$row['image_url']} " . ($row['is_primary'] ? '(PRIMARY)' : '') . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
