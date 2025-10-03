<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/connect.php';

$transaction_ref = $_GET['transaction_ref'] ?? null;
$payment_id = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : null;

if (!$transaction_ref && !$payment_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provide transaction_ref or payment_id']);
    exit();
}

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    if ($transaction_ref) {
        $stmt = $db->prepare('SELECT payment_id, status, transaction_ref, updated_at FROM payments WHERE transaction_ref = :tx LIMIT 1');
        $stmt->execute(['tx' => $transaction_ref]);
    } else {
        $stmt = $db->prepare('SELECT payment_id, status, transaction_ref, updated_at FROM payments WHERE payment_id = :id LIMIT 1');
        $stmt->execute(['id' => $payment_id]);
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found']);
        exit();
    }

    echo json_encode(['success' => true, 'data' => $row]);
    exit();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit();
}
