<?php
require_once __DIR__ . '/../config/connect.php';

// Ensure only admins can access this endpoint in production - for now we allow access for dev
// Query params: ?limit=50&offset=0&search=foo&role=buyer&status=pending

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    // role filtering requires joining the roles table; omitted for now
    $role = isset($_GET['role']) ? trim($_GET['role']) : null; // buyer, seller, admin (ignored)
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;

    // Base query
    $where = [];
    $params = [];

    if ($search) {
        $where[] = "(username ILIKE :s OR email ILIKE :s OR full_name ILIKE :s)";
        $params[':s'] = '%' . $search . '%';
    }

    // NOTE: role filtering is not supported in this simple endpoint because roles
    // are stored in a separate table (user_roles). If needed, implement a JOIN
    // to filter by role. For now, ignore the role param.

    if ($status) {
        $where[] = "status = :status";
        $params[':status'] = $status;
    }

    $whereSql = '';
    if (count($where) > 0) {
        $whereSql = 'WHERE ' . implode(' AND ', $where);
    }

    // Count total
    $countSql = "SELECT COUNT(*) as total FROM users $whereSql";
    $countStmt = $conn->prepare($countSql);
    foreach ($params as $k => $v) $countStmt->bindValue($k, $v);
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    // Fetch page
    $sql = "SELECT id, username, email, phone, status, is_verified, created_at, full_name FROM users $whereSql ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $conn->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'users' => $rows
    ];

    sendSuccess($response);
} catch (Exception $e) {
    error_log('admin/users.php error: ' . $e->getMessage());
    sendError('Failed to fetch users', 500, $e->getMessage());
}
