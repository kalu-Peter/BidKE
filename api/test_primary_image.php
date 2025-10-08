<?php
// Test seller auctions API to check primary image handling

require_once 'config/connect.php';
require_once 'models/Auth.php';

// Simulate authenticated request (using a test token or session)
echo "=== Testing Seller Auctions API for Primary Image ===\n\n";

// Direct database query to simulate what the API does
$db = Database::getInstance();
$pdo = $db->getConnection();

// Get auction 20 data like the seller-auctions API
$query = "
    SELECT a.id, a.title, a.status,
           (
               SELECT ai.image_url
               FROM auction_images ai
               WHERE ai.auction_id = a.id AND ai.is_active = TRUE
               ORDER BY ai.is_primary DESC, ai.sort_order ASC
               LIMIT 1
           ) as image_url
    FROM auctions a
    WHERE a.id = 20
";

$stmt = $pdo->prepare($query);
$stmt->execute();
$auction = $stmt->fetch(PDO::FETCH_ASSOC);

if ($auction) {
    echo "Primary image query result:\n";
    echo "  Auction: {$auction['title']}\n";
    echo "  Primary image URL: {$auction['image_url']}\n";

    // Now get all images for this auction
    $imageStmt = $pdo->prepare("
        SELECT image_url, is_primary, sort_order 
        FROM auction_images 
        WHERE auction_id = :auction_id AND is_active = TRUE 
        ORDER BY is_primary DESC, sort_order ASC
    ");
    $imageStmt->execute([':auction_id' => $auction['id']]);
    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\n  All images:\n";
    foreach ($images as $img) {
        $primary = $img['is_primary'] ? '(PRIMARY)' : '';
        echo "    {$img['image_url']} {$primary} [sort: {$img['sort_order']}]\n";
    }

    // Simulate the full image processing
    $processedImages = [];
    $primaryImage = null;

    foreach ($images as $img) {
        $path = $img['image_url'] ?? '';
        if (!$path) continue;

        // Normalize URL
        if (preg_match('#^https?://#i', $path)) {
            $url = $path;
        } elseif (strpos($path, '/') === 0) {
            $url = 'http://localhost:8000' . $path;
        } else {
            $url = 'http://localhost:8000/' . $path;
        }

        $processedImages[] = $url;

        // Set primary image
        if (!empty($img['is_primary']) && $primaryImage === null) {
            $primaryImage = $url;
        }
    }

    echo "\n  Processed for API response:\n";
    echo "    Primary image: " . ($primaryImage ?: 'None') . "\n";
    echo "    All images: " . implode(', ', $processedImages) . "\n";
} else {
    echo "Auction 20 not found!\n";
}
