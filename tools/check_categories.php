<?php

/**
 * Check available categories in the database
 */

require_once __DIR__ . '/../api/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Checking available categories...\n\n";

    // Check categories table
    $stmt = $db->query("SELECT id, name FROM categories ORDER BY name");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Categories table:\n";
    foreach ($categories as $category) {
        echo "- ID: {$category['id']}, Name: '{$category['name']}'\n";
    }

    echo "\nAuctions by category:\n";
    $stmt = $db->query("
        SELECT c.name as category_name, COUNT(a.id) as auction_count 
        FROM categories c 
        LEFT JOIN auctions a ON c.id = a.category_id 
        GROUP BY c.id, c.name 
        ORDER BY c.name
    ");
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($stats as $stat) {
        echo "- {$stat['category_name']}: {$stat['auction_count']} auctions\n";
    }

    echo "\nSample auction titles by category:\n";
    $stmt = $db->query("
        SELECT c.name as category_name, a.title, a.vehicle_type
        FROM categories c 
        LEFT JOIN auctions a ON c.id = a.category_id 
        WHERE a.id IS NOT NULL
        ORDER BY c.name, a.id
        LIMIT 10
    ");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($samples as $sample) {
        echo "- [{$sample['category_name']}] {$sample['title']} (vehicle_type: {$sample['vehicle_type']})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
