<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Add to watchlist
        $user_id = $input['user_id'] ?? null;
        $auction_id = $input['auction_id'] ?? null;

        if (!$user_id || !$auction_id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User ID and Auction ID are required'
            ]);
            exit;
        }

        // Check if already in watchlist
        $checkQuery = "SELECT id FROM watchlist WHERE user_id = :user_id AND auction_id = :auction_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([
            ':user_id' => $user_id,
            ':auction_id' => $auction_id
        ]);

        if ($checkStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'Item already in watchlist'
            ]);
            exit;
        }

        // Add to watchlist
        $insertQuery = "INSERT INTO watchlist (user_id, auction_id, created_at) VALUES (:user_id, :auction_id, NOW())";
        $insertStmt = $db->prepare($insertQuery);
        $success = $insertStmt->execute([
            ':user_id' => $user_id,
            ':auction_id' => $auction_id
        ]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Added to watchlist'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to add to watchlist'
            ]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Remove from watchlist
        $user_id = $input['user_id'] ?? null;
        $auction_id = $input['auction_id'] ?? null;

        if (!$user_id || !$auction_id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User ID and Auction ID are required'
            ]);
            exit;
        }

        $deleteQuery = "DELETE FROM watchlist WHERE user_id = :user_id AND auction_id = :auction_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $success = $deleteStmt->execute([
            ':user_id' => $user_id,
            ':auction_id' => $auction_id
        ]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Removed from watchlist'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to remove from watchlist'
            ]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get user's watchlist
        $user_id = $_GET['user_id'] ?? null;

        if (!$user_id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User ID is required'
            ]);
            exit;
        }

        $query = "
            SELECT 
                w.auction_id,
                a.title,
                a.current_bid,
                a.end_time,
                a.status,
                c.name as category_name
            FROM watchlist w
            JOIN auctions a ON w.auction_id = a.id
            JOIN categories c ON a.category_id = c.id
            WHERE w.user_id = :user_id
            ORDER BY w.created_at DESC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':user_id' => $user_id]);
        $watchlist = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $watchlist
        ]);

    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }

} catch (Exception $e) {
    error_log("Watchlist API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>