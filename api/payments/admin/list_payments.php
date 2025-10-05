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

    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM payments";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $totalResult['total'];

    // Get payments data
    $query = "
        SELECT 
            payment_id,
            user_id,
            auction_id,
            amount,
            status,
            payment_method,
            transaction_ref,
            created_at,
            updated_at
        FROM payments
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data for frontend consumption
    $formattedPayments = array_map(function ($payment) {
        return [
            'id' => $payment['payment_id'],
            'payment_id' => $payment['payment_id'],
            'type' => 'auction_payment',
            'status' => $payment['status'],
            'amount' => $payment['amount'],
            'currency' => 'KSH',
            'transaction_ref' => $payment['transaction_ref'],
            'created_at' => $payment['created_at'],
            'updated_at' => $payment['updated_at'],
            'auction_id' => $payment['auction_id'],
            'user_id' => $payment['user_id'],
            'description' => 'Payment for auction #' . $payment['auction_id'],
            'auction' => [
                'title' => 'Auction #' . $payment['auction_id'],
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
