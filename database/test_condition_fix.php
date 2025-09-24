<?php
/**
 * Test Auction Creation with Updated Schema
 */

// Include database connection
require_once '../api/config/connect.php';

echo "🧪 Testing auction creation with updated condition constraints...\n\n";

try {
    $db = Database::getInstance();
    $connection = $db->getConnection();

    // Start transaction
    $connection->beginTransaction();

    // Test data that was failing before
    $testData = [
        'itemType' => 'vehicle',
        'title' => 'BMW S1000RR Motorcycle',
        'description' => 'High-performance motorcycle in very good condition',
        'startingPrice' => 1500000,
        'reservePrice' => 1800000,
        'auctionStartDate' => date('Y-m-d'),
        'auctionStartTime' => '10:00',
        'auctionEndDate' => date('Y-m-d', strtotime('+7 days')),
        'auctionEndTime' => '17:00',
        'vehicleMake' => 'BMW',
        'vehicleModel' => 'S1000RR',
        'vehicleYear' => 2020,
        'vehicleMileage' => 10000,
        'vehicleCondition' => 'very-good', // This was failing before
        'registrationNumber' => 'KCB ' . rand(100, 999) . 'Z', // Unique registration number
        'location' => 'Nairobi'
    ];

    echo "Test data with 'very-good' condition:\n";
    echo "- Make: {$testData['vehicleMake']}\n";
    echo "- Model: {$testData['vehicleModel']}\n";
    echo "- Condition: {$testData['vehicleCondition']}\n\n";

    // Get category ID
    $stmt = $connection->prepare("SELECT id FROM categories WHERE slug = ? AND is_active = true LIMIT 1");
    $stmt->execute(['motorcycles']);
    $category = $stmt->fetch();

    if (!$category) {
        throw new Exception('Motorcycles category not found');
    }
    $categoryId = $category['id'];

    // Insert auction
    $stmt = $connection->prepare("
        INSERT INTO auctions (seller_id, category_id, title, description, starting_price, reserve_price, bid_increment, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    ");
    $stmt->execute([
        1, // dummy seller_id
        $categoryId,
        $testData['title'],
        $testData['description'],
        $testData['startingPrice'],
        $testData['reservePrice'],
        1000.00,
        $testData['auctionStartDate'] . ' ' . $testData['auctionStartTime'],
        $testData['auctionEndDate'] . ' ' . $testData['auctionEndTime'],
        'draft'
    ]);

    $auctionResult = $stmt->fetch();
    $auctionId = $auctionResult['id'];

    // Insert vehicle with the problematic condition
    $stmt = $connection->prepare("
        INSERT INTO vehicles (auction_id, vehicle_type, make, model, year, mileage, condition, registration_number, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $auctionId,
        'motorcycle',
        $testData['vehicleMake'],
        $testData['vehicleModel'],
        $testData['vehicleYear'],
        $testData['vehicleMileage'],
        $testData['vehicleCondition'], // This should now work!
        $testData['registrationNumber'],
        $testData['location']
    ]);

    // Commit transaction
    $connection->commit();

    echo "✅ SUCCESS! Auction created successfully with 'very-good' condition\n\n";

    // Verify the data
    $stmt = $connection->prepare("
        SELECT a.title, v.make, v.model, v.condition
        FROM auctions a
        JOIN vehicles v ON a.id = v.auction_id
        WHERE a.id = ?
    ");
    $stmt->execute([$auctionId]);
    $result = $stmt->fetch();

    echo "Verified auction data:\n";
    echo "- Title: {$result['title']}\n";
    echo "- Vehicle: {$result['make']} {$result['model']}\n";
    echo "- Condition: {$result['condition']}\n\n";

    echo "🎉 Condition constraint fix verified!\n";
    echo "Auction creation should now work for all condition values.\n";

} catch (Exception $e) {
    // Rollback on error
    if (isset($connection) && $connection->inTransaction()) {
        $connection->rollback();
    }

    echo "❌ Test failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>