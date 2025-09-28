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

require_once 'config/connect.php';

// Start session if not started so we can use server-side auth when available
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // NOTE: Table creation/migrations should be handled via migration scripts in production.
    // The migration SQL for creating the watchlist table is at: database/migrations/create_watchlist_table.sql

    $input = json_decode(file_get_contents('php://input'), true);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Add to watchlist
        // Prefer server-side session user id when available
        $user_id = $_SESSION['user_id'] ?? $input['user_id'] ?? null;
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
        $checkQuery = "SELECT id, created_at FROM watchlist WHERE user_id = :user_id AND auction_id = :auction_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([
            ':user_id' => $user_id,
            ':auction_id' => $auction_id
        ]);

        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        // Toggle behavior: if client passed toggle=true, then remove if exists, else insert
        $isToggle = isset($input['toggle']) && $input['toggle'];

        if ($isToggle) {
            if ($existing) {
                // remove
                $deleteQuery = "DELETE FROM watchlist WHERE user_id = :user_id AND auction_id = :auction_id";
                $deleteStmt = $db->prepare($deleteQuery);
                $deleted = $deleteStmt->execute([
                    ':user_id' => $user_id,
                    ':auction_id' => $auction_id
                ]);

                if ($deleted) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Removed from watchlist',
                        'data' => ['auction_id' => (int)$auction_id, 'watched' => false]
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to remove from watchlist']);
                }
                exit;
            } else {
                // insert
                $insertQuery = "INSERT INTO watchlist (user_id, auction_id, created_at) VALUES (:user_id, :auction_id, NOW())";
                $insertStmt = $db->prepare($insertQuery);
                $inserted = $insertStmt->execute([
                    ':user_id' => $user_id,
                    ':auction_id' => $auction_id
                ]);

                if ($inserted) {
                    echo json_encode(['success' => true, 'message' => 'Added to watchlist', 'data' => ['auction_id' => (int)$auction_id, 'watched' => true]]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to add to watchlist']);
                }
                exit;
            }
        }

        // Fallback to explicit insert behavior when not toggling
        if ($existing) {
            // Return success and the existing row id to keep idempotent behavior
            echo json_encode([
                'success' => true,
                'message' => 'Already in watchlist',
                'data' => [
                    'auction_id' => (int)$auction_id,
                    'created_at' => $existing['created_at'] ?? null
                ]
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
                'message' => 'Added to watchlist',
                'data' => ['auction_id' => (int)$auction_id]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to add to watchlist'
            ]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Remove from watchlist. Support auction_id in query string or body.
        $user_id = $_SESSION['user_id'] ?? $input['user_id'] ?? null;
        $auction_id = $_GET['auction_id'] ?? ($input['auction_id'] ?? null);

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
                'message' => 'Removed from watchlist',
                'data' => ['auction_id' => (int)$auction_id]
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
        // Allow session-based user or query param for dev/test
        $user_id = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;

        if (!$user_id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User ID is required'
            ]);
            exit;
        }

        // Build a richer watchlist response including seller and primary image when available
        $query = "
            SELECT 
                w.auction_id,
                a.title,
                COALESCE(a.current_price, 0) as current_bid,
                a.end_time,
                a.status,
                c.name as category_name,
                COALESCE(u.full_name, u.username) as seller_name
            FROM watchlist w
            JOIN auctions a ON w.auction_id = a.id
            LEFT JOIN users u ON a.seller_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE w.user_id = :user_id
            ORDER BY w.created_at DESC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':user_id' => $user_id]);
        $watchlist = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attempt to attach a primary image for each auction (follow patterns used in other endpoints)
        try {
            $tblStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_name IN ('auction_files','auction_images')");
            $tblStmt->execute();
            $tbls = array_column($tblStmt->fetchAll(PDO::FETCH_ASSOC), 'table_name');

            foreach ($watchlist as &$w) {
                $w['primary_image'] = null;

                // auction_files has file_path entries (preferred)
                if (in_array('auction_files', $tbls)) {
                    $imgStmt = $db->prepare("SELECT file_path FROM auction_files WHERE auction_id = :auction_id AND file_type = 'image' ORDER BY id ASC LIMIT 1");
                    $imgStmt->execute([':auction_id' => $w['auction_id']]);
                    $row = $imgStmt->fetch(PDO::FETCH_ASSOC);
                    if ($row && !empty($row['file_path'])) {
                        $path = $row['file_path'];
                        $w['primary_image'] = (strpos($path, 'http') === 0) ? $path : 'http://localhost:8000' . $path;
                        continue;
                    }
                }

                // fallback to auction_images table
                if (in_array('auction_images', $tbls)) {
                    $imgStmt = $db->prepare("SELECT image_url FROM auction_images WHERE auction_id = :auction_id AND is_active = TRUE ORDER BY sort_order ASC, is_primary DESC LIMIT 1");
                    $imgStmt->execute([':auction_id' => $w['auction_id']]);
                    $row = $imgStmt->fetch(PDO::FETCH_ASSOC);
                    if ($row && !empty($row['image_url'])) {
                        $path = $row['image_url'];
                        $w['primary_image'] = (strpos($path, 'http') === 0) ? $path : 'http://localhost:8000' . $path;
                        continue;
                    }
                }

                // If still null, leave as null (frontend will fallback to placeholder)
            }
            unset($w);
        } catch (Exception $e) {
            // Non-fatal: if image table access fails, return watchlist without images
            error_log('Watchlist image enrichment failed: ' . $e->getMessage());
        }

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
