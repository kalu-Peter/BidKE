<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Get pagination parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;

    // Check if we should only show refunded payments
    $refundedOnly = isset($_GET['refunded_only']) && $_GET['refunded_only'] == '1';

    // Build WHERE clause for refunded filter
    $whereClause = "";
    if ($refundedOnly) {
        $whereClause = "WHERE EXISTS (
            SELECT 1 FROM payments r 
            WHERE r.auction_id = payments.auction_id 
            AND r.user_id = payments.user_id 
            AND r.amount < 0 
            AND r.status = 'completed'
        )";
    }

    // Get total count with filter
    $countAdditionalWhere = $whereClause ? " AND p.amount > 0" : "WHERE p.amount > 0";
    $countQuery = "SELECT COUNT(*) as total FROM payments p " . str_replace('payments.', 'p.', $whereClause) . $countAdditionalWhere;
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $totalResult['total'];

    // Get payments data with filter
    $additionalWhere = $whereClause ? " AND p.amount > 0" : "WHERE p.amount > 0";
    $query = "
        SELECT 
            p.payment_id,
            p.user_id,
            p.auction_id,
            p.amount,
            p.status,
            p.payment_method,
            p.transaction_ref,
            p.created_at,
            p.updated_at,
            a.title as auction_title,
            CASE WHEN EXISTS (
                SELECT 1 FROM payments r 
                WHERE r.auction_id = p.auction_id 
                AND r.user_id = p.user_id 
                AND r.amount < 0 
                AND r.status = 'completed'
            ) THEN 1 ELSE 0 END as refunded
        FROM payments p
        LEFT JOIN auctions a ON p.auction_id = a.id
        " . str_replace('payments.', 'p.', $whereClause) . $additionalWhere . "
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data for frontend consumption
    $formattedPayments = array_map(function ($payment) {
        $isRefunded = $payment['refunded'] == 1;
        return [
            'id' => $payment['payment_id'],
            'payment_id' => $payment['payment_id'],
            'type' => $isRefunded ? 'refund' : 'auction_payment',
            'status' => $payment['status'],
            'amount' => $payment['amount'],
            'currency' => 'KSH',
            'transaction_ref' => $payment['transaction_ref'],
            'created_at' => $payment['created_at'],
            'updated_at' => $payment['updated_at'],
            'auction_id' => $payment['auction_id'],
            'user_id' => $payment['user_id'],
            'refunded' => $isRefunded,
            'description' => ($isRefunded ? 'Refunded payment' : 'Payment') . ' for auction #' . $payment['auction_id'],
            'auction_title' => $payment['auction_title'] ?: 'Auction #' . $payment['auction_id'],
            'auction' => [
                'title' => $payment['auction_title'] ?: 'Auction #' . $payment['auction_id'],
                'winning_amount' => $payment['amount']
            ],
            'payer' => [
                'name' => 'User #' . $payment['user_id'],
                'email' => ''
            ],
            'recipient' => [
                'name' => 'Seller',
                'email' => ''
            ],
            'paymentMethod' => $payment['payment_method'],
            'reference' => $payment['transaction_ref'],
            'transactionDate' => $payment['created_at']
        ];
    }, $payments);

    echo json_encode([
        'success' => true,
        'data' => $formattedPayments,
        'total' => $total,
        'page' => $page,
        'limit' => $limit
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
