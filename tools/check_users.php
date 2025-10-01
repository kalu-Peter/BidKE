<?php
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $stmt = $conn->query('SELECT id, username, email FROM users LIMIT 5');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
