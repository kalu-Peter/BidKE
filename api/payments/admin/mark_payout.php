<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$payoutId = isset($input['payout_id']) ? (int)$input['payout_id'] : null;

if (!$payoutId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing payout_id']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    // Lock payout row
    $pstmt = $db->prepare('SELECT * FROM payouts WHERE payout_id = :id LIMIT 1 FOR UPDATE');
    $pstmt->execute(['id' => $payoutId]);
    $payout = $pstmt->fetch(PDO::FETCH_ASSOC);

    if (!$payout) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payout not found']);
        exit();
    }

    if ($payout['status'] === 'completed') {
        echo json_encode(['success' => true, 'message' => 'Already completed', 'data' => ['payout_id' => $payoutId]]);
        exit();
    }

    $db->beginTransaction();

    $upd = $db->prepare('UPDATE payouts SET status = :status, updated_at = NOW() WHERE payout_id = :id');
    $upd->execute(['status' => 'completed', 'id' => $payoutId]);

    // Optionally: update underlying payment/commission status if needed

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Payout marked completed', 'data' => ['payout_id' => $payoutId]]);
    exit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('admin/mark_payout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit();
}
