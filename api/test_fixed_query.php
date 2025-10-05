<?php
require_once __DIR__ . '/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Testing updated payments query...\n\n";

    // Test the corrected query
    $query = "
        SELECT 
            p.*,
            a.title as auction_title,
            a.current_price as winning_amount,
            COALESCE(u.first_name || ' ' || u.last_name, u.username, 'Unknown') as buyer_name,
            u.email as buyer_email,
            COALESCE(s.first_name || ' ' || s.last_name, s.username, 'Unknown') as seller_name,
            s.email as seller_email
        FROM payments p
        LEFT JOIN auctions a ON p.auction_id = a.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users s ON a.seller_id = s.id
        ORDER BY p.created_at DESC
        LIMIT 5
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Query executed successfully!\n";
    echo "Results: " . count($result) . " rows\n";
    if (!empty($result)) {
        echo "First row keys: " . implode(', ', array_keys($result[0])) . "\n";
    } else {
        echo "No results found\n";
    }
} catch (Exception $e) {
    echo "Query failed: " . $e->getMessage() . "\n";
}
