<?php
require_once 'config/connect.php';

// Get database connection
$db = Database::getInstance();
$pdo = $db->getConnection();

echo "Fixing auction 20 images with correct existing file...\n\n";

try {
    // First check what files actually exist with the 68e prefix
    echo "Existing files with 68e prefix:\n";
    $uploadDir = __DIR__ . '/uploads/';
    $files = glob($uploadDir . '68e*.jpg');
    foreach ($files as $file) {
        $filename = basename($file);
        $timestamp = filemtime($file);
        echo "  $filename (timestamp: $timestamp)\n";
    }
    echo "\n";

    // Check current auction 20 records
    echo "Current auction 20 records:\n";
    $stmt = $pdo->prepare("SELECT id, image_url, file_name, is_primary, sort_order FROM auction_images WHERE auction_id = 20 ORDER BY sort_order");
    $stmt->execute();
    $currentRecords = $stmt->fetchAll();

    foreach ($currentRecords as $record) {
        $primary = $record['is_primary'] ? '(PRIMARY)' : '';
        echo "  ID {$record['id']}: {$record['image_url']} {$primary} [sort: {$record['sort_order']}]\n";
    }
    echo "\n";

    // Start transaction
    $pdo->beginTransaction();

    // Clear existing records for auction 20
    $stmt = $pdo->prepare("DELETE FROM auction_images WHERE auction_id = 20");
    $stmt->execute();
    echo "Cleared old records for auction 20\n";

    // Use the actual existing file
    $actualFile = '68e635cb68a51_1759917515.jpg';
    $imageUrl = "/uploads/$actualFile";

    // Insert the correct record
    $stmt = $pdo->prepare("
        INSERT INTO auction_images (auction_id, image_url, is_primary, sort_order, file_name, alt_text, uploaded_by, uploaded_at) 
        VALUES (20, :image_url, :is_primary, :sort_order, :file_name, :alt_text, :uploaded_by, NOW())
    ");

    $stmt->execute([
        ':image_url' => $imageUrl,
        ':is_primary' => 'TRUE',
        ':sort_order' => 1,
        ':file_name' => $actualFile,
        ':alt_text' => 'Auction 20 Image',
        ':uploaded_by' => 1  // Default user ID
    ]);

    echo "Added: $imageUrl (PRIMARY)\n";

    // Commit transaction
    $pdo->commit();

    echo "\nFixed auction 20 images successfully!\n\n";

    // Show new records
    echo "New auction 20 records:\n";
    $stmt = $pdo->prepare("SELECT image_url, is_primary, sort_order FROM auction_images WHERE auction_id = 20 ORDER BY sort_order");
    $stmt->execute();
    $newRecords = $stmt->fetchAll();

    foreach ($newRecords as $record) {
        $primary = $record['is_primary'] ? '(PRIMARY)' : '';
        echo "  {$record['image_url']} {$primary} [sort: {$record['sort_order']}]\n";
    }
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
