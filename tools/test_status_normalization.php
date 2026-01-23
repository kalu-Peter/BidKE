<?php
require_once __DIR__ . '/../api/config/connect.php';

// Test the normalized status mapping
$pdo = Database::getInstance()->getConnection();

echo "=== TESTING LIVE STATUS FILTER ===\n";

// Test 1: Filter by 'live' (should get 'active' records)
$status = 'live';
if ($status === 'live') {
    $status = 'active';
}
echo "Input: 'live' => Normalized to: '$status'\n\n";

// Query for active records
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM auctions WHERE status = :status");
$stmt->execute([':status' => $status]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Records with status='active': " . $result['cnt'] . "\n\n";

// Test 2: Verify all statuses
$stmt = $pdo->query("SELECT status, COUNT(*) as cnt FROM auctions GROUP BY status ORDER BY status");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "All statuses in database:\n";
foreach ($rows as $row) {
    echo "  {$row['status']}: {$row['cnt']}\n";
}
