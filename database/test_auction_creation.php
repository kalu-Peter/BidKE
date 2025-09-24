<?php
/**
 * Test Auction Creation
 * Tests the auction creation endpoint with sample data
 */

// Include database connection
require_once '../api/config/connect.php';

// Test data for auction creation
$testData = [
    'itemType' => 'vehicle',
    'title' => 'Test Toyota Corolla',
    'description' => 'A well-maintained Toyota Corolla for auction',
    'startingPrice' => 500000,
    'reservePrice' => 600000,
    'auctionStartDate' => date('Y-m-d'),
    'auctionStartTime' => '10:00',
    'auctionEndDate' => date('Y-m-d', strtotime('+7 days')),
    'auctionEndTime' => '17:00',
    'vehicleMake' => 'Toyota',
    'vehicleModel' => 'Corolla',
    'vehicleYear' => 2018,
    'vehicleMileage' => 45000,
    'vehicleCondition' => 'good',
    'registrationNumber' => 'KCB 123A',
    'location' => 'Nairobi',
    'images' => [
        [
            'url' => 'https://example.com/image1.jpg',
            'alt_text' => 'Front view of Toyota Corolla'
        ]
    ]
];

echo "Testing auction creation...\n";
echo "Test data: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

// Change to api directory for correct relative paths
chdir('../api');

// Simulate POST request to create.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Set the JSON input
$jsonInput = json_encode($testData);

// Create a temporary file to simulate php://input
$tempFile = tempnam(sys_get_temp_dir(), 'auction_test');
file_put_contents($tempFile, $jsonInput);

// Redirect stdin to our temp file
$originalStdin = fopen('php://stdin', 'r');
$testStdin = fopen($tempFile, 'r');

// Include the create.php file (this will process our test data)
echo "Calling create.php endpoint...\n";
ob_start();
include 'auctions/create.php';
$output = ob_get_clean();

// Clean up
fclose($testStdin);
unlink($tempFile);

// Change back to original directory
chdir('../database');

echo "\nResponse from create.php:\n";
echo $output . "\n";

// Check if auction was created in database
try {
    $db = Database::getInstance();
    $connection = $db->getConnection();

    $stmt = $connection->query("SELECT COUNT(*) as count FROM auctions");
    $result = $stmt->fetch();
    echo "\nTotal auctions in database: " . $result['count'] . "\n";

    if ($result['count'] > 0) {
        $stmt = $connection->query("SELECT id, title, status, created_at FROM auctions ORDER BY created_at DESC LIMIT 1");
        $auction = $stmt->fetch();
        echo "Latest auction: " . json_encode($auction) . "\n";
    }

} catch (Exception $e) {
    echo "Error checking database: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n";
?>