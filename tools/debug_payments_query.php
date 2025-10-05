<?php
require_once __DIR__ . '/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Testing payments query directly...\n\n";

    // Test the exact query from list_payments.php
    $query = "
        SELECT 
            p.*,
            a.title as auction_title,
            a.winning_amount,
            u.first_name || ' ' || u.last_name as buyer_name,
            u.email as buyer_email,
            s.first_name || ' ' || s.last_name as seller_name,
            s.email as seller_email
        FROM payments p
        LEFT JOIN auctions a ON p.auction_id = a.auction_id
        LEFT JOIN users u ON p.buyer_id = u.user_id
        LEFT JOIN users s ON a.seller_id = s.user_id
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
        print_r($result[0]);
    }
} catch (Exception $e) {
    echo "Query failed: " . $e->getMessage() . "\n";
    echo "Error info: ";
    print_r($e);
}
