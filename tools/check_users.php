<?php
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $stmt = $conn->query('SELECT COUNT(*) as cnt FROM users');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "OK: users count=" . ($row['cnt'] ?? '0') . PHP_EOL;
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
