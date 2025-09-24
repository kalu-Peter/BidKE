<?php
/**
 * Apply Unified Schema
 * Executes `database/schema/unified_from_models.sql` using the project's Database class.
 */

require_once __DIR__ . '/../api/config/connect.php';

$file = __DIR__ . '/schema/unified_from_models.sql';
if (!file_exists($file)) {
    echo "Schema file not found: $file\n";
    exit(1);
}

$sql = file_get_contents($file);
if ($sql === false) {
    echo "Could not read schema file: $file\n";
    exit(1);
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    echo "Applying unified schema...\n";
    $conn->exec($sql);
    echo "Unified schema applied successfully.\n";
} catch (PDOException $e) {
    echo "Error applying schema: " . $e->getMessage() . "\n";
    exit(1);
}

// Verify key tables
$tables = ['users','auctions','buyer_profiles','seller_profiles','vehicles','electronics','bids','user_roles','user_sessions'];
echo "\nVerifying tables...\n";
foreach ($tables as $t) {
    try {
        $stmt = $conn->query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '" . $t . "')");
        $exists = $stmt->fetch()['exists'];
        echo "- $t: " . ($exists ? "✓ Created" : "✗ Missing") . "\n";
    } catch (Exception $e) {
        echo "- $t: error checking (" . $e->getMessage() . ")\n";
    }
}

echo "\nDone.\n";

?>
