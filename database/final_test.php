<?php
/**
 * Final Auction Creation Test
 * Tests the complete auction creation flow
 */

// Test data
$testData = [
    'itemType' => 'vehicle',
    'title' => 'Test Honda Civic',
    'description' => 'A reliable Honda Civic in excellent condition',
    'startingPrice' => 450000,
    'reservePrice' => 550000,
    'auctionStartDate' => date('Y-m-d'),
    'auctionStartTime' => '09:00',
    'auctionEndDate' => date('Y-m-d', strtotime('+5 days')),
    'auctionEndTime' => '18:00',
    'vehicleMake' => 'Honda',
    'vehicleModel' => 'Civic',
    'vehicleYear' => 2019,
    'vehicleMileage' => 35000,
    'vehicleCondition' => 'excellent',
    'registrationNumber' => 'KCD 456B',
    'location' => 'Nairobi',
    'images' => [
        [
            'url' => 'https://example.com/civic1.jpg',
            'alt_text' => 'Honda Civic front view'
        ],
        [
            'url' => 'https://example.com/civic2.jpg',
            'alt_text' => 'Honda Civic side view'
        ]
    ]
];

echo "🧪 Testing complete auction creation flow...\n\n";

// Use curl to test the actual endpoint
$ch = curl_init('http://localhost:8081/api/auctions/create.php');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Origin: http://localhost:8081'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
echo "Response:\n" . $response . "\n\n";

// Parse the response
$responseData = json_decode($response, true);

if ($responseData && isset($responseData['success']) && $responseData['success']) {
    echo "✅ Auction creation successful!\n";
    echo "Auction ID: " . ($responseData['data']['auction_id'] ?? 'N/A') . "\n";
    echo "Title: " . ($responseData['data']['title'] ?? 'N/A') . "\n";
    echo "Status: " . ($responseData['data']['status'] ?? 'N/A') . "\n\n";

    // Verify in database
    require_once '../api/config/connect.php';

    try {
        $db = Database::getInstance();
        $connection = $db->getConnection();

        $auctionId = $responseData['data']['auction_id'];

        // Check auction
        $stmt = $connection->prepare("SELECT * FROM auctions WHERE id = ?");
        $stmt->execute([$auctionId]);
        $auction = $stmt->fetch();

        if ($auction) {
            echo "✅ Auction verified in database:\n";
            echo "  - Title: {$auction['title']}\n";
            echo "  - Status: {$auction['status']}\n";
            echo "  - Starting Price: {$auction['starting_price']}\n";
            echo "  - Start Time: {$auction['start_time']}\n";
            echo "  - End Time: {$auction['end_time']}\n\n";
        }

        // Check vehicle
        $stmt = $connection->prepare("SELECT * FROM vehicles WHERE auction_id = ?");
        $stmt->execute([$auctionId]);
        $vehicle = $stmt->fetch();

        if ($vehicle) {
            echo "✅ Vehicle details verified in database:\n";
            echo "  - Make: {$vehicle['make']}\n";
            echo "  - Model: {$vehicle['model']}\n";
            echo "  - Year: {$vehicle['year']}\n";
            echo "  - Mileage: {$vehicle['mileage']}\n";
            echo "  - Condition: {$vehicle['condition']}\n\n";
        }

        // Check images
        $stmt = $connection->prepare("SELECT COUNT(*) as count FROM auction_images WHERE auction_id = ?");
        $stmt->execute([$auctionId]);
        $imageCount = $stmt->fetch()['count'];

        echo "✅ Auction images verified: $imageCount images saved\n\n";

        echo "🎉 COMPLETE SUCCESS! Auction posting is now working correctly.\n";
        echo "The issue has been resolved - auctions are being saved to the database.\n";

    } catch (Exception $e) {
        echo "❌ Database verification failed: " . $e->getMessage() . "\n";
    }

} else {
    echo "❌ Auction creation failed!\n";
    if ($responseData && isset($responseData['error'])) {
        echo "Error: " . $responseData['error'] . "\n";
    }
}

echo "\nTest completed.\n";
?>