<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();
$stmt = $db->query('SELECT payout_id, status, net_amount FROM payouts ORDER BY payout_id');
$payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Current payouts in database:\n";
foreach ($payouts as $payout) {
    echo "- ID: {$payout['payout_id']}, Status: {$payout['status']}, Amount: {$payout['net_amount']}\n";
}

// If all are completed, let's create a test pending payout
$pendingCount = 0;
foreach ($payouts as $payout) {
    if ($payout['status'] === 'pending') {
        $pendingCount++;
    }
}

if ($pendingCount === 0) {
    echo "\nNo pending payouts found. Creating a test pending payout...\n";

    // Reset one payout to pending status for testing
    if (!empty($payouts)) {
        $testId = $payouts[0]['payout_id'];
        $stmt = $db->prepare("UPDATE payouts SET status = 'pending' WHERE payout_id = ?");
        $stmt->execute([$testId]);
        echo "Reset payout ID $testId to pending status for testing.\n";
    }
} else {
    echo "\nFound $pendingCount pending payout(s) for testing.\n";
}
