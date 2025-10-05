<?php
// Test the update payout status endpoint

echo "Testing update_payout_status.php endpoint...\n";

// First, let's check what payouts are available
require_once '../api/config/connect.php';
$db = Database::getInstance()->getConnection();

$stmt = $db->query("SELECT payout_id, status, net_amount FROM payouts ORDER BY payout_id");
$payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Available payouts:\n";
foreach ($payouts as $payout) {
    echo "- ID: {$payout['payout_id']}, Status: {$payout['status']}, Amount: {$payout['net_amount']}\n";
}

// Test the endpoint with a pending payout
$pending_payout = null;
foreach ($payouts as $payout) {
    if ($payout['status'] === 'pending') {
        $pending_payout = $payout;
        break;
    }
}

if ($pending_payout) {
    echo "\nTesting with payout ID: {$pending_payout['payout_id']}\n";

    // Simulate the API call
    $data = json_encode(['payout_id' => $pending_payout['payout_id']]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/payments/admin/update_payout_status.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Code: $http_code\n";
    echo "Response: $response\n";

    // Check the updated status
    $stmt2 = $db->prepare("SELECT status FROM payouts WHERE payout_id = ?");
    $stmt2->execute([$pending_payout['payout_id']]);
    $updated_status = $stmt2->fetchColumn();

    echo "Updated status in database: $updated_status\n";
} else {
    echo "\nNo pending payouts found to test with.\n";
}
