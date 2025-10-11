<?php
require_once 'api/config/connect.php';
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare('DELETE FROM payments WHERE transaction_ref LIKE ?');
$result = $stmt->execute(['TEST_REFUND_%']);
echo 'Cleaned up test records: ' . $stmt->rowCount() . " deleted\n";
