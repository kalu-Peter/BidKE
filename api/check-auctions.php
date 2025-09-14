<?php
require_once 'config/database.php';

try {
    $db = (new Database())->getConnection();

    // Check auctions count
    $stmt = $db->query('SELECT COUNT(*) as count FROM auctions');
    $result = $stmt->fetch();
    echo 'Auctions count: ' . $result['count'] . PHP_EOL;

    // List first 5 auctions
    $stmt = $db->query('SELECT id, title, status FROM auctions LIMIT 5');
    while($row = $stmt->fetch()) {
        echo 'ID: ' . $row['id'] . ', Title: ' . $row['title'] . ', Status: ' . $row['status'] . PHP_EOL;
    }

} catch(Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
?>