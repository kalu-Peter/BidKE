<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

// Test the exact query from auctions.php endpoint
$status = 'live';
$conditions = [];

if ($status === 'live') {
    $conditions[] = "(a.status = 'approved' OR a.status = 'live' OR a.status = 'active') AND a.start_time <= NOW() AND a.end_time > NOW()";
}

$baseQuery = "
    FROM auctions a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.seller_id = u.id
    WHERE 1=1
";

if (!empty($conditions)) {
    $baseQuery .= " AND " . implode(" AND ", $conditions);
}

$query = "SELECT a.id, a.title, a.status, a.start_time, a.end_time " . $baseQuery;

$stmt = $pdo->prepare($query);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== BROWSE AUCTIONS QUERY RESULTS ===\n";
echo "Total returned: " . count($rows) . "\n\n";

foreach ($rows as $row) {
    echo "ID: {$row['id']}, Title: {$row['title']}, Status: {$row['status']}\n";
}
