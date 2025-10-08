<?php
// CORS Headers
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Get seller ID from request (in production, get from authenticated session)
    $seller_id = isset($_GET['seller_id']) ? intval($_GET['seller_id']) : null;

    if (!$seller_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Seller ID is required'
        ]);
        exit;
    }

    // Get pagination parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;

    // Get seller's completed auctions with payment, payout and commission data using auction_winners
    $query = "
        SELECT DISTINCT
            a.id as auction_id,
            a.title as item_title,
            aw.winning_amount as sold_price,
            aw.created_at as sale_date,
            a.status,
            u.username as buyer_name,
            u.email as buyer_email,
            p.amount as payment_amount,
            p.status as payment_status,
            p.created_at as payment_date,
            po.net_amount as payout_amount,
            po.platform_fee as commission_amount,
            po.status as payout_status,
            po.created_at as payout_date,
            (SELECT platform_fee FROM commissions WHERE auction_id = a.id AND status = 'completed' LIMIT 1) as commission_fee,
            (SELECT percentage FROM commissions WHERE auction_id = a.id AND status = 'completed' LIMIT 1) as commission_percentage
        FROM auction_winners aw
        JOIN auctions a ON aw.auction_id = a.id
        LEFT JOIN users u ON aw.winner_id = u.id
        LEFT JOIN payments p ON a.id = p.auction_id AND p.status = 'completed'
        LEFT JOIN payouts po ON a.id = po.auction_id
        WHERE a.seller_id = :seller_id 
        ORDER BY aw.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':seller_id', $seller_id, PDO::PARAM_INT);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count for pagination
    $countQuery = "
        SELECT COUNT(*) as total 
        FROM auction_winners aw
        JOIN auctions a ON aw.auction_id = a.id
        WHERE a.seller_id = :seller_id 
    ";
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':seller_id', $seller_id, PDO::PARAM_INT);
    $countStmt->execute();
    $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $totalResult['total'];

    // Format the data for frontend
    $formattedSales = array_map(function ($sale) {
        return [
            'id' => $sale['auction_id'],
            'item' => $sale['item_title'],
            'buyer' => $sale['buyer_name'] ?: 'Anonymous',
            'buyer_email' => $sale['buyer_email'],
            'soldPrice' => floatval($sale['sold_price']),
            'commission' => floatval($sale['commission_fee'] ?: $sale['platform_fee'] ?: 0),
            'payout' => floatval($sale['payout_amount'] ?: ($sale['sold_price'] * 0.9)), // 90% if no payout record
            'date' => $sale['sale_date'],
            'payment_date' => $sale['payment_date'],
            'payout_date' => $sale['payout_date'],
            'status' => $sale['payout_status'] ?: ($sale['payment_status'] === 'completed' ? 'pending' : 'processing'),
            'payment_status' => $sale['payment_status'],
            'payout_status' => $sale['payout_status'],
            'commission_percentage' => floatval($sale['commission_percentage'] ?: 0.1) // Default 10%
        ];
    }, $sales);

    // Calculate summary statistics
    $summaryQuery = "
        SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(aw.winning_amount), 0) as total_revenue,
            COALESCE(SUM(po.net_amount), 0) as total_payouts,
            COALESCE(SUM(po.platform_fee), 0) as total_commission
        FROM auction_winners aw
        JOIN auctions a ON aw.auction_id = a.id
        LEFT JOIN payouts po ON a.id = po.auction_id
        WHERE a.seller_id = :seller_id 
    ";

    $summaryStmt = $db->prepare($summaryQuery);
    $summaryStmt->bindParam(':seller_id', $seller_id, PDO::PARAM_INT);
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $formattedSales,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'summary' => [
            'total_sales' => intval($summary['total_sales']),
            'total_revenue' => floatval($summary['total_revenue']),
            'total_payouts' => floatval($summary['total_payouts']),
            'total_commission' => floatval($summary['total_commission']),
            'items_sold' => intval($summary['total_sales'])
        ]
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
