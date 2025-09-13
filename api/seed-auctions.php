<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Sample auction data
    $sampleAuctions = [
        [
            'title' => '2019 Toyota Vitz - Low Mileage',
            'description' => 'Well-maintained Toyota Vitz with low mileage. Perfect for city driving. Recently serviced with new tires. This vehicle was repossessed from a defaulted auto loan.',
            'starting_price' => 850000,
            'current_bid' => 920000,
            'reserve_price' => 1000000,
            'bid_increment' => 10000,
            'start_time' => date('Y-m-d H:i:s', strtotime('-2 days')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+3 days')),
            'status' => 'approved',
            'category_id' => 1, // Assuming cars category
            'seller_id' => 2,   // Assuming a seller exists
            'featured' => true,
            'view_count' => 45,
            'bid_count' => 12
        ],
        [
            'title' => 'Honda CB 250cc Motorcycle',
            'description' => 'Reliable Honda motorcycle in excellent condition. Perfect for daily commuting or business use. Well-maintained with service records available.',
            'starting_price' => 120000,
            'current_bid' => 135000,
            'reserve_price' => 150000,
            'bid_increment' => 5000,
            'start_time' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+2 days')),
            'status' => 'approved',
            'category_id' => 2, // Assuming motorbikes category
            'seller_id' => 3,
            'featured' => false,
            'view_count' => 28,
            'bid_count' => 8
        ],
        [
            'title' => 'Samsung 55" Smart TV 4K',
            'description' => 'Brand new Samsung smart TV with 4K resolution. Never been used, still in original packaging. Perfect for home entertainment.',
            'starting_price' => 45000,
            'current_bid' => 52000,
            'reserve_price' => 60000,
            'bid_increment' => 2000,
            'start_time' => date('Y-m-d H:i:s', strtotime('-3 hours')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'status' => 'approved',
            'category_id' => 3, // Assuming electronics category
            'seller_id' => 4,
            'featured' => true,
            'view_count' => 67,
            'bid_count' => 15
        ],
        [
            'title' => 'iPhone 13 Pro - 128GB',
            'description' => 'Apple iPhone 13 Pro in mint condition. 128GB storage, unlocked to all networks. Comes with original charger and box.',
            'starting_price' => 75000,
            'current_bid' => 82000,
            'reserve_price' => 90000,
            'bid_increment' => 3000,
            'start_time' => date('Y-m-d H:i:s', strtotime('-6 hours')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+4 hours')),
            'status' => 'approved',
            'category_id' => 3, // Electronics
            'seller_id' => 2,
            'featured' => false,
            'view_count' => 89,
            'bid_count' => 22
        ],
        [
            'title' => 'Suzuki Alto 2018 - Fuel Efficient',
            'description' => 'Economical Suzuki Alto, perfect for first-time car owners. Very fuel efficient and easy to maintain. Clean interior and exterior.',
            'starting_price' => 650000,
            'current_bid' => 675000,
            'reserve_price' => 750000,
            'bid_increment' => 15000,
            'start_time' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+5 days')),
            'status' => 'approved',
            'category_id' => 1, // Cars
            'seller_id' => 3,
            'featured' => false,
            'view_count' => 34,
            'bid_count' => 6
        ]
    ];
    
    // Insert sample auctions
    $insertQuery = "
        INSERT INTO auctions (
            title, description, starting_price, current_bid, reserve_price,
            bid_increment, start_time, end_time, status, category_id, seller_id, 
            featured, view_count, bid_count, created_at, updated_at
        ) VALUES (
            :title, :description, :starting_price, :current_bid, :reserve_price,
            :bid_increment, :start_time, :end_time, :status, :category_id, :seller_id,
            :featured, :view_count, :bid_count, NOW(), NOW()
        )
    ";
    
    $stmt = $db->prepare($insertQuery);
    
    foreach ($sampleAuctions as $auction) {
        // Convert boolean values properly
        $auction['featured'] = $auction['featured'] ? 't' : 'f';
        $stmt->execute($auction);
        echo "Inserted auction: " . $auction['title'] . "\n";
    }
    
    echo "\nSample auctions inserted successfully!\n";
    
    // Show total count
    $countResult = $db->query("SELECT COUNT(*) FROM auctions WHERE status = 'approved'")->fetchColumn();
    echo "Total approved auctions: " . $countResult . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>