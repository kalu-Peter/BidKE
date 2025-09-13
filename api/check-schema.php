<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check auctions table structure
    $stmt = $db->query("
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'auctions' 
        ORDER BY ordinal_position
    ");
    
    echo "Auctions table structure:\n";
    echo "========================\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("%-20s %-15s %s\n", 
            $row['column_name'], 
            $row['data_type'], 
            $row['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL'
        );
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>