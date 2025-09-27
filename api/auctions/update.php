<?php
// Auction update endpoint (seller-side) - supports updating drafts and submitting for review

error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Content-Type: application/json");

// Ensure CORS headers are present for this endpoint even if connect.php isn't processed
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: http://localhost:8080');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once '../config/connect.php';
require_once '../models/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit();
}

$auctionId = $input['auction_id'] ?? null;
if (!$auctionId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing auction_id']);
    exit();
}

try {
    // Debug: log incoming request context (development only)
    error_log('--- update.php request start ---');
    error_log('Request URI: ' . ($_SERVER['REQUEST_URI'] ?? ''));
    error_log('Request Method: ' . ($_SERVER['REQUEST_METHOD'] ?? ''));
    error_log('Request Headers: ' . json_encode(getallheaders()));
    error_log('Request Body: ' . json_encode($input));

    // Require authentication and ensure user is seller or admin
    $user = Auth::requireAuth();
    error_log('Authenticated user payload: ' . json_encode($user));

    // Also write development debug info to a project-local log file for easier inspection
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/update_debug.log';
    $logEntry = date('[Y-m-d H:i:s] ') . "REQUEST: " . ($_SERVER['REQUEST_METHOD'] ?? '') . " " . ($_SERVER['REQUEST_URI'] ?? '') . "\n";
    $logEntry .= "HEADERS: " . json_encode(getallheaders()) . "\n";
    $logEntry .= "BODY: " . json_encode($input) . "\n";
    $logEntry .= "USER: " . json_encode($user) . "\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    // Verify auction ownership unless admin
    try {
        $ownerStmt = $db->prepare("SELECT seller_id FROM auctions WHERE id = :id");
        $ownerStmt->execute([':id' => $auctionId]);
        $ownerRow = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        if (!$ownerRow) {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Auction not found']);
            exit();
        }

        $sellerId = (int)$ownerRow['seller_id'];
        $userId = isset($user['user_id']) ? (int)$user['user_id'] : null;
        $userRole = $user['login_role'] ?? null;

        // Allow admins to update any auction; sellers only their own
        if ($userRole !== 'admin' && $userId !== $sellerId) {
            $db->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden: you do not own this auction']);
            exit();
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) $db->rollBack();
        error_log('Ownership check error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error during ownership check']);
        exit();
    }

    // For demo, proceed to perform update
    $fields = [];
    $params = [];

    // Allowed updatable fields
    $allowed = ['title', 'description', 'startingPrice', 'reservePrice', 'start_time', 'end_time', 'status', 'auctionStartDate', 'auctionStartTime', 'auctionEndDate', 'auctionEndTime'];

    // Status mappings/validation to avoid DB constraint violations
    $allowedStatuses = ['draft', 'pending', 'active', 'ended', 'cancelled', 'sold'];
    if (isset($input['status'])) {
        // Normalize status values coming from the client
        $rawStatus = trim($input['status']);
        $statusMap = [
            'pending_review' => 'pending',
            'submitted' => 'pending',
            // add other mappings if the UI uses different identifiers
        ];

        $mappedStatus = $statusMap[$rawStatus] ?? $rawStatus;

        if (!in_array($mappedStatus, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status value']);
            exit();
        }

        // Ensure we update the DB with the mapped status
        $input['status'] = $mappedStatus;
    }

    foreach ($allowed as $f) {
        if (isset($input[$f])) {
            // Map camelCase to DB columns
            $col = $f;
            switch ($f) {
                case 'startingPrice':
                    $col = 'starting_price';
                    break;
                case 'reservePrice':
                    $col = 'reserve_price';
                    break;
                case 'start_time':
                    $col = 'start_time';
                    break;
                case 'end_time':
                    $col = 'end_time';
                    break;
            }
            $fields[] = "$col = :$col";
            $params[$col] = $input[$f];
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No updatable fields provided']);
        exit();
    }

    $params['id'] = $auctionId;
    $updateSql = "UPDATE auctions SET " . implode(', ', $fields) . ", updated_at = :updated_at WHERE id = :id";
    $params['updated_at'] = date('Y-m-d H:i:s');

    $stmt = $db->prepare($updateSql);
    if (!$stmt->execute($params)) {
        $err = $stmt->errorInfo();
        $db->rollBack();
        error_log('Auction update failed: ' . json_encode($err));
        // Append DB error to project log for easier debugging
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        $logFile = $logDir . '/update_debug.log';
        $entry = date('[Y-m-d H:i:s] ') . "DB ERROR: " . json_encode($err) . "\n";
        @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update auction', 'details' => $err]);
        exit();
    }

    // If images provided, insert into auction_files
    if (!empty($input['images']) && is_array($input['images'])) {
        foreach ($input['images'] as $img) {
            $fileSql = "INSERT INTO auction_files (auction_id, file_type, original_name, file_name, file_path, file_size, mime_type) VALUES (:auction_id, 'image', :original_name, :file_name, :file_path, :file_size, :mime_type)";
            $fileStmt = $db->prepare($fileSql);
            $fileStmt->execute([
                ':auction_id' => $auctionId,
                ':original_name' => $img['alt_text'] ?? basename($img['url'] ?? ''),
                ':file_name' => basename($img['url'] ?? ''),
                ':file_path' => $img['url'] ?? '',
                ':file_size' => null,
                ':mime_type' => null
            ]);
        }
    }

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Auction updated', 'data' => ['auction_id' => $auctionId]]);
} catch (Exception $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    error_log('Auction update error: ' . $e->getMessage());
    // Also write exception trace to project log
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/update_debug.log';
    $entry = date('[Y-m-d H:i:s] ') . "EXCEPTION: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
    @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error during update']);
}
