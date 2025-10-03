<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

// Simple admin check could be added here (session/role). For now rely on server-side session.

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 50;
    $offset = ($page - 1) * $limit;

    // Count total pending payments
    $cstmt = $db->prepare('SELECT COUNT(*) AS cnt FROM payments WHERE status = :status');
    $cstmt->execute(['status' => 'pending']);
    $total = (int)($cstmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

    $stmt = $db->prepare('SELECT p.payment_id, p.user_id, p.auction_id, p.amount, p.payment_method, p.transaction_ref, p.created_at, a.title AS auction_title, a.seller_id, u.username AS winner_username, s.username AS seller_username FROM payments p LEFT JOIN auctions a ON a.id = p.auction_id LEFT JOIN users u ON u.id = p.user_id LEFT JOIN users s ON s.id = a.seller_id WHERE p.status = :status ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':status', 'pending');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
    exit();
} catch (Exception $e) {
    error_log('admin/list_pending error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit();
}
