<?php
/**
 * Database Setup Script
 * Executes SQL schema files to set up the database
 */

// Include database connection
require_once '../api/config/connect.php';

// Function to execute SQL file
function executeSqlFile($filePath) {
    if (!file_exists($filePath)) {
        echo "Error: SQL file not found: $filePath\n";
        return false;
    }

    $sql = file_get_contents($filePath);
    if ($sql === false) {
        echo "Error: Could not read SQL file: $filePath\n";
        return false;
    }

    try {
        $db = Database::getInstance();
        $connection = $db->getConnection();

        // Execute the entire SQL file as one statement
        echo "Executing SQL file...\n";
        $connection->exec($sql);

        echo "SQL file executed successfully: $filePath\n";
        return true;

    } catch (PDOException $e) {
        echo "Error executing SQL: " . $e->getMessage() . "\n";
        return false;
    }
}

// Execute the auction schema
$schemaPath = __DIR__ . '/schema/auction_schema.sql';
echo "Setting up auction database schema...\n";

if (executeSqlFile($schemaPath)) {
    echo "\nAuction schema setup completed successfully!\n";

    // Test the tables were created
    try {
        $db = Database::getInstance();
        $connection = $db->getConnection();

        $tables = ['categories', 'auctions', 'vehicles', 'electronics', 'auction_images', 'bids', 'watchlists'];
        echo "\nVerifying tables were created:\n";

        foreach ($tables as $table) {
            $stmt = $connection->query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table')");
            $exists = $stmt->fetch()['exists'];
            echo "- $table: " . ($exists ? '✓ Created' : '✗ Missing') . "\n";
        }

    } catch (Exception $e) {
        echo "Error verifying tables: " . $e->getMessage() . "\n";
    }

} else {
    echo "\nFailed to set up auction schema!\n";
    exit(1);
}

echo "\nDatabase setup complete!\n";
?>