<?php
require_once __DIR__ . '/../api/config/connect.php';

// Get the first test user
$pdo = Database::getInstance()->getConnection();
$stmt = $pdo->query("SELECT id, username FROM users LIMIT 1");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "No users found in database\n";
    exit;
}

echo "=== LOGIN ENDPOINT RESPONSE TEST ===\n";
echo "Testing with user: " . $user['username'] . "\n\n";

// Note: We can't actually test the login without knowing the password
// But we can check what roles exist for this user

$roleStmt = $pdo->prepare("SELECT * FROM user_roles WHERE user_id = ?");
$roleStmt->execute([$user['id']]);
$roles = $roleStmt->fetchAll(PDO::FETCH_ASSOC);

echo "Roles for this user:\n";
foreach ($roles as $role) {
    print_r($role);
}

if (empty($roles)) {
    echo "WARNING: User has no roles!\n";
}
?>
