<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

echo "=== ROLES TABLE STRUCTURE ===\n";
$stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roles' ORDER BY ordinal_position");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['column_name']}: {$col['data_type']}\n";
}

echo "\n=== ALL ROLES ===\n";
$stmt = $pdo->query("SELECT * FROM roles");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($roles as $role) {
    echo "ID: {$role['id']}, Role Name: {$role['role_name']}, Display: {$role['display_name']}\n";
}

echo "\n=== USERS WITH THEIR PRIMARY ROLES ===\n";
$stmt = $pdo->query("
    SELECT u.id, u.username, r.role_name
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
    LEFT JOIN roles r ON ur.role_id = r.id
    LIMIT 10
");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($data as $row) {
    echo "User: {$row['username']} (ID: {$row['id']}), Primary Role: " . ($row['role_name'] ?: 'NONE') . "\n";
}
?>
