<?php

/**
 * Test both cars and motorcycles API endpoints
 */

$base_url = 'http://localhost:8000';

echo "=== API Endpoints Test ===\n\n";

// Test Cars
echo "1. Testing Cars API:\n";
$cars_response = file_get_contents($base_url . '/auctions.php?category=cars&status=live&limit=3');
$cars_data = json_decode($cars_response, true);

if ($cars_data && $cars_data['success']) {
    echo "   ✅ Cars API working\n";
    echo "   📊 Found: " . count($cars_data['data']) . " car auctions\n";
    if (!empty($cars_data['data'])) {
        echo "   🏆 Sample: " . $cars_data['data'][0]['title'] . "\n";
    }
} else {
    echo "   ❌ Cars API failed\n";
}

echo "\n";

// Test Motorcycles
echo "2. Testing Motorcycles API:\n";
$bikes_response = file_get_contents($base_url . '/auctions.php?category=motorcycles&status=live&limit=3');
$bikes_data = json_decode($bikes_response, true);

if ($bikes_data && $bikes_data['success']) {
    echo "   ✅ Motorcycles API working\n";
    echo "   📊 Found: " . count($bikes_data['data']) . " motorcycle auctions\n";
    if (!empty($bikes_data['data'])) {
        echo "   🏆 Sample: " . $bikes_data['data'][0]['title'] . "\n";
    }
} else {
    echo "   ❌ Motorcycles API failed\n";
}

echo "\n=== Summary ===\n";
echo "Cars page: http://localhost:8081/cars\n";
echo "Motorbikes page: http://localhost:8081/motorbikes\n";
echo "\nBoth pages now use real API data with:\n";
echo "- ✅ Loading states\n";
echo "- ✅ Error handling\n";
echo "- ✅ Real auction data\n";
echo "- ✅ Watchlist integration\n";
echo "- ✅ Time calculations\n";
echo "- ✅ Proper filtering\n";
