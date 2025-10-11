<?php

/**
 * Test script to verify vehicle type functionality
 */

// Test data for creating a vehicle auction with specific vehicle type
$testData = [
    'itemType' => 'vehicle',
    'title' => 'Test Motorbike - Honda CBR 600',
    'description' => 'Test motorbike auction with vehicle type',
    'startingPrice' => 150000,
    'hasReservePrice' => false,
    'auctionStartDate' => date('Y-m-d', strtotime('+1 day')),
    'auctionStartTime' => '10:00',
    'auctionEndDate' => date('Y-m-d', strtotime('+7 days')),
    'auctionEndTime' => '18:00',
    'vehicleType' => 'motorbike',  // This is the new field we're testing
    'vehicleMake' => 'Honda',
    'vehicleModel' => 'CBR 600',
    'vehicleYear' => '2020',
    'vehicleMileage' => '15000',
    'vehicleCondition' => 'excellent',
    'status' => 'draft'
];

echo "Testing vehicle type functionality...\n";
echo "Vehicle Type: " . $testData['vehicleType'] . "\n";
echo "Vehicle: " . $testData['vehicleMake'] . " " . $testData['vehicleModel'] . "\n\n";

// Call auction creation endpoint
$url = 'http://localhost:8000/auctions/create.php';
$postData = json_encode($testData);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($postData),
    // You would need a valid session token here in real testing
    'Authorization: Bearer test-token-here'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Auction creation response (HTTP $httpCode):\n";
echo $response . "\n\n";

if ($httpCode === 200) {
    $responseData = json_decode($response, true);
    if ($responseData && $responseData['success']) {
        $auctionId = $responseData['data']['auction_id'];
        echo "✅ Auction created successfully! ID: $auctionId\n";

        // Note: In a full test, you'd query the vehicles table to verify the vehicle_type was saved correctly
        echo "Vehicle type should be saved as: " . $testData['vehicleType'] . "\n";
    } else {
        echo "❌ Auction creation failed\n";
        if (isset($responseData['error'])) {
            echo "Error: " . $responseData['error'] . "\n";
        }
    }
} else {
    echo "❌ HTTP Error: $httpCode\n";
    echo "Response: $response\n";
}

echo "\nTest completed.\n";
echo "\nNote: This test will likely fail with authentication errors since no valid session token is provided.\n";
echo "The important part is that the frontend now sends 'vehicleType' and the backend accepts it.\n";
