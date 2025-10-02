<?php
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../../api/models/Auth.php';

try {
    $admin = Auth::requireAuth();
    if (!Auth::hasRole('admin', $admin)) {
        Auth::error('Insufficient permissions', 403);
    }

    $db = Database::getInstance()->getConnection();

    // Top buyers by total_spent (if buyer_profiles.total_spent exists)
    $topBuyers = [];
    try {
        $tbSql = "SELECT bp.user_id, COALESCE(u.username,u.email) as username, COALESCE(bp.total_spent,0) as total_spent, COALESCE(bp.successful_bids,0) as successful_bids
                  FROM buyer_profiles bp
                  LEFT JOIN users u ON u.id = bp.user_id
                  ORDER BY bp.total_spent DESC NULLS LAST
                  LIMIT 10";
        $stmt = $db->prepare($tbSql);
        $stmt->execute();
        $topBuyers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log('user_analytics: top buyers query failed: ' . $e->getMessage());
    }

    // Top sellers by completed sales (approx via auctions with status='ended' and seller_id)
    $topSellers = [];
    try {
        $tsSql = "SELECT s.id as user_id, COALESCE(s.full_name,s.username) as seller_name, COUNT(a.id) as completed_sales, COALESCE(SUM(a.current_price),0) as revenue
                  FROM users s
                  JOIN auctions a ON a.seller_id = s.id AND a.status = 'ended'
                  GROUP BY s.id, s.username, s.full_name
                  ORDER BY completed_sales DESC
                  LIMIT 10";
        $stmt = $db->prepare($tsSql);
        $stmt->execute();
        $topSellers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log('user_analytics: top sellers query failed: ' . $e->getMessage());
    }

    // Retention: new users by day for last 30 days
    $retention = [];
    try {
        $retSql = "SELECT to_char(created_at::date, 'YYYY-MM-DD') as day, COUNT(*) as new_users FROM users WHERE created_at >= (current_date - INTERVAL '29 days') GROUP BY day ORDER BY day ASC";
        $stmt = $db->prepare($retSql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) $retention[$r['day']] = (int)$r['new_users'];
    } catch (Exception $e) {
        error_log('user_analytics: retention query failed: ' . $e->getMessage());
    }

    // Total users count
    $totalUsers = 0;
    try {
        $tuSql = "SELECT COUNT(*) as total FROM users";
        $stmt = $db->prepare($tuSql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalUsers = (int)$result['total'];
    } catch (Exception $e) {
        error_log('user_analytics: total users query failed: ' . $e->getMessage());
    }

    // New users in last 30 days (total)
    $newUsersTotal = array_sum($retention);

    $response = [
        'top_buyers' => $topBuyers,
        'top_sellers' => $topSellers,
        'new_users_last_30_days' => $retention,
        'total_users' => $totalUsers,
        'new_users_total' => $newUsersTotal,
    ];

    Auth::response($response, 'User analytics fetched', 200);
} catch (Exception $e) {
    error_log('user_analytics error: ' . $e->getMessage());
    Auth::error('Failed to fetch user analytics', 500);
}
