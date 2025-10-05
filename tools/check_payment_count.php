<?php
require_once 'api/config/connect.php';
$db = Database::getInstance()->getConnection();
$stmt = $db->query('SELECT COUNT(*) FROM payments');
$count = $stmt->fetchColumn();
echo "Total payments: $count\n";

$stmt2 = $db->query('SELECT MAX(payment_id) FROM payments');
$maxId = $stmt2->fetchColumn();
echo "Max payment ID: $maxId\n";

$stmt3 = $db->query('SELECT payment_id, amount, transaction_ref FROM payments ORDER BY payment_id DESC LIMIT 5');
$recent = $stmt3->fetchAll(PDO::FETCH_ASSOC);
echo "Recent payments:\n";
foreach ($recent as $p) {
    echo "- ID: {$p['payment_id']}, Amount: {$p['amount']}, Ref: {$p['transaction_ref']}\n";
}
