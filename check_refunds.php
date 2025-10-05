<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== PAYMENT AND REFUND RECORDS ===\n";

$stmt = $db->query("
    SELECT payment_id, user_id, auction_id, amount, status, payment_method, transaction_ref, created_at
    FROM payments 
    ORDER BY payment_id
");
$payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($payments)) {
    echo "All payment records:\n";
    foreach ($payments as $payment) {
        $type = $payment['amount'] < 0 ? 'REFUND' : 'PAYMENT';
        echo "- {$type} ID: {$payment['payment_id']}, User: {$payment['user_id']}, Amount: {$payment['amount']}, Status: {$payment['status']}, Ref: {$payment['transaction_ref']}\n";
    }
} else {
    echo "No payment records found.\n";
}
