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
    $countQuery = "SELECT COUNT(*) as total FROM commissions";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $totalResult['total'];

    // Get commissions data
    $query = "
        SELECT 
            commission_id,
            payment_id,
            auction_id,
            seller_id,
            platform_fee as amount,
            percentage,
            status,
            created_at
        FROM commissions
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $commissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data for frontend consumption
    $formattedCommissions = array_map(function ($commission) {
        return [
            'id' => $commission['commission_id'],
            'commission_id' => $commission['commission_id'],
            'type' => 'commission',
            'status' => 'completed', // Commissions are created when payment completes
            'amount' => $commission['amount'],
            'currency' => 'KSH',
            'percentage' => $commission['percentage'],
            'created_at' => $commission['created_at'],
            'payment_id' => $commission['payment_id'],
            'auction_id' => $commission['auction_id'],
            'seller_id' => $commission['seller_id'],
            'description' => 'Platform commission (' . ($commission['percentage'] * 100) . '%) for auction #' . $commission['auction_id'],
            'auction' => [
                'title' => 'Auction #' . $commission['auction_id'],
                'winning_amount' => null
            ],
            'payer' => [
                'name' => 'Platform',
                'email' => 'admin@bidke.com'
            ],
            'recipient' => [
                'name' => 'BidKE Platform',
                'email' => 'finance@bidke.com'
            ],
            'paymentMethod' => 'Automatic Deduction',
            'reference' => 'COM-' . $commission['commission_id'],
            'transactionDate' => $commission['created_at'],
            'platformFee' => $commission['amount'],
            'processingFee' => 0
        ];
    }, $commissions);

    echo json_encode([
        'success' => true,
        'data' => $formattedCommissions,
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
