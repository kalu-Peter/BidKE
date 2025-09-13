<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Test the exact query from auctions.php
    $query = "
        SELECT 
            a.id,
            a.title,
            a.description,
            a.starting_price,
            a.current_bid,
            a.reserve_price,
            a.start_time,
            a.end_time,
            a.status,
            a.featured,
            a.view_count,
            a.bid_count,
            c.name as category_name,
            c.name as category_slug,
            COALESCE(u.full_name, u.fullname, u.username) as seller_name,
            u.email as seller_email
        FROM auctions a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.seller_id = u.id
        WHERE a.status = 'approved' AND a.start_time <= NOW() AND a.end_time > NOW()
        ORDER BY a.featured DESC, a.created_at DESC
        LIMIT 5
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Query executed successfully!\n";
    echo "Found " . count($auctions) . " auctions\n\n";
    
    foreach ($auctions as $auction) {
        echo "ID: " . $auction['id'] . " - " . $auction['title'] . "\n";
        echo "Category: " . $auction['category_name'] . "\n";
        echo "Seller: " . $auction['seller_name'] . "\n";
        echo "Current Bid: " . $auction['current_bid'] . "\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>