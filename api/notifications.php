<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

// Get notifications for a user
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $userId = $_GET['user_id'] ?? null;
        $isRead = $_GET['is_read'] ?? null; // null for all, 'true'/'false' for filtered
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = (int)($_GET['offset'] ?? 0);
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        $query = "SELECT * FROM notifications WHERE user_id = :user_id";
        $params = ['user_id' => $userId];
        
        if ($isRead !== null) {
            $query .= " AND is_read = :is_read";
            $params['is_read'] = $isRead === 'true' ? true : false;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $notifications = $stmt->fetchAll();
        
        // Format data field
        foreach ($notifications as &$notification) {
            if ($notification['data']) {
                $notification['data'] = json_decode($notification['data'], true);
            }
            $notification['is_read'] = (bool)$notification['is_read'];
        }
        
        // Get unread count
        $unreadStmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND is_read = false");
        $unreadStmt->execute(['user_id' => $userId]);
        $unreadCount = $unreadStmt->fetch()['count'];
        
        echo json_encode([
            'success' => true,
            'data' => $notifications,
            'unread_count' => (int)$unreadCount
        ]);
        
    } catch (Exception $e) {
        error_log("Get notifications error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch notifications']);
    }
}
// Mark notifications as read
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        $notificationIds = $input['notification_ids'] ?? []; // Array of IDs to mark as read
        $markAll = $input['mark_all'] ?? false; // Mark all as read
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        if ($markAll) {
            // Mark all notifications as read for this user
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = true WHERE user_id = :user_id AND is_read = false");
            $stmt->execute(['user_id' => $userId]);
            $updated = $stmt->rowCount();
        } else {
            // Mark specific notifications as read
            if (empty($notificationIds)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No notification IDs provided']);
                exit();
            }
            
            $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
            $query = "UPDATE notifications SET is_read = true WHERE user_id = ? AND id IN ($placeholders) AND is_read = false";
            
            $stmt = $pdo->prepare($query);
            $params = array_merge([$userId], $notificationIds);
            $stmt->execute($params);
            $updated = $stmt->rowCount();
        }
        
        echo json_encode([
            'success' => true,
            'message' => "$updated notifications marked as read",
            'updated_count' => $updated
        ]);
        
    } catch (Exception $e) {
        error_log("Mark notifications read error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update notifications']);
    }
}
// Send new notification (for testing or system use)
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        $type = $input['type'] ?? 'general';
        $title = $input['title'] ?? 'Notification';
        $message = $input['message'] ?? '';
        $data = $input['data'] ?? null;
        
        if (!$userId || !$message) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID and message are required']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (:user_id, :type, :title, :message, :data)
            RETURNING id
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data ? json_encode($data) : null
        ]);
        
        $notificationId = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'message' => 'Notification sent successfully',
            'notification_id' => $notificationId
        ]);
        
    } catch (Exception $e) {
        error_log("Send notification error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send notification']);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
