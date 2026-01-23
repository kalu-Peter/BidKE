<?php
require_once __DIR__ . '/../api/config/connect.php';

$pdo = Database::getInstance()->getConnection();

echo "=== ROLES TABLE STRUCTURE ===\n";
$stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roles'");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($columns as $col) {
    echo "{$col['column_name']}: {$col['data_type']}\n";
}

echo "\n=== ALL ROLES ===\n";
$stmt = $pdo->query("SELECT * FROM roles");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($roles as $role) {
    print_r($role);
}

echo "\n=== USER 7 ROLES WITH ROLE DETAILS ===\n";
$stmt = $pdo->prepare("
    SELECT ur.*, r.* 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = 7
");
$stmt->execute();
$user_roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($user_roles as $ur) {
    echo "User 7 has role: ";
    print_r($ur);
}
?>
