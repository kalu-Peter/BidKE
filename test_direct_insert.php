<?php
require_once 'api/config/connect.php';
$db = Database::getInstance()->getConnection();

// Check the table structure in more detail
$stmt = $db->query("
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'payments' 
    ORDER BY ordinal_position
");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Payments table detailed structure:\n";
foreach ($columns as $column) {
    echo "- {$column['column_name']}: {$column['data_type']} " .
        ($column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL') .
        " Default: " . ($column['column_default'] ?? 'none') . "\n";
}

// Try a direct insert test
echo "\nTesting direct insert...\n";
try {
    $stmt = $db->prepare("
        INSERT INTO payments (user_id, auction_id, amount, status, payment_method, transaction_ref, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        RETURNING payment_id
    ");

    $result = $stmt->execute([6, 19, -42000.00, 'completed', 'test', 'TEST_REFUND_' . time()]);

    if ($result) {
        $insertedId = $stmt->fetchColumn();
        echo "Direct insert successful, ID: $insertedId\n";
    } else {
        echo "Direct insert failed\n";
    }
} catch (Exception $e) {
    echo "Direct insert error: " . $e->getMessage() . "\n";
}
