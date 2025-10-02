<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../models/Auth.php';

try {
    $user = Auth::requireAuth();
    // require admin role (simple check - adapt to your auth rules)
    if (!($user['is_admin'] ?? false)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }

    $db = Database::getInstance()->getConnection();

    // Check for auction_winners table and use it when available
    $check = $db->prepare("SELECT 1 FROM information_schema.tables WHERE table_name = 'auction_winners'");
    $check->execute();
    $hasWinnersTable = (bool)$check->fetchColumn();

    if ($hasWinnersTable) {
        $sql = "SELECT aw.id as winner_record_id, aw.auction_id, a.title as auction_title, aw.winning_amount, aw.created_at as won_at,
                       u.id as winner_id, u.username as winner_username, u.email as winner_email,
                       s.id as seller_id, COALESCE(s.full_name, s.username) as seller_name, s.email as seller_email
                FROM auction_winners aw
                JOIN auctions a ON a.id = aw.auction_id
                LEFT JOIN users u ON u.id = aw.winner_id
                LEFT JOIN users s ON s.id = a.seller_id
                ORDER BY aw.created_at DESC
                LIMIT 100";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Fallback: find auctions ended and join with bids where bid_status='won'
        $sql = "SELECT b.id as winner_record_id, a.id as auction_id, a.title as auction_title, b.bid_amount as winning_amount, a.end_time as won_at,
                       u.id as winner_id, u.username as winner_username, u.email as winner_email,
                       s.id as seller_id, COALESCE(s.full_name, s.username) as seller_name, s.email as seller_email
                FROM auctions a
                JOIN bids b ON b.auction_id = a.id AND b.bid_status = 'won'
                LEFT JOIN users u ON u.id = b.bidder_id
                LEFT JOIN users s ON s.id = a.seller_id
                WHERE a.status = 'ended'
                ORDER BY a.end_time DESC
                LIMIT 100";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (Exception $e) {
    error_log('admin/won_auctions.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
