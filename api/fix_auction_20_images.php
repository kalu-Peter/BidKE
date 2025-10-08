<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "Fixing auction 20 images...\n";

    // First, let's see what we have
    echo "\nCurrent auction 20 records:\n";
    $stmt = $db->prepare("SELECT id, image_url, file_name FROM auction_images WHERE auction_id = 20");
    $stmt->execute();
    $oldRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($oldRecords as $record) {
        echo "ID {$record['id']}: {$record['image_url']} (file: {$record['file_name']})\n";
    }

    // Get the actual files on disk for auction 20 (the newest 3 files)
    $uploadsDir = __DIR__ . '/../uploads';
    $files = [];
    $allFiles = scandir($uploadsDir);
    foreach ($allFiles as $file) {
        if ($file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) == 'jpg') {
            $fullPath = $uploadsDir . '/' . $file;
            $files[$file] = filemtime($fullPath);
        }
    }

    // Sort by modification time (newest first)
    arsort($files);
    $recentFiles = array_slice(array_keys($files), 0, 3);

    echo "\nMost recent files on disk:\n";
    foreach ($recentFiles as $file) {
        echo "  $file\n";
    }

    // Clear existing records for auction 20
    $db->prepare("DELETE FROM auction_images WHERE auction_id = 20")->execute();
    echo "\nCleared old records for auction 20\n";

    // Add new records for the actual files
    foreach ($recentFiles as $i => $fileName) {
        $isPrimary = ($i === 0); // First image is primary
        $sortOrder = $i + 1;
        $imageUrl = "/uploads/" . $fileName;

        $stmt = $db->prepare("
            INSERT INTO auction_images (auction_id, image_url, is_primary, sort_order, file_name, uploaded_by, alt_text) 
            VALUES (20, :image_url, :is_primary, :sort_order, :file_name, 1, :alt_text)
        ");

        $stmt->execute([
            ':image_url' => $imageUrl,
            ':is_primary' => $isPrimary ? 'TRUE' : 'FALSE',
            ':sort_order' => $sortOrder,
            ':file_name' => $fileName,
            ':alt_text' => 'Auction 20 Image ' . ($i + 1)
        ]);

        echo "Added: $imageUrl " . ($isPrimary ? "(PRIMARY)" : "") . "\n";
    }

    echo "\nFixed auction 20 images successfully!\n";

    // Verify the fix
    echo "\nNew auction 20 records:\n";
    $stmt = $db->prepare("SELECT image_url, is_primary, sort_order FROM auction_images WHERE auction_id = 20 ORDER BY sort_order");
    $stmt->execute();
    $newRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($newRecords as $record) {
        echo "  {$record['image_url']} " . ($record['is_primary'] ? "(PRIMARY)" : "") . " [sort: {$record['sort_order']}]\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
