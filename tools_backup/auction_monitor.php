<?php

/**
 * Auction Status Monitor
 * Simple dashboard to check auction finalization status
 */

require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Get current time info
    $timeQuery = $db->query("SELECT NOW() as current_time, current_setting('timezone') as db_timezone");
    $timeInfo = $timeQuery->fetch(PDO::FETCH_ASSOC);

    // Check for expired but still active auctions
    $expiredQuery = $db->query("
        SELECT id, title, status, end_time, 
               EXTRACT(EPOCH FROM (NOW() - end_time)) as seconds_overdue
        FROM auctions 
        WHERE status IN ('active', 'live') 
        AND end_time <= NOW()
        ORDER BY end_time DESC
    ");
    $expiredAuctions = $expiredQuery->fetchAll(PDO::FETCH_ASSOC);

    // Get recent finalizations
    $recentQuery = $db->query("
        SELECT a.id, a.title, a.status, a.end_time, a.updated_at,
               aw.winner_id, aw.winning_amount, aw.created_at as winner_recorded_at
        FROM auctions a
        LEFT JOIN auction_winners aw ON a.id = aw.auction_id
        WHERE a.status = 'ended' 
        AND a.updated_at >= NOW() - INTERVAL '24 hours'
        ORDER BY a.updated_at DESC
        LIMIT 10
    ");
    $recentFinalizations = $recentQuery->fetchAll(PDO::FETCH_ASSOC);

    // Get auction summary stats
    $statsQuery = $db->query("
        SELECT 
            status,
            COUNT(*) as count,
            COUNT(CASE WHEN end_time <= NOW() THEN 1 END) as ended_count
        FROM auctions 
        GROUP BY status
        ORDER BY status
    ");
    $stats = $statsQuery->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $error = "Database error: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BidKE Auction Status Monitor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: #084597;
            color: white;
            text-align: center;
        }

        .alert {
            background: #ff7272;
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }

        .success {
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }

        .info {
            background: #2196F3;
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        th,
        td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #f2f2f2;
        }

        .status-active {
            color: #ff9800;
            font-weight: bold;
        }

        .status-ended {
            color: #4CAF50;
            font-weight: bold;
        }

        .status-draft {
            color: #9e9e9e;
        }

        .refresh-btn {
            background: #084597;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .refresh-btn:hover {
            background: #205DAD;
        }

        .overdue {
            background-color: #ffebee;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card header">
            <h1>🏆 BidKE Auction Status Monitor</h1>
            <p>Real-time auction finalization monitoring</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </div>

        <?php if (isset($error)): ?>
            <div class="alert">❌ Error: <?= htmlspecialchars($error) ?></div>
        <?php else: ?>

            <!-- System Info -->
            <div class="card">
                <h2>⏰ System Time Information</h2>
                <div class="info">
                    <strong>Database Time:</strong> <?= htmlspecialchars($timeInfo['current_time']) ?> (<?= htmlspecialchars($timeInfo['db_timezone']) ?>)<br>
                    <strong>PHP Time:</strong> <?= date('Y-m-d H:i:s T') ?><br>
                    <strong>Last Updated:</strong> <?= date('Y-m-d H:i:s') ?>
                </div>
            </div>

            <!-- Expired Active Auctions (ALERT) -->
            <div class="card">
                <h2>⚠️ Expired Active Auctions</h2>
                <?php if (empty($expiredAuctions)): ?>
                    <div class="success">✅ No expired auctions found. System is working correctly!</div>
                <?php else: ?>
                    <div class="alert">❌ Found <?= count($expiredAuctions) ?> expired auction(s) that need finalization!</div>
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>End Time</th>
                            <th>Hours Overdue</th>
                            <th>Action</th>
                        </tr>
                        <?php foreach ($expiredAuctions as $auction): ?>
                            <tr class="overdue">
                                <td><?= htmlspecialchars($auction['id']) ?></td>
                                <td><?= htmlspecialchars($auction['title']) ?></td>
                                <td class="status-active"><?= htmlspecialchars($auction['status']) ?></td>
                                <td><?= htmlspecialchars($auction['end_time']) ?></td>
                                <td><?= round($auction['seconds_overdue'] / 3600, 1) ?>h</td>
                                <td><a href="/api/cron/finalize-auctions.php?token=finalize-2025" target="_blank">🔧 Force Finalize</a></td>
                            </tr>
                        <?php endforeach; ?>
                    </table>
                <?php endif; ?>
            </div>

            <!-- Auction Statistics -->
            <div class="card">
                <h2>📊 Auction Statistics</h2>
                <table>
                    <tr>
                        <th>Status</th>
                        <th>Total Count</th>
                        <th>Past End Time</th>
                        <th>Health</th>
                    </tr>
                    <?php foreach ($stats as $stat): ?>
                        <tr>
                            <td class="status-<?= htmlspecialchars($stat['status']) ?>"><?= htmlspecialchars(ucfirst($stat['status'])) ?></td>
                            <td><?= htmlspecialchars($stat['count']) ?></td>
                            <td><?= htmlspecialchars($stat['ended_count']) ?></td>
                            <td>
                                <?php if ($stat['status'] === 'active' && $stat['ended_count'] > 0): ?>
                                    ❌ Needs Attention
                                <?php else: ?>
                                    ✅ OK
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>

            <!-- Recent Finalizations -->
            <div class="card">
                <h2>🏁 Recent Finalizations (Last 24 Hours)</h2>
                <?php if (empty($recentFinalizations)): ?>
                    <div class="info">ℹ️ No auctions finalized in the last 24 hours.</div>
                <?php else: ?>
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Ended At</th>
                            <th>Finalized At</th>
                            <th>Winner</th>
                            <th>Winning Amount</th>
                        </tr>
                        <?php foreach ($recentFinalizations as $auction): ?>
                            <tr>
                                <td><?= htmlspecialchars($auction['id']) ?></td>
                                <td><?= htmlspecialchars($auction['title']) ?></td>
                                <td><?= htmlspecialchars($auction['end_time']) ?></td>
                                <td><?= htmlspecialchars($auction['updated_at']) ?></td>
                                <td><?= $auction['winner_id'] ? 'User ' . htmlspecialchars($auction['winner_id']) : 'No Winner' ?></td>
                                <td><?= $auction['winning_amount'] ? '$' . number_format($auction['winning_amount'], 2) : '-' ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </table>
                <?php endif; ?>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <h2>🛠️ Quick Actions</h2>
                <p>
                    <a href="/api/cron/finalize-auctions.php?token=finalize-2025" target="_blank" class="refresh-btn">🔧 Run Finalization Now</a>
                    <a href="/api/auctions/finalize.php" target="_blank" class="refresh-btn">📋 Basic Finalize API</a>
                    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Page</button>
                </p>
                <p><small>💡 Tip: Bookmark this page and check it regularly to ensure auctions are being finalized properly.</small></p>
            </div>

        <?php endif; ?>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            location.reload();
        }, 30000);
    </script>
</body>

</html>