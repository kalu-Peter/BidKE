<?php
/**
 * Database Update Script
 * Updates the auction schema check constraints
 */

// Include database connection
require_once '../api/config/connect.php';

echo "Updating auction schema check constraints...\n\n";

try {
    $db = Database::getInstance();
    $connection = $db->getConnection();

    // Read and execute the update SQL
    $updateSql = file_get_contents(__DIR__ . '/schema/auction_schema_update.sql');

    if (!$updateSql) {
        echo "❌ Error: Could not read update SQL file\n";
        exit(1);
    }

    echo "Executing schema update...\n";
    $connection->exec($updateSql);

    echo "✅ Schema update completed successfully!\n\n";

    // Verify the constraints were updated
    echo "Verifying updated constraints:\n";

    // Check vehicles table constraint
    $stmt = $connection->query("
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conname = 'vehicles_condition_check'
    ");
    $constraint = $stmt->fetch();

    if ($constraint) {
        echo "✅ Vehicles condition constraint updated\n";
        echo "   Allowed values: " . (strpos($constraint['constraint_def'], 'very-good') !== false ? "includes 'very-good'" : "missing 'very-good'") . "\n";
    } else {
        echo "❌ Vehicles condition constraint not found\n";
    }

    // Check electronics table constraint
    $stmt = $connection->query("
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conname = 'electronics_condition_check'
    ");
    $constraint = $stmt->fetch();

    if ($constraint) {
        echo "✅ Electronics condition constraint updated\n";
        echo "   Allowed values: " . (strpos($constraint['constraint_def'], 'very-good') !== false ? "includes 'very-good'" : "missing 'very-good'") . "\n";
    } else {
        echo "❌ Electronics condition constraint not found\n";
    }

    echo "\n🎉 Database schema update complete!\n";
    echo "Auction creation should now work with all condition values.\n";

} catch (Exception $e) {
    echo "❌ Error updating schema: " . $e->getMessage() . "\n";
    exit(1);
}
?>