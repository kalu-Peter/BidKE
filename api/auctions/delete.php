<?php
// Delete auction endpoint - allows sellers to delete their draft/pending auctions

error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Content-Type: application/json");

// Ensure CORS headers are present
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: http://localhost:8081');
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

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get auction ID from URL path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$auctionId = end($pathParts);

if (!$auctionId || !is_numeric($auctionId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid auction ID']);
    exit();
}

try {
    // Require authentication
    $user = Auth::requireAuth();
    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    // Verify auction exists and ownership
    $checkStmt = $db->prepare("SELECT seller_id, status, title FROM auctions WHERE id = :id");
    $checkStmt->execute([':id' => $auctionId]);
    $auction = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$auction) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Auction not found']);
        exit();
    }

    $sellerId = (int)$auction['seller_id'];
    $userId = isset($user['user_id']) ? (int)$user['user_id'] : null;
    $userRole = $user['login_role'] ?? null;

    // Allow admins to delete any auction; sellers only their own
    if ($userRole !== 'admin' && $userId !== $sellerId) {
        $db->rollBack();
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You do not have permission to delete this auction']);
        exit();
    }

    // Only allow deletion of draft, pending, or cancelled auctions
    $allowedStatuses = ['draft', 'pending', 'cancelled'];
    if (!in_array($auction['status'], $allowedStatuses)) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot delete active or completed auctions']);
        exit();
    }

    // Get all image files to delete
    $imageStmt = $db->prepare("SELECT file_path, file_name FROM auction_files WHERE auction_id = :id AND file_type = 'image'");
    $imageStmt->execute([':id' => $auctionId]);
    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    // Delete related records first (foreign key constraints)
    $deleteQueries = [
        "DELETE FROM auction_files WHERE auction_id = :id",
        "DELETE FROM auction_images WHERE auction_id = :id",
        "DELETE FROM bids WHERE auction_id = :id",
        "DELETE FROM watchlist WHERE auction_id = :id",
        "DELETE FROM auction_winners WHERE auction_id = :id",
        "DELETE FROM auctions WHERE id = :id"
    ];

    foreach ($deleteQueries as $query) {
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $auctionId]);
    }

    // Delete physical image files
    foreach ($images as $image) {
        $filePath = '';
        if (!empty($image['file_path'])) {
            if (strpos($image['file_path'], '/') === 0) {
                $filePath = __DIR__ . '/../../' . ltrim($image['file_path'], '/');
            } else {
                $filePath = __DIR__ . '/../../uploads/' . $image['file_path'];
            }
        } else if (!empty($image['file_name'])) {
            $filePath = __DIR__ . '/../../uploads/' . $image['file_name'];
        }

        if ($filePath && file_exists($filePath)) {
            unlink($filePath);
        }
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Auction deleted successfully',
        'data' => ['auction_id' => $auctionId, 'title' => $auction['title']]
    ]);
} catch (Exception $e) {
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Auction delete error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error during deletion']);
}
