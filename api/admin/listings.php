<?php
header('Content-Type: application/json');

// Allow both development ports
$allowed_origins = ['http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

// Create auction_files table if it doesn't exist
function ensureAuctionFilesTable() {
    try {
        $pdo = getDBConnection();
        $sql = "
            CREATE TABLE IF NOT EXISTS auction_files (
                id SERIAL PRIMARY KEY,
                auction_id INTEGER NOT NULL,
                file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'document')),
                original_name VARCHAR(255) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
            )
        ";
        $pdo->exec($sql);
        
        // Create index for faster queries
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auction_files_auction_id ON auction_files(auction_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auction_files_type ON auction_files(file_type)");
        
    } catch (Exception $e) {
        error_log("Failed to create auction_files table: " . $e->getMessage());
    }
}

// Create audit and notification tables
function ensureAuditAndNotificationTables() {
    try {
        $pdo = getDBConnection();
        
        // Create audit_logs table
        $auditSql = "
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
        $pdo->exec($auditSql);
        
        // Create notifications table
        $notifSql = "
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
        $pdo->exec($notifSql);
        
        // Create indexes
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)");
        
    } catch (Exception $e) {
        error_log("Failed to create audit/notification tables: " . $e->getMessage());
    }
}

// Get admin listings with filtering
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        ensureAuctionFilesTable(); // Ensure table exists
        ensureAuditAndNotificationTables(); // Ensure audit tables exist
        $pdo = getDBConnection();
        
        // Get query parameters
        $status = $_GET['status'] ?? 'all';
        $category = $_GET['category'] ?? 'all';
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        
        // Build query
        $baseQuery = "
            SELECT 
                a.id, a.title, a.description, a.starting_price, a.reserve_price,
                a.current_bid, a.start_time, a.end_time, a.status, a.featured,
                a.view_count, a.bid_count, a.created_at, a.updated_at,
                u.fullname as seller_name, u.email as seller_email, u.phone as seller_phone,
                c.name as category_name, c.slug as category_slug,
                CASE 
                    WHEN v.id IS NOT NULL THEN 'vehicle'
                    WHEN e.id IS NOT NULL THEN 'electronics'
                    ELSE 'other'
                END as item_type,
                COALESCE(v.make, e.brand) as make_brand,
                COALESCE(v.model, e.model) as model,
                COALESCE(v.year, null) as year,
                COALESCE(v.condition, e.condition) as item_condition,
                COALESCE(v.location, e.location) as location,
                v.mileage, v.fuel_type, v.transmission, v.color, v.registration_number,
                e.specs, e.warranty, e.serial_number
            FROM auctions a
            LEFT JOIN users u ON a.seller_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN vehicles v ON a.id = v.auction_id
            LEFT JOIN electronics e ON a.id = e.auction_id
        ";
        
        $conditions = [];
        $params = [];
        
        // Status filter
        if ($status !== 'all') {
            $conditions[] = "a.status = :status";
            $params['status'] = $status;
        }
        
        // Category filter
        if ($category !== 'all') {
            $conditions[] = "c.slug = :category";
            $params['category'] = $category;
        }
        
        // Search filter
        if (!empty($search)) {
            $conditions[] = "(
                a.title ILIKE :search OR 
                a.description ILIKE :search OR 
                u.fullname ILIKE :search OR
                COALESCE(v.make, e.brand) ILIKE :search OR
                COALESCE(v.model, e.model) ILIKE :search
            )";
            $params['search'] = '%' . $search . '%';
        }
        
        // Build WHERE clause
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }
        
        // Count total records
        $countQuery = "SELECT COUNT(*) as total FROM ($baseQuery $whereClause) as subquery";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get listings with pagination
        $query = "$baseQuery $whereClause ORDER BY a.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($query);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $listings = $stmt->fetchAll();
        
        // Get statistics
        $statsQuery = "
            SELECT 
                status,
                COUNT(*) as count
            FROM auctions 
            GROUP BY status
        ";
        $statsStmt = $pdo->query($statsQuery);
        $statsData = $statsStmt->fetchAll();
        
        $stats = [
            'total' => $total,
            'draft' => 0,
            'pending_review' => 0,
            'needs_info' => 0,
            'approved' => 0,
            'live' => 0,
            'ended' => 0,
            'rejected' => 0
        ];
        
        foreach ($statsData as $stat) {
            $status = $stat['status'] ?? 'draft';
            $stats[$status] = (int)$stat['count'];
            if ($status === 'draft') {
                $stats['pending_review'] = (int)$stat['count'];
            }
        }
        
        // Format listings
        foreach ($listings as &$listing) {
            // Get actual images and documents
            try {
                $filesQuery = "SELECT file_type, file_name, file_path, original_name FROM auction_files WHERE auction_id = :auction_id ORDER BY uploaded_at ASC";
                $filesStmt = $pdo->prepare($filesQuery);
                $filesStmt->execute(['auction_id' => $listing['id']]);
                $files = $filesStmt->fetchAll();
                
                $listing['images'] = [];
                $listing['documents'] = [];
                
                foreach ($files as $file) {
                    $fileData = [
                        'name' => $file['original_name'],
                        'url' => 'http://localhost:8000/' . $file['file_path']
                    ];
                    
                    if ($file['file_type'] === 'image') {
                        $listing['images'][] = $fileData;
                    } else {
                        $listing['documents'][] = $fileData;
                    }
                }
            } catch (Exception $e) {
                // If table doesn't exist yet, use empty arrays
                $listing['images'] = [];
                $listing['documents'] = [];
                error_log("Error fetching auction files: " . $e->getMessage());
            }
            
            $listing['verification_status'] = 'documents_uploaded'; // TODO: Implement verification logic
            
            // Format prices
            $listing['starting_price'] = (float)$listing['starting_price'];
            $listing['reserve_price'] = $listing['reserve_price'] ? (float)$listing['reserve_price'] : null;
            $listing['current_bid'] = (float)$listing['current_bid'];
            
            // Format dates
            $listing['start_time'] = date('Y-m-d H:i:s', strtotime($listing['start_time']));
            $listing['end_time'] = date('Y-m-d H:i:s', strtotime($listing['end_time']));
            $listing['created_at'] = date('Y-m-d H:i:s', strtotime($listing['created_at']));
            
            // Calculate auction duration in days
            $start = new DateTime($listing['start_time']);
            $end = new DateTime($listing['end_time']);
            $listing['auction_duration'] = $start->diff($end)->days;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $listings,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ],
            'stats' => $stats
        ]);
        
    } catch (Exception $e) {
        error_log("Admin listings fetch error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch listings']);
    }
}
// Update auction status (approve, reject, request info)
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $auctionId = $input['auction_id'] ?? null;
        $action = $input['action'] ?? null; // 'approve', 'reject', 'request_info'
        $reason = $input['reason'] ?? '';
        $message = $input['message'] ?? '';
        $adminId = $input['admin_id'] ?? 1; // TODO: Get from authentication
        $adminName = $input['admin_name'] ?? 'Admin User';
        
        if (!$auctionId || !$action) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
            exit();
        }
        
        $pdo = getDBConnection();
        $pdo->beginTransaction();
        
        // Get current auction with seller info
        $stmt = $pdo->prepare("
            SELECT a.*, u.id as seller_id, u.fullname as seller_name, u.email as seller_email 
            FROM auctions a 
            LEFT JOIN users u ON a.seller_id = u.id 
            WHERE a.id = :id
        ");
        $stmt->execute(['id' => $auctionId]);
        $auction = $stmt->fetch();
        
        if (!$auction) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Auction not found']);
            exit();
        }
        
        $oldStatus = $auction['status'];
        $newStatus = '';
        $updateData = ['updated_at' => date('Y-m-d H:i:s')];
        $notificationTitle = '';
        $notificationMessage = '';
        $notificationType = '';
        
        switch ($action) {
            case 'approve':
                $newStatus = 'approved';
                $notificationTitle = 'Auction Approved';
                $notificationMessage = "Your auction '{$auction['title']}' has been approved by our admin team.";
                $notificationType = 'auction_approved';
                break;
                
            case 'reject':
                $newStatus = 'rejected';
                if (empty($reason)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Rejection reason is required']);
                    exit();
                }
                $notificationTitle = 'Auction Rejected';
                $notificationMessage = "Your auction '{$auction['title']}' has been rejected. Reason: {$reason}";
                $notificationType = 'auction_rejected';
                break;
                
            case 'request_info':
                $newStatus = 'needs_info';
                if (empty($message)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Info request message is required']);
                    exit();
                }
                $notificationTitle = 'Additional Information Required';
                $notificationMessage = "Additional information is required for your auction '{$auction['title']}'. {$message}";
                $notificationType = 'auction_info_requested';
                break;
                
            case 'make_live':
                $newStatus = 'live';
                $notificationTitle = 'Auction is Now Live';
                $notificationMessage = "Your auction '{$auction['title']}' is now live and accepting bids!";
                $notificationType = 'auction_live';
                break;
                
            default:
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
                exit();
        }
        
        // Update auction status
        $updateQuery = "UPDATE auctions SET status = :status, updated_at = :updated_at WHERE id = :id";
        $stmt = $pdo->prepare($updateQuery);
        $stmt->execute([
            'status' => $newStatus,
            'updated_at' => $updateData['updated_at'],
            'id' => $auctionId
        ]);
        
        // Create audit log
        $auditData = [
            'action_type' => $action,
            'resource_type' => 'auction',
            'resource_id' => $auctionId,
            'admin_id' => $adminId,
            'admin_name' => $adminName,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
            'reason' => $reason ?: $message,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];
        
        try {
            $auditStmt = $pdo->prepare("
                INSERT INTO audit_logs (action_type, resource_type, resource_id, admin_id, admin_name, old_values, new_values, reason, ip_address, user_agent)
                VALUES (:action_type, :resource_type, :resource_id, :admin_id, :admin_name, :old_values, :new_values, :reason, :ip_address, :user_agent)
            ");
            
            $auditStmt->execute([
                'action_type' => $auditData['action_type'],
                'resource_type' => $auditData['resource_type'],
                'resource_id' => $auditData['resource_id'],
                'admin_id' => $auditData['admin_id'],
                'admin_name' => $auditData['admin_name'],
                'old_values' => json_encode($auditData['old_values']),
                'new_values' => json_encode($auditData['new_values']),
                'reason' => $auditData['reason'],
                'ip_address' => $auditData['ip_address'],
                'user_agent' => $auditData['user_agent']
            ]);
        } catch (Exception $e) {
            // Log audit creation failure but don't fail the main operation
            error_log("Failed to create audit log: " . $e->getMessage());
        }
        
        // Send notification to seller
        if ($auction['seller_id']) {
            try {
                $notifStmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, type, title, message, data)
                    VALUES (:user_id, :type, :title, :message, :data)
                ");
                
                $notifStmt->execute([
                    'user_id' => $auction['seller_id'],
                    'type' => $notificationType,
                    'title' => $notificationTitle,
                    'message' => $notificationMessage,
                    'data' => json_encode([
                        'auction_id' => $auctionId,
                        'action' => $action,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'admin_name' => $adminName,
                        'timestamp' => date('Y-m-d H:i:s')
                    ])
                ]);
            } catch (Exception $e) {
                // Log notification failure but don't fail the main operation
                error_log("Failed to send notification: " . $e->getMessage());
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Auction $action completed successfully",
            'data' => [
                'auction_id' => $auctionId,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'action' => $action,
                'notification_sent' => !empty($auction['seller_id'])
            ]
        ]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Admin action error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update auction status']);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
