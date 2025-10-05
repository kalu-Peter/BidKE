<?php
require_once '../api/config/connect.php';

$db = Database::getInstance()->getConnection();
$stmt = $db->query('SELECT status, COUNT(*) as count FROM payouts GROUP BY status');
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Payout status values:\n";
foreach ($results as $row) {
    echo "- " . $row['status'] . ": " . $row['count'] . " records\n";
}

// Also check a sample record to see the structure
$stmt2 = $db->query('SELECT * FROM payouts LIMIT 1');
$sample = $stmt2->fetch(PDO::FETCH_ASSOC);
echo "\nSample payout record structure:\n";
print_r($sample);
