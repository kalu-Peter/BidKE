<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 50;
    $offset = ($page - 1) * $limit;

    // Count total payouts
    $cstmt = $db->prepare('SELECT COUNT(*) AS cnt FROM payouts');
    $cstmt->execute();
    $total = (int)($cstmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

    $stmt = $db->prepare('SELECT p.payout_id, p.seller_id, p.auction_id, p.gross_amount, p.platform_fee, p.net_amount, p.status, p.payout_method, p.transaction_ref, p.created_at, u.username as seller_username, a.title as auction_title FROM payouts p LEFT JOIN users u ON u.id = p.seller_id LEFT JOIN auctions a ON a.id = p.auction_id ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data for frontend consistency
    $formattedPayouts = array_map(function ($payout) {
        return [
            'id' => $payout['payout_id'],
            'payout_id' => $payout['payout_id'],
            'type' => 'payout',
            'status' => $payout['status'],
            'amount' => $payout['net_amount'], // Use net_amount as the main amount
            'currency' => 'KSH',
            'transaction_ref' => $payout['transaction_ref'],
            'created_at' => $payout['created_at'],
            'auction_id' => $payout['auction_id'],
            'seller_id' => $payout['seller_id'],
            'description' => 'Payout for auction #' . $payout['auction_id'],
            'auction_title' => $payout['auction_title'] ?: 'Auction #' . $payout['auction_id'],
            'auction' => [
                'title' => $payout['auction_title'] ?: 'Auction #' . $payout['auction_id'],
                'winning_amount' => $payout['gross_amount']
            ],
            'payer' => [
                'name' => 'BidKE Platform',
                'email' => 'payouts@bidke.com'
            ],
            'recipient' => [
                'name' => $payout['seller_username'] ?: 'Seller #' . $payout['seller_id'],
                'email' => ''
            ],
            'paymentMethod' => $payout['payout_method'] ?: 'Bank Transfer',
            'reference' => $payout['transaction_ref'],
            'transactionDate' => $payout['created_at'],
            'gross_amount' => $payout['gross_amount'],
            'platform_fee' => $payout['platform_fee'],
            'net_amount' => $payout['net_amount']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'data' => $formattedPayouts, 'total' => $total, 'page' => $page, 'limit' => $limit]);
    exit();
} catch (Exception $e) {
    error_log('admin/list_payouts error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit();
}
