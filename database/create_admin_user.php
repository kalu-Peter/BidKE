<?php
/**
 * Create Admin User Script
 * Inserts an admin user (peter@admin.com) into the database and assigns the 'admin' role.
 */

require_once __DIR__ . '/../api/config/connect.php';

$username = 'peteradmin';
$email = 'peter@admin.com';
$password = 'peter123';
$phone = '+254700000099';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Start transaction
    $conn->beginTransaction();

    // Check if user already exists by email
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $userId = $existing['id'];
        echo "User already exists with id: $userId\n";
    } else {
        // Hash password using PHP password_hash
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $ins = $conn->prepare('INSERT INTO users (username, email, phone, password_hash, status, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) RETURNING id');
        $status = 'active';
        $is_verified = true;
        $ins->execute([$username, $email, $phone, $passwordHash, $status, $is_verified]);
        $userId = $ins->fetch()['id'];
        echo "Inserted user id: $userId\n";
    }

    // Ensure admin role exists
    $roleStmt = $conn->prepare('SELECT id FROM roles WHERE role_name = ?');
    $roleStmt->execute(['admin']);
    $role = $roleStmt->fetch();

    if (!$role) {
        $conn->exec("INSERT INTO roles (role_name, display_name, description) VALUES ('admin','Administrator','System administrator')");
        $roleId = $conn->lastInsertId('roles_id_seq');
        echo "Created admin role id: $roleId\n";
    } else {
        $roleId = $role['id'];
        echo "Admin role exists id: $roleId\n";
    }

    // Assign admin role in user_roles if not assigned
    $urStmt = $conn->prepare('SELECT id FROM user_roles WHERE user_id = ? AND role_id = ? AND is_active = TRUE');
    $urStmt->execute([$userId, $roleId]);
    $ur = $urStmt->fetch();

    if ($ur) {
        echo "User already has admin role (user_roles id: {$ur['id']}).\n";
    } else {
        // Use integers for boolean values to avoid PDO boolean binding issues with Postgres
        $assign = $conn->prepare('INSERT INTO user_roles (user_id, role_id, is_primary, is_active, role_status, applied_at, created_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
        $assign->execute([$userId, $roleId, 0, 1, 'active']);
        echo "Assigned admin role to user id $userId\n";
    }

    $conn->commit();
    echo "Admin user setup complete.\n";

} catch (Exception $e) {
    if ($conn && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

?>
