<?php
// Admin approve listing endpoint

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        sendError('Invalid JSON data', 400);
    }

    // Validate required fields
    if (empty($data['listing_id'])) {
        sendError('Listing ID is required', 400);
    }

    $listing_id = intval($data['listing_id']);
    $admin_notes = $data['admin_notes'] ?? '';

    // Database connection
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $pdo = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $pdo->beginTransaction();

    // Check if listing exists and is in a state that can be approved
    $check_query = "SELECT id, title, status, seller_id FROM auctions WHERE id = ?";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->execute([$listing_id]);
    $listing = $check_stmt->fetch();

    if (!$listing) {
        $pdo->rollBack();
        sendError('Listing not found', 404);
    }

    if (!in_array($listing['status'], ['draft', 'needs_info'])) {
        $pdo->rollBack();
        sendError('Listing cannot be approved from current status: ' . $listing['status'], 400);
    }

    // Update listing status to approved
    $update_query = "
        UPDATE auctions 
        SET status = 'approved', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ";
    $update_stmt = $pdo->prepare($update_query);
    $update_stmt->execute([$listing_id]);

    // Add to admin actions log (create table if needed)
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

    $log_query = "
        INSERT INTO admin_actions (admin_id, action, target_type, target_id, notes, created_at) 
        VALUES (?, 'approve', 'auction', ?, ?, CURRENT_TIMESTAMP)
    ";
    $log_stmt = $pdo->prepare($log_query);
    $log_stmt->execute([1, $listing_id, $admin_notes]); // Using admin_id = 1 for now

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Listing approved successfully',
        'data' => [
            'listing_id' => $listing_id,
            'title' => $listing['title'],
            'new_status' => 'approved',
            'approved_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    error_log("Database error in approve listing: " . $e->getMessage());
    sendError('Database error occurred', 500);
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    error_log("General error in approve listing: " . $e->getMessage());
    sendError('An error occurred while approving the listing', 500);
}
?>
