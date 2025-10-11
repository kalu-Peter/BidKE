<?php

/**
 * Check all auctions and their categories
 */

require_once __DIR__ . '/../api/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "All auctions with their categories:\n\n";

    $stmt = $db->query("
        SELECT a.id, a.title, c.name as category_name, a.status
        FROM auctions a
        LEFT JOIN categories c ON a.category_id = c.id
        ORDER BY c.name, a.id
    ");
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $current_category = '';
    foreach ($auctions as $auction) {
        if ($auction['category_name'] !== $current_category) {
            $current_category = $auction['category_name'];
            echo "\n=== {$current_category} ===\n";
        }
        echo "- [{$auction['id']}] {$auction['title']} (status: {$auction['status']})\n";
    }

    echo "\nActive auctions by category:\n";
    $stmt = $db->query("
        SELECT c.name as category_name, COUNT(a.id) as active_count
        FROM categories c
        LEFT JOIN auctions a ON c.id = a.category_id AND a.status IN ('active', 'approved', 'live')
        GROUP BY c.id, c.name
        ORDER BY c.name
    ");
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($stats as $stat) {
        echo "- {$stat['category_name']}: {$stat['active_count']} active auctions\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
