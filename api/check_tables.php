<?php
require_once 'config/connect.php';

echo "Checking database tables...\n\n";

try {
    // Check if tables exist
    $tables = ['payments', 'commissions', 'payouts'];

    foreach ($tables as $table) {
        echo "Checking table: $table\n";

        // Check if table exists
        $checkQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '$table'
        )";

        $stmt = $pdo->prepare($checkQuery);
        $stmt->execute();
        $exists = $stmt->fetchColumn();

        if ($exists) {
            echo "✅ Table $table exists\n";

            // Count records
            $countQuery = "SELECT COUNT(*) FROM $table";
            $countStmt = $pdo->prepare($countQuery);
            $countStmt->execute();
            $count = $countStmt->fetchColumn();
            echo "   Records: $count\n";

            // Show structure
            $structQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table' ORDER BY ordinal_position";
            $structStmt = $pdo->prepare($structQuery);
            $structStmt->execute();
            $columns = $structStmt->fetchAll(PDO::FETCH_ASSOC);
            echo "   Columns: " . implode(', ', array_column($columns, 'column_name')) . "\n";
        } else {
            echo "❌ Table $table does not exist\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
