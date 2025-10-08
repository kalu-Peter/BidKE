<?php
// Test seller auctions API primary_image functionality

require_once 'config/connect.php';

echo "=== Testing Primary Image in Seller Auctions ===\n\n";

$db = Database::getInstance();
$pdo = $db->getConnection();

// Find an auction with images
$stmt = $pdo->prepare("
    SELECT a.id, a.title, a.seller_id, 
           COUNT(ai.id) as image_count
    FROM auctions a 
    LEFT JOIN auction_images ai ON a.id = ai.auction_id AND ai.is_active = TRUE
    GROUP BY a.id, a.title, a.seller_id
    HAVING COUNT(ai.id) > 0
    LIMIT 3
");
$stmt->execute();
$auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($auctions as $auction) {
    echo "Auction {$auction['id']}: {$auction['title']} (Seller: {$auction['seller_id']}) - {$auction['image_count']} images\n";

    // Test the image loading logic from seller-auctions.php
    $imageStmt = $pdo->prepare("
        SELECT image_url, is_primary, sort_order 
        FROM auction_images 
        WHERE auction_id = :auction_id AND is_active = TRUE 
        ORDER BY is_primary DESC, sort_order ASC
    ");
    $imageStmt->execute([':auction_id' => $auction['id']]);
    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    $primaryImage = null;
    $allImages = [];

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

        $allImages[] = $url;

        // Set primary image
        if (!empty($img['is_primary']) && $primaryImage === null) {
            $primaryImage = $url;
        }
    }

    // Fallback: if no primary set but we have images, use first one
    if (empty($primaryImage) && !empty($allImages)) {
        $primaryImage = $allImages[0];
    }

    echo "  Primary image: " . ($primaryImage ?: 'None') . "\n";
    echo "  All images: " . count($allImages) . " total\n\n";
}

if (empty($auctions)) {
    echo "No auctions with images found!\n";
}
