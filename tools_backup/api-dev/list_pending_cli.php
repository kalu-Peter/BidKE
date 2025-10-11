<?php

/**
 * CLI helper: list pending payments
 * Run: php api/dev/list_pending_cli.php
 */
require_once __DIR__ . '/../config/connect.php';

$db = Database::getInstance()->getConnection();

try {
    $stmt = $db->prepare("SELECT payment_id, transaction_ref, auction_id, amount, status, created_at FROM payments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$rows) {
        echo "No pending payments found.\n";
        exit(0);
    }

    foreach ($rows as $r) {
        echo sprintf("id=%d tx=%s auction=%d amount=%s status=%s created=%s\n", $r['payment_id'], $r['transaction_ref'], $r['auction_id'], $r['amount'], $r['status'], $r['created_at']);
    }
    exit(0);
} catch (Exception $e) {
    echo "Error listing pending payments: " . $e->getMessage() . "\n";
    exit(1);
}
