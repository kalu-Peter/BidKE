<?php
require_once __DIR__ . '/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Checking table schemas...\n\n";

    $tables = ['auctions', 'users', 'payments'];

    foreach ($tables as $table) {
        echo "=== $table ===\n";

        try {
            // Get table structure
            $stmt = $db->prepare("SELECT * FROM $table LIMIT 1");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                echo "Columns: " . implode(', ', array_keys($result)) . "\n";
                echo "Sample data: \n";
                foreach ($result as $key => $value) {
                    echo "  $key: " . (strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value) . "\n";
                }
            } else {
                echo "No data in table\n";
                // Try to get column info anyway
                $stmt = $db->prepare("SELECT * FROM $table LIMIT 0");
                $stmt->execute();
                $columnCount = $stmt->columnCount();
                echo "Columns ($columnCount): ";
                for ($i = 0; $i < $columnCount; $i++) {
                    $meta = $stmt->getColumnMeta($i);
                    echo $meta['name'] . ' ';
                }
                echo "\n";
            }
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
