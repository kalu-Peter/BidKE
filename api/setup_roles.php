<?php
require_once 'config/connect.php';

$db = Database::getInstance();
$pdo = $db->getConnection();

try {
    // Create roles table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "Roles table created/verified\n";
    
    // Create user_roles table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_roles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, role_id)
        )
    ");
    echo "User_roles table created/verified\n";
    
    // Insert default roles
    $defaultRoles = [
        ['admin', 'Administrator role with full system access'],
        ['buyer', 'Buyer role for auction participants'],
        ['seller', 'Seller role for auction creators']
    ];
    
    foreach ($defaultRoles as $role) {
        $stmt = $pdo->prepare("INSERT INTO roles (name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING");
        $stmt->execute($role);
    }
    echo "Default roles inserted\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
