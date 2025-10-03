<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/connect.php';
require_once __DIR__ . '/models/Auth.php';

try {
    $user = Auth::requireAuth();
    $userId = $user['user_id'];
    $db = Database::getInstance()->getConnection();

    // Determine bidder column name
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : 'bidder_id');

    // Prefer to read from auction_winners if table exists
    $check = $db->prepare("SELECT 1 FROM information_schema.tables WHERE table_name = 'auction_winners'");
    $check->execute();
    $hasWinnersTable = (bool)$check->fetchColumn();

    if ($hasWinnersTable) {
        $query = "SELECT aw.auction_id as id, a.title, aw.winning_amount AS winning_amount, a.status, a.end_time, a.location, ai.image_url as primary_image, aw.created_at as won_at
                  FROM auction_winners aw
                  JOIN auctions a ON a.id = aw.auction_id
                  LEFT JOIN auction_images ai ON ai.auction_id = a.id AND ai.is_primary = TRUE
                  WHERE aw.winner_id = :uid
                  ORDER BY aw.created_at DESC
                  LIMIT 200";
        $stmt = $db->prepare($query);
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Fallback to previous method (join bids)
        $query = "SELECT a.id, a.title, COALESCE(a.current_price, a.starting_price) AS winning_amount, a.status, a.end_time, a.location,
                                        ai.image_url as primary_image
                                    FROM auctions a
                                    LEFT JOIN auction_images ai ON ai.auction_id = a.id AND ai.is_primary = TRUE
                                    JOIN bids b ON b.auction_id = a.id AND b." . $bidderCol . " = :uid AND b.bid_status = 'won'
                                    WHERE a.status = 'ended'
                                    ORDER BY a.end_time DESC
                                    LIMIT 200";
        $stmt = $db->prepare($query);
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Normalize image url and ensure numeric winning_amount
    foreach ($rows as &$r) {
        if (!empty($r['primary_image'])) {
            // If image_url is a relative path, prefix with base URL
            if (strpos($r['primary_image'], 'http') !== 0) {
                $r['primary_image'] = (isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/' . ltrim($r['primary_image'], '/');
            }
        } else {
            $r['primary_image'] = null;
        }
        // Normalize winning_amount to numeric if present
        if (isset($r['winning_amount'])) {
            $r['winning_amount'] = is_numeric($r['winning_amount']) ? (float)$r['winning_amount'] : floatval(str_replace(',', '', $r['winning_amount']));
        } else {
            $r['winning_amount'] = null;
        }
    }

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (Exception $e) {
    error_log('won-auctions.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
