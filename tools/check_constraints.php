<?php
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Get constraint information
    $stmt = $conn->query("
        SELECT con.conname, pg_get_constraintdef(con.oid) as constraint_def
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' 
        AND rel.relname = 'seller_profiles'
        AND con.contype = 'c'
    ");
    $constraints = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Check constraints for seller_profiles table:\n";
    foreach ($constraints as $constraint) {
        echo "- {$constraint['conname']}: {$constraint['constraint_def']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
