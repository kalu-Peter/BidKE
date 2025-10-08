<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/connect.php';
require_once __DIR__ . '/auctions/finalize_helper.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $auctionId = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$auctionId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Auction ID is required'
            ]);
            exit();
        }

        // Detect whether auctions table has view_count / bid_count columns
        $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'auctions' AND column_name IN ('view_count','bid_count')");
        $colStmt->execute();
        $existingCols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

        $viewSelect = in_array('view_count', $existingCols) ? 'a.view_count' : '0 AS view_count';
        $bidSelect = in_array('bid_count', $existingCols) ? 'a.bid_count' : '0 AS bid_count';

        // Get auction details with seller and category info
        $query = "
            SELECT 
                a.id,
                a.title,
                a.description,
                a.starting_price,
                COALESCE(a.current_price, a.starting_price) as current_bid,
                a.reserve_price,
                a.bid_increment,
                a.start_time,
                a.end_time,
                a.status,
                a.featured,
                {$viewSelect},
                {$bidSelect},
                a.created_at,
                c.name as category_name,
                c.name as category_slug,
                COALESCE(u.full_name, u.username) as seller_name,
                u.email as seller_email,
                u.phone as seller_phone
            FROM auctions a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.seller_id = u.id
            WHERE a.id = :auction_id
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':auction_id' => $auctionId]);
        $auction = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$auction) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Auction not found'
            ]);
            exit();
        }

        // Load images/documents from auction_files or auction_images
        $auction['images'] = [];
        $auction['documents'] = [];
        $auction['primary_image'] = null;

        $tblStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_name IN ('auction_files','auction_images','auction_documents')");
        $tblStmt->execute();
        $tbls = $tblStmt->fetchAll(PDO::FETCH_COLUMN);

        $useImages = in_array('auction_images', $tbls);
        $useFiles = in_array('auction_files', $tbls) && !$useImages;

        if ($useFiles) {
            $fstmt = $db->prepare("SELECT file_path, file_type FROM auction_files WHERE auction_id = :auction_id ORDER BY id ASC");
            $fstmt->execute([':auction_id' => $auctionId]);
            $rows = $fstmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $path = $r['file_path'] ?? '';
                if (!$path) continue;
                if (preg_match('#^https?://#i', $path)) {
                    $url = $path;
                } elseif (strpos($path, '/') === 0) {
                    $url = 'http://localhost:8000' . $path;
                } else {
                    $url = 'http://localhost:8000/' . $path;
                }
                if (strtolower($r['file_type'] ?? '') === 'image') {
                    $auction['images'][] = $url;
                    if ($auction['primary_image'] === null) $auction['primary_image'] = $url;
                } else {
                    $auction['documents'][] = $url;
                }
            }
        } elseif ($useImages) {
            $istmt = $db->prepare("SELECT image_url, is_primary FROM auction_images WHERE auction_id = :auction_id AND is_active = TRUE ORDER BY sort_order ASC, is_primary DESC");
            $istmt->execute([':auction_id' => $auctionId]);
            $rows = $istmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $path = $r['image_url'] ?? '';
                if (!$path) continue;
                if (preg_match('#^https?://#i', $path)) {
                    $url = $path;
                } elseif (strpos($path, '/') === 0) {
                    $url = 'http://localhost:8000' . $path;
                } else {
                    $url = 'http://localhost:8000/' . $path;
                }
                $auction['images'][] = $url;
                if (!empty($r['is_primary']) && $auction['primary_image'] === null) {
                    $auction['primary_image'] = $url;
                }
            }
        }

        // Fallback to category placeholder if no images
        if (empty($auction['images'])) {
            switch (strtolower($auction['category_name'])) {
                case 'cars':
                    $auction['images'] = ['/src/assets/category-cars.jpg'];
                    break;
                case 'motorbikes':
                    $auction['images'] = ['/src/assets/category-motorbikes.jpg'];
                    break;
                case 'electronics':
                    $auction['images'] = ['/src/assets/category-electronics.jpg'];
                    break;
                default:
                    $auction['images'] = ['/placeholder.svg'];
            }
            // Normalize placeholders to absolute if needed
            $auction['images'] = array_map(function ($p) {
                return preg_match('#^https?://#i', $p) ? $p : 'http://localhost:8000' . $p;
            }, $auction['images']);
        } else {
            // ensure primary image set
            if (empty($auction['primary_image'])) {
                $auction['primary_image'] = $auction['images'][0];
            }
        }

        // Get real bid history from bids table (most recent first)
        $auction['bid_history'] = [];
        $bidQuery = "SELECT id, bidder_id, bid_amount, bid_time, bid_status FROM bids WHERE auction_id = :auction_id ORDER BY bid_time DESC LIMIT 20";
        $bidStmt = $db->prepare($bidQuery);
        $bidStmt->execute([':auction_id' => $auctionId]);
        $bids = $bidStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($bids as $b) {
            // Attempt to resolve bidder display name
            $bidderName = null;
            if (!empty($b['bidder_id'])) {
                $uStmt = $db->prepare("SELECT COALESCE(full_name, username) as name FROM users WHERE id = :id LIMIT 1");
                $uStmt->execute([':id' => $b['bidder_id']]);
                $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
                if ($uRow) $bidderName = $uRow['name'];
            }
            $auction['bid_history'][] = [
                'id' => (int)$b['id'],
                'bidder' => $bidderName ?? ('Buyer#' . ($b['bidder_id'] ?? '0')),
                'amount' => (float)$b['bid_amount'],
                'timestamp' => date('H:i', strtotime($b['bid_time'])),
                'isCurrentUser' => false,
                'status' => $b['bid_status'] ?? 'active'
            ];
        }

        // If auction end_time passed but status is not yet 'ended', finalize it
        try {
            $endDT = new DateTime($auction['end_time'] . ' UTC');
            $nowDT = new DateTime('now', new DateTimeZone('UTC'));
            if ($nowDT >= $endDT && strtolower($auction['status']) !== 'ended') {
                // Attempt to finalize in-process to update DB (best-effort)
                $fres = finalizeAuction($db, (int)$auctionId);
                // If finalize succeeded, reload auction row to pick up status/current price
                if (!empty($fres['success'])) {
                    $stmt = $db->prepare($query);
                    $stmt->execute([':auction_id' => $auctionId]);
                    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
                    // If finalize created a payment, include its transaction_ref in the response
                    if (!empty($fres['transaction_ref'])) {
                        $auction['pending_payment_transaction_ref'] = $fres['transaction_ref'];
                        $auction['pending_payment_id'] = $fres['payment_id'] ?? null;
                    }
                }
            }
        } catch (Exception $e) {
            // ignore finalize errors; we'll compute time_remaining below
        }

        // Calculate time remaining (using the possibly-updated auction)
        $endTime = new DateTime($auction['end_time'] . ' UTC');
        $now = new DateTime('now', new DateTimeZone('UTC'));
        $timeRemaining = $now < $endTime ? $endTime->getTimestamp() - $now->getTimestamp() : 0;

        $auction['time_remaining'] = $timeRemaining;
        $auction['auction_ended'] = $timeRemaining <= 0;

        // Load item-specific details (vehicles or electronics) when available
        $auction['item_type'] = 'unknown';
        // Check if vehicles table exists and load vehicle details
        $tblCheckStmt = $db->prepare("SELECT table_name FROM information_schema.tables WHERE table_name IN ('vehicles','electronics')");
        $tblCheckStmt->execute();
        $foundTbls = $tblCheckStmt->fetchAll(PDO::FETCH_COLUMN);

        if (in_array('vehicles', $foundTbls)) {
            $vStmt = $db->prepare("SELECT vehicle_type, make, model, year, mileage, condition, registration_number, engine_capacity, fuel_type, transmission, color, location FROM vehicles WHERE auction_id = :auction_id LIMIT 1");
            $vStmt->execute([':auction_id' => $auctionId]);
            $vRow = $vStmt->fetch(PDO::FETCH_ASSOC);
            if ($vRow) {
                $auction['item_type'] = 'vehicle';
                $auction['vehicle_type'] = $vRow['vehicle_type'];
                $auction['make'] = $vRow['make'];
                $auction['model'] = $vRow['model'];
                $auction['year'] = $vRow['year'] ? (int)$vRow['year'] : null;
                $auction['mileage'] = $vRow['mileage'] ? (int)$vRow['mileage'] : null;
                $auction['vehicle_condition'] = $vRow['condition'];
                $auction['registration_number'] = $vRow['registration_number'] ?? null;
                $auction['engine_capacity'] = $vRow['engine_capacity'] ?? null;
                $auction['fuel_type'] = $vRow['fuel_type'] ?? null;
                $auction['transmission'] = $vRow['transmission'] ?? null;
                $auction['color'] = $vRow['color'] ?? null;
                $auction['location'] = $vRow['location'] ?? null;
            }
        }

        if ($auction['item_type'] === 'unknown' && in_array('electronics', $foundTbls)) {
            $eStmt = $db->prepare("SELECT category as electronics_category, brand, model, condition, specs, location FROM electronics WHERE auction_id = :auction_id LIMIT 1");
            $eStmt->execute([':auction_id' => $auctionId]);
            $eRow = $eStmt->fetch(PDO::FETCH_ASSOC);
            if ($eRow) {
                $auction['item_type'] = 'electronics';
                $auction['electronics_category'] = $eRow['electronics_category'];
                $auction['brand'] = $eRow['brand'];
                $auction['model'] = $eRow['model'];
                $auction['electronics_condition'] = $eRow['condition'];
                $auction['specs'] = $eRow['specs'] ? json_decode($eRow['specs'], true) : null;
                $auction['location'] = $eRow['location'] ?? null;
            }
        }

        // Convert numeric fields
        $auction['id'] = (int)$auction['id'];
        $auction['starting_price'] = (float)$auction['starting_price'];
        $auction['current_bid'] = (float)$auction['current_bid'];
        $auction['reserve_price'] = $auction['reserve_price'] ? (float)$auction['reserve_price'] : null;
        $auction['bid_increment'] = $auction['bid_increment'] ? (float)$auction['bid_increment'] : 1000;
        $auction['featured'] = (bool)$auction['featured'];
        $auction['view_count'] = (int)$auction['view_count'];
        $auction['bid_count'] = (int)$auction['bid_count'];
        // Provide total_bids alias for compatibility
        $auction['total_bids'] = $auction['bid_count'];

        // Increment view count if column exists
        if (in_array('view_count', $existingCols)) {
            $updateViewQuery = "UPDATE auctions SET view_count = view_count + 1 WHERE id = :auction_id";
            $updateViewStmt = $db->prepare($updateViewQuery);
            $updateViewStmt->execute([':auction_id' => $auctionId]);
        }

        echo json_encode([
            'success' => true,
            'data' => $auction
        ]);
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }
} catch (Exception $e) {
    // Development: include error details in response and log for quick debugging
    error_log("Auction Details API Error: " . $e->getMessage());
    file_put_contents(__DIR__ . '/logs/auction_details_error.log', date('c') . " - " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
