<?php
header('Content-Type: application/json');

// Allow both development ports
$allowed_origins = ['http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
function getDBConnection() {
    try {
        $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
        $connection = new PDO($dsn, 'postgres', 'webwiz', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        return $connection;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit();
    }
}

// Create audit_logs table if it doesn't exist
function createAuditLogTable() {
    try {
        $pdo = getDBConnection();
        $sql = "
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                action_type VARCHAR(50) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id INTEGER NOT NULL,
                admin_id INTEGER,
                admin_name VARCHAR(255),
                old_values JSONB,
                new_values JSONB,
                reason TEXT,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ";
        $pdo->exec($sql);
        
        // Create indexes for better performance
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)");
        
    } catch (Exception $e) {
        error_log("Failed to create audit_logs table: " . $e->getMessage());
    }
}

// Create notifications table if it doesn't exist
function createNotificationsTable() {
    try {
        $pdo = getDBConnection();
        $sql = "
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data JSONB,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ";
        $pdo->exec($sql);
        
        // Create indexes
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)");
        
    } catch (Exception $e) {
        error_log("Failed to create notifications table: " . $e->getMessage());
    }
}

// Log admin action
function logAdminAction($actionType, $resourceType, $resourceId, $adminId, $adminName, $oldValues = null, $newValues = null, $reason = null) {
    try {
        $pdo = getDBConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (action_type, resource_type, resource_id, admin_id, admin_name, old_values, new_values, reason, ip_address, user_agent)
            VALUES (:action_type, :resource_type, :resource_id, :admin_id, :admin_name, :old_values, :new_values, :reason, :ip_address, :user_agent)
        ");
        
        $stmt->execute([
            'action_type' => $actionType,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'admin_id' => $adminId,
            'admin_name' => $adminName,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'reason' => $reason,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        return true;
    } catch (Exception $e) {
        error_log("Failed to log admin action: " . $e->getMessage());
        return false;
    }
}

// Send notification to user
function sendNotification($userId, $type, $title, $message, $data = null) {
    try {
        $pdo = getDBConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (:user_id, :type, :title, :message, :data)
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data ? json_encode($data) : null
        ]);
        
        return true;
    } catch (Exception $e) {
        error_log("Failed to send notification: " . $e->getMessage());
        return false;
    }
}

// Initialize tables
createAuditLogTable();
createNotificationsTable();

// Get audit logs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $resourceType = $_GET['resource_type'] ?? null;
        $resourceId = $_GET['resource_id'] ?? null;
        $adminId = $_GET['admin_id'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $pdo = getDBConnection();
        
        $query = "SELECT * FROM audit_logs WHERE 1=1";
        $params = [];
        
        if ($resourceType) {
            $query .= " AND resource_type = :resource_type";
            $params['resource_type'] = $resourceType;
        }
        
        if ($resourceId) {
            $query .= " AND resource_id = :resource_id";
            $params['resource_id'] = $resourceId;
        }
        
        if ($adminId) {
            $query .= " AND admin_id = :admin_id";
            $params['admin_id'] = $adminId;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $logs = $stmt->fetchAll();
        
        // Format JSON fields
        foreach ($logs as &$log) {
            if ($log['old_values']) {
                $log['old_values'] = json_decode($log['old_values'], true);
            }
            if ($log['new_values']) {
                $log['new_values'] = json_decode($log['new_values'], true);
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $logs
        ]);
        
    } catch (Exception $e) {
        error_log("Get audit logs error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch audit logs']);
    }
}
// Create audit log entry
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $actionType = $input['action_type'] ?? null;
        $resourceType = $input['resource_type'] ?? null;
        $resourceId = $input['resource_id'] ?? null;
        $adminId = $input['admin_id'] ?? 1; // TODO: Get from authentication
        $adminName = $input['admin_name'] ?? 'Admin';
        $oldValues = $input['old_values'] ?? null;
        $newValues = $input['new_values'] ?? null;
        $reason = $input['reason'] ?? null;
        
        if (!$actionType || !$resourceType || !$resourceId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit();
        }
        
        $success = logAdminAction($actionType, $resourceType, $resourceId, $adminId, $adminName, $oldValues, $newValues, $reason);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Audit log created successfully'
            ]);
        } else {
            throw new Exception('Failed to create audit log');
        }
        
    } catch (Exception $e) {
        error_log("Create audit log error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create audit log']);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
