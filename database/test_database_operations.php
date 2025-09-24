<?php
/**
 * Simple Database Test
 * Tests basic database operations for auction creation
 */

// Include database connection
require_once '../api/config/connect.php';

echo "Testing database operations for auction creation...\n\n";

try {
    $db = Database::getInstance();
    $connection = $db->getConnection();

    // Start transaction
    $connection->beginTransaction();
    echo "✓ Started transaction\n";

    // Test 1: Check categories table
    $stmt = $connection->query("SELECT id, name, slug FROM categories WHERE is_active = true");
    $categories = $stmt->fetchAll();
    echo "✓ Found " . count($categories) . " active categories\n";
    foreach ($categories as $cat) {
        echo "  - {$cat['name']} (slug: {$cat['slug']})\n";
    }

    // Test 2: Insert test auction
    $auction_query = "INSERT INTO auctions (seller_id, category_id, title, description, starting_price, reserve_price, bid_increment, start_time, end_time, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id";

    $auction_stmt = $connection->prepare($auction_query);
    $auction_stmt->execute([
        1, // dummy seller_id
        1, // category_id (Cars)
        'Test Toyota Corolla',
        'A well-maintained Toyota Corolla for auction',
        500000.00,
        600000.00,
        1000.00,
        '2025-09-24 10:00:00',
        '2025-10-01 17:00:00',
        'draft'
    ]);

    $auction_result = $auction_stmt->fetch();
    $auction_id = $auction_result['id'];
    echo "✓ Created auction with ID: $auction_id\n";

    // Test 3: Insert vehicle details
    $vehicle_query = "INSERT INTO vehicles (auction_id, vehicle_type, make, model, year, mileage, condition, registration_number, location)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $vehicle_stmt = $connection->prepare($vehicle_query);
    $vehicle_stmt->execute([
        $auction_id,
        'car',
        'Toyota',
        'Corolla',
        2018,
        45000,
        'good',
        'KCB 123A',
        'Nairobi'
    ]);
    echo "✓ Created vehicle record\n";

    // Test 4: Insert auction image
    $image_query = "INSERT INTO auction_images (auction_id, image_url, alt_text, is_primary, sort_order, uploaded_by)
                    VALUES (?, ?, ?, ?, ?, ?)";

    $image_stmt = $connection->prepare($image_query);
    $image_stmt->execute([
        $auction_id,
        'https://example.com/image1.jpg',
        'Front view of Toyota Corolla',
        true,
        0,
        1  // dummy user ID
    ]);
    echo "✓ Created auction image record\n";

    // Commit transaction
    $connection->commit();
    echo "✓ Committed transaction\n\n";

    // Verify the data was inserted
    echo "Verifying data was saved:\n";

    $stmt = $connection->query("SELECT COUNT(*) as count FROM auctions");
    $result = $stmt->fetch();
    echo "✓ Total auctions in database: " . $result['count'] . "\n";

    $stmt = $connection->query("SELECT COUNT(*) as count FROM vehicles");
    $result = $stmt->fetch();
    echo "✓ Total vehicles in database: " . $result['count'] . "\n";

    $stmt = $connection->query("SELECT COUNT(*) as count FROM auction_images");
    $result = $stmt->fetch();
    echo "✓ Total auction images in database: " . $result['count'] . "\n";

    // Get the created auction details
    $stmt = $connection->prepare("
        SELECT a.*, v.make, v.model, v.year, ai.image_url
        FROM auctions a
        LEFT JOIN vehicles v ON a.id = v.auction_id
        LEFT JOIN auction_images ai ON a.id = ai.auction_id AND ai.is_primary = true
        WHERE a.id = ?
    ");
    $stmt->execute([$auction_id]);
    $auction = $stmt->fetch();

    echo "\nCreated auction details:\n";
    echo json_encode($auction, JSON_PRETTY_PRINT) . "\n";

    echo "\n🎉 Database operations test completed successfully!\n";
    echo "The auction tables are working correctly and auctions can be saved to the database.\n";

} catch (Exception $e) {
    // Rollback on error
    if (isset($connection) && $connection->inTransaction()) {
        $connection->rollback();
        echo "✓ Rolled back transaction due to error\n";
    }

    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>