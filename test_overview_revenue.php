<?php
// Simple test of the revenue calculation in overview endpoint
require_once 'api/config/connect.php';

echo "=== TESTING OVERVIEW REVENUE SECTION ===\n";

$db = Database::getInstance()->getConnection();

// Replicate the revenue calculation from overview.php
$revenue = [
    'today' => 0.0,
    'week' => 0.0,
    'month' => 0.0,
    'total' => 0.0
];

try {
    // Check if commissions table exists
    $commissionsExist = false;
    $tblStmt = $db->prepare("SELECT to_regclass('public.commissions') as t");
    $tblStmt->execute();
    $tblRow = $tblStmt->fetch(PDO::FETCH_ASSOC);
    if ($tblRow && $tblRow['t']) $commissionsExist = true;

    if ($commissionsExist) {
        // Calculate revenue from platform_fee in commissions table (completed commissions only)
        $todaySql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed' AND created_at >= date_trunc('day', now())";
        $weekSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed' AND created_at >= date_trunc('week', now())";
        $monthSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed' AND created_at >= date_trunc('month', now())";
        $totalSql = "SELECT COALESCE(SUM(platform_fee),0) as s FROM commissions WHERE status = 'completed'";

        $stmt = $db->prepare($todaySql);
        $stmt->execute();
        $revenue['today'] = (float)$stmt->fetchColumn();

        $stmt = $db->prepare($weekSql);
        $stmt->execute();
        $revenue['week'] = (float)$stmt->fetchColumn();

        $stmt = $db->prepare($monthSql);
        $stmt->execute();
        $revenue['month'] = (float)$stmt->fetchColumn();

        $stmt = $db->prepare($totalSql);
        $stmt->execute();
        $revenue['total'] = (float)$stmt->fetchColumn();

        echo "✅ Commission-based revenue calculation successful!\n";
    } else {
        echo "❌ Commissions table not found, using fallback.\n";
    }
} catch (Exception $e) {
    echo "❌ Error in revenue calculation: " . $e->getMessage() . "\n";
}

echo "\nRevenue Results:\n";
echo "- Today: Ksh " . number_format($revenue['today'], 2) . "\n";
echo "- This Week: Ksh " . number_format($revenue['week'], 2) . "\n";
echo "- This Month: Ksh " . number_format($revenue['month'], 2) . "\n";
echo "- Total: Ksh " . number_format($revenue['total'], 2) . "\n";

// Simulate the overview response structure
$mockResponse = [
    'revenue' => $revenue,
    'success' => true,
    'message' => 'Revenue calculated from platform fees in commissions table'
];

echo "\nMock Overview Response:\n";
echo json_encode($mockResponse, JSON_PRETTY_PRINT) . "\n";
