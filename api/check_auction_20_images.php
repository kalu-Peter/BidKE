<?php
require_once 'config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Check what images exist for auction 20
    echo "Images for auction 20:\n";
    $stmt = $db->prepare("SELECT id, image_url, is_primary, sort_order, uploaded_at FROM auction_images WHERE auction_id = 20 ORDER BY sort_order ASC");
    $stmt->execute();
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($images)) {
        echo "  No images found in auction_images table.\n";

        // Check auction_files too
        echo "\nChecking auction_files for auction 20:\n";
        $stmt = $db->prepare("SELECT id, file_path, file_type, original_name FROM auction_files WHERE auction_id = 20 ORDER BY id ASC");
        $stmt->execute();
        $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($files)) {
            echo "  No files found in auction_files table either.\n";
        } else {
            foreach ($files as $file) {
                echo "  ID: {$file['id']}, Path: {$file['file_path']}, Type: {$file['file_type']}, Name: {$file['original_name']}\n";
            }
        }
    } else {
        foreach ($images as $image) {
            echo "  ID: {$image['id']}, URL: {$image['image_url']}, Primary: " . ($image['is_primary'] ? 'YES' : 'NO') . ", Sort: {$image['sort_order']}, Uploaded: {$image['uploaded_at']}\n";
        }
    }

    // Check what the auction-details API would return
    echo "\nTesting auction-details API response for auction 20:\n";
    $response = file_get_contents("http://localhost:8000/auction-details.php?id=20");
    $data = json_decode($response, true);

    if ($data && $data['success']) {
        $images = $data['data']['images'] ?? [];
        echo "  API returned " . count($images) . " images:\n";
        foreach ($images as $i => $img) {
            echo "    $i: $img\n";
        }
    } else {
        echo "  API error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
