<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../models/Auth.php';

try {
    // Require authentication and admin role. Auth::requireAuth will return
    // a 401 or 403 JSON response and exit if the caller is not authenticated
    // or lacks the required role. This is more reliable than checking a
    // non-standard 'is_admin' flag on the token payload.
    $user = Auth::requireAuth('admin');

    // Best-effort: trigger auction finalization in the background so ended
    // auctions get their winner/bid statuses updated. We attempt both Unix
    // and Windows background execution methods and swallow any errors so
    // this never prevents the admin endpoint from working.
    try {
        $finalizePath = __DIR__ . '/../auctions/finalize.php';
        if (is_file($finalizePath)) {
            // Use PHP_BINARY to invoke the CLI PHP executable if available
            $phpBin = defined('PHP_BINARY') ? PHP_BINARY : 'php';
            if (stripos(PHP_OS, 'WIN') === 0) {
                // Windows: use start /B to run in background
                @pclose(@popen("start /B " . escapeshellarg($phpBin) . ' ' . escapeshellarg($finalizePath), 'r'));
            } else {
                // Unix-like: redirect output and background
                @exec(escapeshellarg($phpBin) . ' ' . escapeshellarg($finalizePath) . ' > /dev/null 2>&1 &');
            }
        }
    } catch (Exception $e) {
        // ignore - background finalize is optional
    }

    $db = Database::getInstance()->getConnection();

    // Check for auction_winners table and use it when available
    $check = $db->prepare("SELECT 1 FROM information_schema.tables WHERE table_name = 'auction_winners'");
    $check->execute();
    $hasWinnersTable = (bool)$check->fetchColumn();

    // Support pagination: ?page=1&limit=25
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 25;
    $offset = ($page - 1) * $limit;

    // Support deletion via DELETE method: delete a winner record by id
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Read raw input as JSON
        $raw = file_get_contents('php://input');
        $input = $raw ? json_decode($raw, true) : [];
        $delId = $input['id'] ?? null;
        if (!$delId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing id']);
            exit;
        }
        $del = $db->prepare("DELETE FROM auction_winners WHERE id = :id");
        $del->execute([':id' => $delId]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($hasWinnersTable) {
        $sql = "SELECT aw.id as winner_record_id, aw.auction_id, a.title as auction_title, aw.winning_amount, aw.created_at as won_at,
                       u.id as winner_id, u.username as winner_username, u.email as winner_email,
                       s.id as seller_id, COALESCE(s.full_name, s.username) as seller_name, s.email as seller_email,
                       ai.image_url as primary_image
                FROM auction_winners aw
                JOIN auctions a ON a.id = aw.auction_id
                LEFT JOIN auction_images ai ON ai.auction_id = a.id AND ai.is_primary = TRUE
                LEFT JOIN users u ON u.id = aw.winner_id
                LEFT JOIN users s ON s.id = a.seller_id
                ORDER BY aw.created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $cnt = $db->query("SELECT COUNT(1) FROM auction_winners")->fetchColumn();
    } else {
        // Fallback: find auctions ended and join with bids where bid_status='won'
        $sql = "SELECT b.id as winner_record_id, a.id as auction_id, a.title as auction_title, b.bid_amount as winning_amount, a.end_time as won_at,
               u.id as winner_id, u.username as winner_username, u.email as winner_email,
               s.id as seller_id, COALESCE(s.full_name, s.username) as seller_name, s.email as seller_email,
               ai.image_url as primary_image
        FROM auctions a
        JOIN bids b ON b.auction_id = a.id AND b.bid_status = 'won'
        LEFT JOIN auction_images ai ON ai.auction_id = a.id AND ai.is_primary = TRUE
        LEFT JOIN users u ON u.id = b.bidder_id
        LEFT JOIN users s ON s.id = a.seller_id
        WHERE a.status = 'ended'
        ORDER BY a.end_time DESC
        LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // count approximation via subquery
        $cntStmt = $db->prepare("SELECT COUNT(1) FROM auctions a JOIN bids b ON b.auction_id = a.id AND b.bid_status='won' WHERE a.status='ended'");
        $cntStmt->execute();
        $cnt = $cntStmt->fetchColumn();
    }

    // Normalize rows to ensure frontend/crud consumers always receive
    // a numeric `winning_amount` and a fully-qualified `primary_image` URL when available.
    foreach ($rows as &$r) {
        // Prefer explicit winning_amount column, fall back to bid_amount or other names
        if (isset($r['winning_amount'])) {
            $r['winning_amount'] = is_numeric($r['winning_amount']) ? (float)$r['winning_amount'] : floatval(str_replace(',', '', $r['winning_amount']));
        } elseif (isset($r['bid_amount'])) {
            $r['winning_amount'] = (float)$r['bid_amount'];
        } else {
            $r['winning_amount'] = null;
        }

        // Do not expose legacy `winningBid` field — API now uses `winning_amount` exclusively

        // Ensure there's an `id` field representing the auction id for list keys
        if (!isset($r['id']) && isset($r['auction_id'])) {
            $r['id'] = $r['auction_id'];
        }

        // Normalize primary_image to a full URL when present
        if (!empty($r['primary_image'])) {
            if (strpos($r['primary_image'], 'http') !== 0) {
                $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $r['primary_image'] = $scheme . '://' . $host . '/' . ltrim($r['primary_image'], '/');
            }
        } else {
            $r['primary_image'] = null;
        }
    }

    echo json_encode(['success' => true, 'data' => $rows, 'total' => (int)$cnt, 'page' => $page, 'limit' => $limit]);
} catch (Exception $e) {
    error_log('admin/won_auctions.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
