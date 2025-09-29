<?php
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../../api/models/Auth.php';

// Admin overview endpoint - returns aggregated metrics for admin dashboard
try {
    $admin = Auth::requireAuth();
    if (!Auth::hasRole('admin', $admin)) {
        Auth::error('Insufficient permissions', 403);
    }

    $db = Database::getInstance()->getConnection();

    // Simple file-based cache to avoid expensive queries on every request
    $cacheDir = __DIR__ . '/../cache';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    $cacheFile = $cacheDir . '/admin_overview_cache.json';
    $cacheTtl = 30; // seconds

    $useCache = false;
    $cached = null;
    if (file_exists($cacheFile)) {
        $mtime = filemtime($cacheFile);
        if ($mtime !== false && (time() - $mtime) < $cacheTtl) {
            $raw = @file_get_contents($cacheFile);
            $cached = $raw ? json_decode($raw, true) : null;
            if (is_array($cached)) {
                $useCache = true;
            }
        }
    }

    if ($useCache) {
        Auth::response($cached, 'Overview metrics (cached)', 200);
        exit;
    }

    // Users counts
    $usersCountSql = "SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_users,
                COUNT(*) FILTER (WHERE status = 'active') AS active_users,
                COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_users,
                COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_users,
                COUNT(*) FILTER (WHERE status = 'banned') AS banned_users,
                COUNT(*) FILTER (WHERE is_verified = FALSE) AS unverified_users,
                COUNT(*) FILTER (WHERE is_verified = TRUE) AS approved_users
            FROM users";

    $stmt = $db->prepare($usersCountSql);
    $stmt->execute();
    $userCounts = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Buyer profile counts
    $bpSql = "SELECT
        COUNT(*) AS total_buyers,
        COUNT(*) FILTER (WHERE national_id_verified = TRUE) AS verified_buyers,
        COUNT(*) FILTER (WHERE is_restricted = TRUE) AS restricted_buyers
      FROM buyer_profiles";
    $stmt = $db->prepare($bpSql);
    $stmt->execute();
    $buyerCounts = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Seller profile counts
    $spSql = "SELECT
        COUNT(*) AS total_sellers,
        COUNT(*) FILTER (WHERE verification_status = 'pending') AS pending_sellers,
        COUNT(*) FILTER (WHERE verification_status = 'verified') AS verified_sellers,
        COUNT(*) FILTER (WHERE verification_status = 'rejected') AS rejected_sellers
      FROM seller_profiles";
    $stmt = $db->prepare($spSql);
    $stmt->execute();
    $sellerCounts = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Recent users
    $recentUsersSql = "SELECT id, username, email, status, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 6";
    $stmt = $db->prepare($recentUsersSql);
    $stmt->execute();
    $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Auctions: counts by status
    $auctionStatusCounts = [];
    try {
        $statusSql = "SELECT status, COUNT(*) as cnt FROM auctions GROUP BY status";
        $stmt = $db->prepare($statusSql);
        $stmt->execute();
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($groups as $g) {
            $auctionStatusCounts[$g['status']] = (int)$g['cnt'];
        }
    } catch (Exception $e) {
        error_log('admin/overview.php: auction status query skipped: ' . $e->getMessage());
    }

    // Ensure we provide a normalized 'live' count (some codebases use 'active' or 'live')
    try {
        $liveSql = "SELECT COUNT(*) as cnt FROM auctions WHERE status IN ('active','live')";
        $stmt = $db->prepare($liveSql);
        $stmt->execute();
        $liveCount = (int)$stmt->fetchColumn();
        $auctionStatusCounts['live'] = $liveCount;
    } catch (Exception $e) {
        error_log('admin/overview.php: live auctions count query skipped: ' . $e->getMessage());
        // Fallback: if group query provided 'active', use that for 'live'
        if (!isset($auctionStatusCounts['live'])) {
            $auctionStatusCounts['live'] = isset($auctionStatusCounts['active']) ? (int)$auctionStatusCounts['active'] : 0;
        }
    }

    // Revenue summaries: today, this week, this month (assumes auctions.final_price or payments table)
    $revenue = [
        'today' => 0.0,
        'week' => 0.0,
        'month' => 0.0,
        'total' => 0.0
    ];
    try {
        // Prefer payments table if present
        $paymentsExist = false;
        $tblStmt = $db->prepare("SELECT to_regclass('public.payments') as t");
        $tblStmt->execute();
        $tblRow = $tblStmt->fetch(PDO::FETCH_ASSOC);
        if ($tblRow && $tblRow['t']) $paymentsExist = true;

        if ($paymentsExist) {
            $todaySql = "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE created_at >= date_trunc('day', now())";
            $weekSql = "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE created_at >= date_trunc('week', now())";
            $monthSql = "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE created_at >= date_trunc('month', now())";
            $totalSql = "SELECT COALESCE(SUM(amount),0) as s FROM payments";
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
        } else {
            // Fallback: try auctions.final_price or bids
            $todaySql = "SELECT COALESCE(SUM(final_price),0) FROM auctions WHERE status = 'ended' AND updated_at >= date_trunc('day', now())";
            $weekSql = "SELECT COALESCE(SUM(final_price),0) FROM auctions WHERE status = 'ended' AND updated_at >= date_trunc('week', now())";
            $monthSql = "SELECT COALESCE(SUM(final_price),0) FROM auctions WHERE status = 'ended' AND updated_at >= date_trunc('month', now())";
            $totalSql = "SELECT COALESCE(SUM(final_price),0) FROM auctions WHERE status = 'ended'";
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
        }
    } catch (Exception $e) {
        error_log('admin/overview.php: revenue query skipped: ' . $e->getMessage());
    }

    // Recent auctions
    $recentAuctions = [];
    try {
        $raSql = "SELECT id, title, status, starting_price, COALESCE(current_price,0) as current_bid, final_price, created_at FROM auctions ORDER BY created_at DESC LIMIT 6";
        $stmt = $db->prepare($raSql);
        $stmt->execute();
        $recentAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log('admin/overview.php: recent auctions query skipped: ' . $e->getMessage());
    }

    // Recent signups per day (last 7 days)
    $signups = [];
    try {
        $signupSql = "SELECT to_char(created_at::date, 'YYYY-MM-DD') as day, COUNT(*) as cnt FROM users WHERE created_at >= (current_date - INTERVAL '6 days') GROUP BY day ORDER BY day ASC";
        $stmt = $db->prepare($signupSql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            $signups[$r['day']] = (int)$r['cnt'];
        }
    } catch (Exception $e) {
        error_log('admin/overview.php: signup query skipped: ' . $e->getMessage());
    }

    $response = [
        'users' => $userCounts,
        'buyers' => $buyerCounts,
        'sellers' => $sellerCounts,
        'auctions_by_status' => $auctionStatusCounts,
        'revenue' => $revenue,
        'recent_users' => $recentUsers,
        'recent_auctions' => $recentAuctions,
        'signups_last_7_days' => $signups
    ];

    // Cache response to file
    @file_put_contents($cacheFile, json_encode($response));

    // Use Auth::response for consistent shape
    Auth::response($response, 'Overview metrics fetched', 200);
} catch (Exception $e) {
    error_log('admin/overview.php error: ' . $e->getMessage());
    // Use sendError helper if available, otherwise Auth::error
    if (function_exists('sendError')) {
        sendError('Failed to fetch overview metrics', 500, $e->getMessage());
    } else {
        Auth::error('Failed to fetch overview metrics', 500);
    }
}
