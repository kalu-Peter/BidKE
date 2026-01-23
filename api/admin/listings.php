<?php
// Minimal admin listings endpoint (single PHP block)

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// mirror allowed origins
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../utils/notification_helper.php';

function send_json($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

try {
    $pdo = Database::getInstance()->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, intval($_GET['limit'] ?? 20));
        $offset = ($page - 1) * $limit;

        $status = isset($_GET['status']) ? trim($_GET['status']) : 'all';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';

        // Normalize client-side status names to database values
        if ($status === 'pending_review') {
            $status = 'pending';
        } elseif ($status === 'live') {
            $status = 'active';
        }

        $baseQuery = "FROM auctions a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.seller_id = u.id LEFT JOIN vehicles v ON a.id = v.auction_id LEFT JOIN electronics e ON a.id = e.auction_id WHERE 1=1";
        $params = [];
        $conditions = [];

        if ($status !== 'all') {
            $conditions[] = "a.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($search)) {
            $conditions[] = "(a.title ILIKE :search OR a.description ILIKE :search OR c.name ILIKE :search)";
            $params[':search'] = "%$search%";
        }

        if (!empty($category) && $category !== 'all') {
            $conditions[] = "LOWER(c.name) = LOWER(:category)";
            $params[':category'] = $category;
        }

        if (!empty($conditions)) {
            $baseQuery .= ' AND ' . implode(' AND ', $conditions);
        }

        // Count total records
        $countQuery = "SELECT COUNT(*) as total " . $baseQuery;
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Select fields (alias current_price -> current_bid for admin UI compatibility)
        // Select a conservative set of fields that are present across schemas
        $select = "SELECT a.id, a.title, a.description, a.starting_price, COALESCE(a.current_price, 0) as current_bid, a.reserve_price, a.start_time, a.end_time, a.status, COALESCE(a.featured, false) as featured, COALESCE(a.location, '') as location, a.created_at, c.name as category_name, c.slug as category_slug, COALESCE(u.full_name, u.username) as seller_name, u.email as seller_email, v.make as vehicle_make, v.model as vehicle_model, v.condition as vehicle_condition, e.brand as electronics_brand, e.model as electronics_model, e.condition as electronics_condition";

        $query = $select . ' ' . $baseQuery . " ORDER BY a.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Detect image/document tables
        $tablesStmt = $pdo->prepare("SELECT table_name FROM information_schema.tables WHERE table_name IN ('auction_files','auction_images','auction_documents')");
        $tablesStmt->execute();
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        $useFiles = in_array('auction_files', $tables);
        $useImages = in_array('auction_images', $tables) && !$useFiles;
        $useDocs = in_array('auction_documents', $tables) || $useFiles;

        $listings = [];
        foreach ($rows as $r) {
            $listing = $r;
            $listing['id'] = (int)$listing['id'];
            $listing['starting_price'] = isset($listing['starting_price']) ? (float)$listing['starting_price'] : 0;
            $listing['current_bid'] = isset($listing['current_bid']) ? (float)$listing['current_bid'] : 0;
            $listing['reserve_price'] = $listing['reserve_price'] !== null ? (float)$listing['reserve_price'] : null;
            $listing['featured'] = isset($listing['featured']) ? (bool)$listing['featured'] : false;

            // Add fallback values for fields that might not exist in the database
            $listing['view_count'] = 0;
            $listing['bid_count'] = 0;
            $listing['auction_duration'] = 7;
            $listing['verification_status'] = 'pending';

            // images
            $images = [];
            if ($useFiles) {
                $imgStmt = $pdo->prepare("SELECT file_path FROM auction_files WHERE auction_id = :id AND file_type = 'image' ORDER BY id ASC");
                $imgStmt->execute([':id' => $listing['id']]);
                $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
            } elseif ($useImages) {
                $imgStmt = $pdo->prepare("SELECT image_url as file_path FROM auction_images WHERE auction_id = :id AND is_active = TRUE ORDER BY sort_order ASC, is_primary DESC");
                $imgStmt->execute([':id' => $listing['id']]);
                $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
            }
            $listing['images'] = $images;

            // documents
            $documents = [];
            if ($useFiles) {
                $docStmt = $pdo->prepare("SELECT file_path FROM auction_files WHERE auction_id = :id AND file_type = 'document' ORDER BY id ASC");
                $docStmt->execute([':id' => $listing['id']]);
                $documents = $docStmt->fetchAll(PDO::FETCH_COLUMN);
            } elseif ($useDocs) {
                // fallback - no separate documents table, leave empty
                $documents = [];
            }
            $listing['documents'] = $documents;

            // primary image: prefer first image if present
            $listing['primary_image'] = null;
            if (!empty($images) && is_array($images)) {
                $listing['primary_image'] = $images[0];
            }

            // unified item fields for admin: prefer vehicle fields, then electronics
            $listing['item_type'] = 'unknown';
            $listing['item_make'] = null;
            $listing['item_model'] = null;
            $listing['item_condition'] = null;
            if (!empty($r['vehicle_make']) || !empty($r['vehicle_model'])) {
                $listing['item_type'] = 'vehicle';
                $listing['item_make'] = $r['vehicle_make'] ?? null;
                $listing['item_model'] = $r['vehicle_model'] ?? null;
                $listing['item_condition'] = $r['vehicle_condition'] ?? null;
            } elseif (!empty($r['electronics_brand']) || !empty($r['electronics_model'])) {
                $listing['item_type'] = 'electronics';
                $listing['item_make'] = $r['electronics_brand'] ?? null;
                $listing['item_model'] = $r['electronics_model'] ?? null;
                $listing['item_condition'] = $r['electronics_condition'] ?? null;
            }

            $listings[] = $listing;
        }

        // Stats: aggregate counts by status
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

        $statsStmt = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM auctions GROUP BY status");
        $statsStmt->execute();
        $groups = $statsStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($groups as $g) {
            $s = $g['status'];
            $c = (int)$g['cnt'];
            switch ($s) {
                case 'draft':
                    $stats['draft'] = $c;
                    break;
                case 'pending':
                    $stats['pending_review'] = $c;
                    break;
                case 'needs_info':
                    $stats['needs_info'] = $c;
                    break;
                case 'approved':
                    $stats['approved'] = $c;
                    break;
                case 'live':
                case 'active':
                    $stats['live'] += $c;
                    break;
                case 'ended':
                    $stats['ended'] = $c;
                    break;
                case 'rejected':
                case 'cancelled':
                    $stats['rejected'] += $c;
                    break;
                default:
                    // ignore other statuses for now
                    break;
            }
        }

        $totalPages = $limit > 0 ? (int)ceil($total / $limit) : 0;

        send_json(['success' => true, 'data' => $listings, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => $totalPages], 'stats' => $stats]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle admin actions: approve, make_live, reject, request_info
        $input = file_get_contents('php://input');
        // TEMP DEBUG: write raw input to log for investigation
        file_put_contents(__DIR__ . '/../logs/admin_listings_put_debug.log', date('c') . "\n" . var_export(getallheaders(), true) . "\nRAW:\n" . $input . "\n---\n", FILE_APPEND);

        // Normalize encoding: strip UTF-8 BOM, convert UTF-16 LE/BE -> UTF-8
        $raw = $input;
        // UTF-8 BOM
        if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
            $raw = substr($raw, 3);
        }
        // UTF-16 LE/BE BOMs
        $bom2 = substr($raw, 0, 2);
        if ($bom2 === "\xFF\xFE" || $bom2 === "\xFE\xFF") {
            // Convert from UTF-16 to UTF-8
            $raw = mb_convert_encoding($raw, 'UTF-8', 'UTF-16');
        }

        // Log converted payload for debugging
        file_put_contents(__DIR__ . '/../logs/admin_listings_put_debug.log', "CONVERTED:\n" . $raw . "\n===\n", FILE_APPEND);

        $body = json_decode($raw, true) ?: [];

        $auction_id = isset($body['auction_id']) ? intval($body['auction_id']) : 0;
        $action = isset($body['action']) ? trim($body['action']) : '';
        $reason = isset($body['reason']) ? trim($body['reason']) : null;
        $message = isset($body['message']) ? trim($body['message']) : null;

        if ($auction_id <= 0 || $action === '') {
            send_json(['success' => false, 'error' => 'Invalid payload: auction_id and action are required'], 400);
        }

        try {
            $pdo->beginTransaction();

            // Lock the row for update
            $checkStmt = $pdo->prepare("SELECT id, title, status, seller_id, start_time, end_time, featured FROM auctions WHERE id = :id FOR UPDATE");
            $checkStmt->execute([':id' => $auction_id]);
            $auction = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$auction) {
                $pdo->rollBack();
                send_json(['success' => false, 'error' => 'Listing not found'], 404);
            }

            $currentStatus = $auction['status'];
            $newStatus = null;
            $now = new DateTime('now', new DateTimeZone('UTC'));
            $updatedFields = [];

            if ($action === 'approve') {
                // Approve now makes the auction active immediately (admin requested behavior)
                if (!in_array($currentStatus, ['draft', 'pending'])) {
                    $pdo->rollBack();
                    send_json(['success' => false, 'error' => 'Listing cannot be approved from current status: ' . $currentStatus], 400);
                }

                // compute duration between existing start and end; fallback to 7 days
                $durationSeconds = 7 * 24 * 3600;
                if (!empty($auction['start_time']) && !empty($auction['end_time'])) {
                    try {
                        $st = new DateTime($auction['start_time'], new DateTimeZone('UTC'));
                        $en = new DateTime($auction['end_time'], new DateTimeZone('UTC'));
                        $diff = $en->getTimestamp() - $st->getTimestamp();
                        if ($diff > 0) {
                            $durationSeconds = $diff;
                        }
                    } catch (Exception $e) {
                        // leave fallback duration
                    }
                }

                $newStart = $now->format('Y-m-d H:i:s');
                $newEnd = (new DateTime('@' . ($now->getTimestamp() + $durationSeconds)))->setTimeZone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');

                $newStatus = 'active';
                $updateQuery = "UPDATE auctions SET status = :status, start_time = :start_time, end_time = :end_time, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([':status' => $newStatus, ':start_time' => $newStart, ':end_time' => $newEnd, ':id' => $auction_id]);

                // Send notification to seller about auction approval and going live
                $sellerId = (int)$auction['seller_id'];
                $auctionTitle = $auction['title'];

                NotificationHelper::sendAuctionApprovedNotification(
                    $sellerId,
                    $auction_id,
                    $auctionTitle
                );
            } elseif ($action === 'make_live') {
                // Only allow make_live if currently pending or draft
                if (!in_array($currentStatus, ['pending', 'draft'])) {
                    $pdo->rollBack();
                    send_json(['success' => false, 'error' => 'Listing must be pending or draft before making live'], 400);
                }

                // compute duration between existing start and end; fallback to 7 days
                $durationSeconds = 7 * 24 * 3600;
                if (!empty($auction['start_time']) && !empty($auction['end_time'])) {
                    try {
                        $st = new DateTime($auction['start_time'], new DateTimeZone('UTC'));
                        $en = new DateTime($auction['end_time'], new DateTimeZone('UTC'));
                        $diff = $en->getTimestamp() - $st->getTimestamp();
                        if ($diff > 0) {
                            $durationSeconds = $diff;
                        }
                    } catch (Exception $e) {
                        // leave fallback duration
                    }
                }

                $newStart = $now->format('Y-m-d H:i:s');
                $newEnd = (new DateTime('@' . ($now->getTimestamp() + $durationSeconds)))->setTimeZone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');

                $newStatus = 'active';
                $updateQuery = "UPDATE auctions SET status = :status, start_time = :start_time, end_time = :end_time, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([':status' => $newStatus, ':start_time' => $newStart, ':end_time' => $newEnd, ':id' => $auction_id]);

                // Send notification to seller about auction going live
                $sellerId = (int)$auction['seller_id'];
                $auctionTitle = $auction['title'];

                NotificationHelper::sendAuctionApprovedNotification(
                    $sellerId,
                    $auction_id,
                    $auctionTitle
                );
            } elseif ($action === 'reject') {
                // Map UI 'reject' to DB 'cancelled'
                $newStatus = 'cancelled';
                $updateQuery = "UPDATE auctions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([':status' => $newStatus, ':id' => $auction_id]);

                // Send notification to seller about auction rejection
                if ($reason && trim($reason)) {
                    $sellerId = (int)$auction['seller_id'];
                    $auctionTitle = $auction['title'];

                    NotificationHelper::sendAuctionRejectedNotification(
                        $sellerId,
                        $auction_id,
                        $auctionTitle,
                        trim($reason)
                    );
                }
            } elseif ($action === 'request_info') {
                // Map UI 'request_info' to DB 'draft' so seller can update
                $newStatus = 'draft';
                $updateQuery = "UPDATE auctions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([':status' => $newStatus, ':id' => $auction_id]);

                // Send notification to seller about the information request
                if ($message && trim($message)) {
                    $sellerId = (int)$auction['seller_id'];
                    $auctionTitle = $auction['title'];

                    NotificationHelper::sendInfoRequestNotification(
                        $sellerId,
                        $auction_id,
                        $auctionTitle,
                        trim($message)
                    );
                }
            } elseif ($action === 'toggle_feature') {
                // Toggle the featured status of the auction
                $currentFeatured = (bool)($auction['featured'] ?? false);
                $newFeatured = !$currentFeatured;

                $updateQuery = "UPDATE auctions SET featured = :featured, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([':featured' => $newFeatured ? 't' : 'f', ':id' => $auction_id]);

                // Don't change status for this action
                $newStatus = $currentStatus;
            } else {
                $pdo->rollBack();
                send_json(['success' => false, 'error' => 'Unknown action: ' . $action], 400);
            }

            // Ensure admin_actions table exists
            $create_table_query = "
                CREATE TABLE IF NOT EXISTS admin_actions (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    target_type VARCHAR(50) NOT NULL,
                    target_id INTEGER NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ";
            $pdo->exec($create_table_query);

            // log admin action - admin_id=1 used as placeholder
            $log_query = "INSERT INTO admin_actions (admin_id, action, target_type, target_id, notes, created_at) VALUES (?, ?, 'auction', ?, ?, CURRENT_TIMESTAMP)";
            $log_stmt = $pdo->prepare($log_query);
            $notes = $reason ?: $message ?: null;
            $log_stmt->execute([1, $action, $auction_id, $notes]);

            $pdo->commit();

            send_json(['success' => true, 'message' => 'Action performed', 'data' => ['auction_id' => $auction_id, 'action' => $action, 'new_status' => $newStatus ?? $currentStatus]]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $msg = "PDOException: " . $e->getMessage();
            error_log("Admin listings action error: " . $e->getMessage());
            file_put_contents(__DIR__ . '/../logs/admin_listings_put_debug.log', "ERROR: " . $msg . "\n", FILE_APPEND);
            send_json(['success' => false, 'error' => 'Database error while performing action'], 500);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $msg = "Exception: " . $e->getMessage();
            error_log("Admin listings action error: " . $e->getMessage());
            file_put_contents(__DIR__ . '/../logs/admin_listings_put_debug.log', "ERROR: " . $msg . "\n", FILE_APPEND);
            send_json(['success' => false, 'error' => 'Error while performing action'], 500);
        }
    }

    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
} catch (Exception $e) {
    send_json(['success' => false, 'error' => 'Server error', 'details' => $e->getMessage()], 500);
}
