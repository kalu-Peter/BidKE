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

        // Normalize client-side status names
        if ($status === 'pending_review') {
            $status = 'pending';
        }

        $baseQuery = "FROM auctions a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.seller_id = u.id WHERE 1=1";
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
        $select = "SELECT a.id, a.title, a.description, a.starting_price, COALESCE(a.current_price, 0) as current_bid, a.reserve_price, a.start_time, a.end_time, a.status, a.featured, a.created_at, c.name as category_name, c.name as category_slug, COALESCE(u.full_name, u.username) as seller_name, u.email as seller_email";

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
            $listing['featured'] = (bool)$listing['featured'];

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
        // Minimal stub: reuse existing behavior - acknowledge action payload
        $input = file_get_contents('php://input');
        $body = json_decode($input, true) ?: [];
        send_json(['success' => true, 'received' => $body]);
    }

    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
} catch (Exception $e) {
    send_json(['success' => false, 'error' => 'Server error', 'details' => $e->getMessage()], 500);
}
