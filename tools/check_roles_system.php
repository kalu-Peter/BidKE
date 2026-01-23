<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

echo "=== ALL ROLES IN SYSTEM ===\n";
$stmt = $pdo->query("SELECT id, name, display_name FROM roles ORDER BY id");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($roles as $role) {
    echo "ID: {$role['id']}, Name: {$role['name']}, Display: {$role['display_name']}\n";
}

echo "\n=== USER ROLES DETAIL ===\n";
$stmt = $pdo->query("
    SELECT ur.user_id, u.username, r.name as role_name, ur.is_primary
    FROM user_roles ur
    JOIN users u ON ur.user_id = u.id
    JOIN roles r ON ur.role_id = r.id
    LIMIT 20
");
$user_roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($user_roles as $ur) {
    echo "User: {$ur['username']} (ID: {$ur['user_id']}), Role: {$ur['role_name']}, Primary: " . ($ur['is_primary'] ? 'YES' : 'NO') . "\n";
}
?>
