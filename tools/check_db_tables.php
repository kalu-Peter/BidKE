<?php
require_once __DIR__ . '/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Checking database tables...\n\n";

    // Check if tables exist
    $tables = ['payments', 'commissions', 'payouts'];

    foreach ($tables as $table) {
        echo "Checking table: $table\n";

        try {
            // Check if table exists by trying to query it
            $stmt = $db->prepare("SELECT COUNT(*) FROM $table");
            $stmt->execute();
            $count = $stmt->fetchColumn();
            echo "✅ Table $table exists with $count records\n";

            // Show first few column names
            $structStmt = $db->prepare("SELECT * FROM $table LIMIT 0");
            $structStmt->execute();
            $columnCount = $structStmt->columnCount();
            echo "   Columns ($columnCount): ";
            for ($i = 0; $i < $columnCount; $i++) {
                $meta = $structStmt->getColumnMeta($i);
                echo $meta['name'] . ' ';
            }
            echo "\n";
        } catch (Exception $e) {
            echo "❌ Table $table: " . $e->getMessage() . "\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
