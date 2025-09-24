<?php
// Auction update endpoint (seller-side) - supports updating drafts and submitting for review

error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Content-Type: application/json");

require_once '../config/connect.php';

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
    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    // For demo, assume seller_id is verified elsewhere; here we just perform update
    $fields = [];
    $params = [];

    // Allowed updatable fields
    $allowed = ['title','description','startingPrice','reservePrice','start_time','end_time','status','auctionStartDate','auctionStartTime','auctionEndDate','auctionEndTime'];

    foreach ($allowed as $f) {
        if (isset($input[$f])) {
            // Map camelCase to DB columns
            $col = $f;
            switch ($f) {
                case 'startingPrice': $col = 'starting_price'; break;
                case 'reservePrice': $col = 'reserve_price'; break;
                case 'start_time': $col = 'start_time'; break;
                case 'end_time': $col = 'end_time'; break;
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
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error during update']);
}

?>