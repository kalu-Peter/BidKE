<?php
require_once 'api/config/connect.php';

$db = Database::getInstance()->getConnection();

echo "=== TESTING REVENUE CALCULATION ===\n";

// Test the new revenue calculation logic directly
$revenue = [
    'today' => 0.0,
    'week' => 0.0,
    'month' => 0.0,
    'total' => 0.0
];

// Check if commissions table exists
$commissionsExist = false;
$tblStmt = $db->prepare("SELECT to_regclass('public.commissions') as t");
$tblStmt->execute();
$tblRow = $tblStmt->fetch(PDO::FETCH_ASSOC);
if ($tblRow && $tblRow['t']) $commissionsExist = true;

echo "Commissions table exists: " . ($commissionsExist ? "YES" : "NO") . "\n";

if ($commissionsExist) {
    // Test completed commissions revenue
    $totalSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed'";
    $stmt = $db->prepare($totalSql);
    $stmt->execute();
    $revenue['total'] = (float)$stmt->fetchColumn();

    echo "Total revenue from completed commissions: {$revenue['total']}\n";

    // Test all commissions (including pending)
    $allSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions";
    $stmt = $db->prepare($allSql);
    $stmt->execute();
    $allRevenue = (float)$stmt->fetchColumn();

    echo "Total potential revenue (all commissions): {$allRevenue}\n";

    // Show commission statuses
    $statusSql = "SELECT status, COUNT(*) as count, SUM(platform_fee) as total_fee FROM commissions GROUP BY status";
    $stmt = $db->prepare($statusSql);
    $stmt->execute();
    $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\nCommission breakdown by status:\n";
    foreach ($statuses as $status) {
        echo "- {$status['status']}: {$status['count']} commissions, {$status['total_fee']} total fees\n";
    }
}

// Test creating a completed commission for testing
echo "\n=== CREATING TEST COMPLETED COMMISSION ===\n";
try {
    $insertSql = "INSERT INTO commissions (payment_id, auction_id, seller_id, platform_fee, percentage, status, created_at) 
                  VALUES (1, 19, 9, 4200.00, 10.00, 'completed', NOW())";
    $stmt = $db->prepare($insertSql);
    $success = $stmt->execute();

    if ($success) {
        echo "Created test completed commission.\n";

        // Re-test revenue calculation
        $totalSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed'";
        $stmt = $db->prepare($totalSql);
        $stmt->execute();
        $revenue['total'] = (float)$stmt->fetchColumn();

        echo "Updated total revenue from completed commissions: {$revenue['total']}\n";
    } else {
        echo "Failed to create test commission.\n";
    }
} catch (Exception $e) {
    echo "Error creating test commission: " . $e->getMessage() . "\n";
}
