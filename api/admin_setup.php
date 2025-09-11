<!DOCTYPE html>
<html>
<head>
    <title>Admin User Setup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        pre { background: #f8f9fa; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Admin User Setup & Database Check</h1>
        
        <?php
        require_once 'config/connect.php';
        
        $message = '';
        $messageClass = '';
        
        if (isset($_POST['action'])) {
            try {
                $db = Database::getInstance();
                $pdo = $db->getConnection();
                
                if ($_POST['action'] === 'check') {
                    $message = checkDatabase($pdo);
                    $messageClass = 'success';
                } elseif ($_POST['action'] === 'create_admin') {
                    $message = createAdminUser($pdo);
                    $messageClass = 'success';
                } elseif ($_POST['action'] === 'create_roles') {
                    $message = createDefaultRoles($pdo);
                    $messageClass = 'success';
                }
            } catch (Exception $e) {
                $message = "Error: " . $e->getMessage();
                $messageClass = 'error';
            }
        }
        
        function checkDatabase($pdo) {
            $output = "<h3>Database Status:</h3>";
            
            // Check users
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
            $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $output .= "<p>Users: $userCount</p>";
            
            if ($userCount > 0) {
                $stmt = $pdo->query("SELECT id, username, email, role FROM users");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $output .= "<pre>" . print_r($users, true) . "</pre>";
            }
            
            // Check roles
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM roles");
            $roleCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $output .= "<p>Roles: $roleCount</p>";
            
            if ($roleCount > 0) {
                $stmt = $pdo->query("SELECT * FROM roles");
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $output .= "<pre>" . print_r($roles, true) . "</pre>";
            }
            
            // Check user_roles
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_roles");
            $userRoleCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $output .= "<p>User-Role Assignments: $userRoleCount</p>";
            
            if ($userRoleCount > 0) {
                $stmt = $pdo->query("SELECT ur.*, u.username, r.name as role_name FROM user_roles ur 
                                     LEFT JOIN users u ON ur.user_id = u.id 
                                     LEFT JOIN roles r ON ur.role_id = r.id");
                $userRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $output .= "<pre>" . print_r($userRoles, true) . "</pre>";
            }
            
            return $output;
        }
        
        function createDefaultRoles($pdo) {
            $roles = [
                ['admin', 'Administrator with full access'],
                ['buyer', 'Regular buyer user'],
                ['seller', 'Seller user']
            ];
            
            $created = 0;
            foreach ($roles as $role) {
                $stmt = $pdo->prepare("INSERT IGNORE INTO roles (name, description) VALUES (?, ?)");
                if ($stmt->execute($role)) {
                    $created++;
                }
            }
            
            return "Created $created default roles.";
        }
        
        function createAdminUser($pdo) {
            // First, delete existing admin user if exists
            $stmt = $pdo->prepare("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username = ? OR email = ?)");
            $stmt->execute(['pique', 'lyon@admin.com']);
            
            $stmt = $pdo->prepare("DELETE FROM buyer_profiles WHERE user_id IN (SELECT id FROM users WHERE username = ? OR email = ?)");
            $stmt->execute(['pique', 'lyon@admin.com']);
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE username = ? OR email = ?");
            $stmt->execute(['pique', 'lyon@admin.com']);
            
            // Create admin user afresh
            $hashedPassword = password_hash('@Pique123', PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role, phone, is_verified, created_at) 
                                   VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $result = $stmt->execute([
                'pique',
                'lyon@admin.com',
                $hashedPassword,
                'admin',
                '0721425722',
                1
            ]);
            
            if (!$result) {
                return "Failed to create admin user!";
            }
            
            $userId = $pdo->lastInsertId();
            
            // Get role IDs
            $adminRoleStmt = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
            $adminRoleStmt->execute(['admin']);
            $adminRole = $adminRoleStmt->fetch(PDO::FETCH_ASSOC);
            
            $buyerRoleStmt = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
            $buyerRoleStmt->execute(['buyer']);
            $buyerRole = $buyerRoleStmt->fetch(PDO::FETCH_ASSOC);
            
            // Assign roles
            if ($adminRole) {
                $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())");
                $stmt->execute([$userId, $adminRole['id']]);
            }
            
            if ($buyerRole) {
                $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())");
                $stmt->execute([$userId, $buyerRole['id']]);
            }
            
            // Create buyer profile
            $stmt = $pdo->prepare("INSERT INTO buyer_profiles (user_id, first_name, last_name, date_of_birth, location, preferred_categories, preferred_payment_methods, created_at) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $userId,
                'Pique',
                'Lyon',
                '1990-01-01',
                'Nairobi, Kenya',
                '{electronics,cars}',
                '{mobile_money,bank_transfer}'
            ]);
            
            return "Admin user created successfully! User ID: $userId";
        }
        ?>
        
        <?php if ($message): ?>
            <div class="section <?php echo $messageClass; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>
        
        <div class="section">
            <h3>Actions:</h3>
            <form method="post" style="display: inline;">
                <input type="hidden" name="action" value="check">
                <button type="submit">Check Database Status</button>
            </form>
            
            <form method="post" style="display: inline; margin-left: 10px;">
                <input type="hidden" name="action" value="create_roles">
                <button type="submit">Create Default Roles</button>
            </form>
            
            <form method="post" style="display: inline; margin-left: 10px;">
                <input type="hidden" name="action" value="create_admin">
                <button type="submit">Create Admin User</button>
            </form>
        </div>
        
        <div class="section">
            <h3>Admin User Details:</h3>
            <ul>
                <li><strong>Username:</strong> pique</li>
                <li><strong>Email:</strong> lyon@admin.com</li>
                <li><strong>Password:</strong> @Pique123</li>
                <li><strong>Phone:</strong> 0721425722</li>
                <li><strong>Roles:</strong> admin, buyer</li>
            </ul>
        </div>
    </div>
</body>
</html>
