<?php
require_once __DIR__ . '/../api/config/connect.php';

// Simulate admin listings API call
$pdo = Database::getInstance()->getConnection();

$page = 1;
$limit = 20;
$offset = 0;
$status = 'all';  // Same as UI default

$baseQuery = "FROM auctions a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.seller_id = u.id LEFT JOIN vehicles v ON a.id = v.auction_id LEFT JOIN electronics e ON a.id = e.auction_id WHERE 1=1";
$params = [];
$conditions = [];

// When status = 'all', no status filter is added
if ($status !== 'all') {
    $conditions[] = "a.status = :status";
    $params[':status'] = $status;
}

if (!empty($conditions)) {
    $baseQuery .= ' AND ' . implode(' AND ', $conditions);
}

// Count total records
$countQuery = "SELECT COUNT(*) as total " . $baseQuery;
$countStmt = $pdo->prepare($countQuery);
$countStmt->execute($params);
$total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

echo "=== ADMIN LISTINGS API TEST ===\n";
echo "Total records for status='all': $total\n\n";

// Now fetch actual listings
$select = "SELECT a.id, a.title, a.starting_price, COALESCE(a.current_price, 0) as current_bid, a.status, c.name as category_name, COALESCE(u.full_name, u.username) as seller_name";
$query = $select . ' ' . $baseQuery . " ORDER BY a.created_at DESC LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($query);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Listings fetched: " . count($rows) . "\n\n";

foreach ($rows as $row) {
    echo "ID: {$row['id']}, Title: {$row['title']}, Status: {$row['status']}\n";
}
