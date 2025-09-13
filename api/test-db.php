<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Database connection successful!\n";
    
    // Check if tables exist
    $tables = ['users', 'categories', 'auctions', 'auction_files'];
    
    foreach ($tables as $table) {
        $stmt = $db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table'");
        $exists = $stmt->fetchColumn() > 0;
        echo "Table '$table': " . ($exists ? "EXISTS" : "MISSING") . "\n";
        
        if ($exists) {
            $count = $db->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            echo "  - Records: $count\n";
        }
    }
    
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>