<?php
require_once '../api/config/connect.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Check if table exists
    $stmt = $conn->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_profiles'");
    $tableExists = $stmt->fetchColumn();

    if (!$tableExists) {
        echo "ERROR: seller_profiles table does not exist\n";
        exit(1);
    }

    echo "OK: seller_profiles table exists\n";

    // Get column information
    $stmt = $conn->query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'seller_profiles' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Columns in seller_profiles table:\n";
    foreach ($columns as $col) {
        echo "- {$col['column_name']} ({$col['data_type']}) - Nullable: {$col['is_nullable']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
