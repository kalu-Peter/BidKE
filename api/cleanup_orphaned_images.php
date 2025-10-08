<?php
// Clean up orphaned image records (database entries without corresponding files)

require_once 'config/connect.php';

// Get database connection
$db = Database::getInstance();
$pdo = $db->getConnection();

echo "=== Cleaning up orphaned image records ===\n\n";

// Get all image records
$stmt = $pdo->prepare("SELECT id, auction_id, image_url, file_name FROM auction_images WHERE is_active = TRUE ORDER BY auction_id, uploaded_at");
$stmt->execute();
$images = $stmt->fetchAll();

$orphanedCount = 0;
$totalCount = count($images);

echo "Checking $totalCount image records...\n\n";

foreach ($images as $image) {
    $filePath = __DIR__ . $image['image_url']; // image_url starts with /uploads/
    $fileExists = file_exists($filePath);

    if (!$fileExists) {
        echo "ORPHANED: Auction {$image['auction_id']} - ID {$image['id']} - {$image['image_url']} (file not found)\n";
        $orphanedCount++;

        // Remove the orphaned record
        $deleteStmt = $pdo->prepare("UPDATE auction_images SET is_active = FALSE WHERE id = :id");
        $deleteStmt->execute([':id' => $image['id']]);
        echo "  -> Marked as inactive\n";
    } else {
        echo "OK: Auction {$image['auction_id']} - {$image['image_url']}\n";
    }
}

echo "\n=== Summary ===\n";
echo "Total records checked: $totalCount\n";
echo "Orphaned records found: $orphanedCount\n";
echo "Cleanup complete!\n";
