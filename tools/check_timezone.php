<?php
require_once 'api/config/connect.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT NOW() as current_time, current_setting('timezone') as tz");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Current DB time: " . $row['current_time'] . "\n";
    echo "Database timezone: " . $row['tz'] . "\n";
    echo "Server timezone: " . date_default_timezone_get() . "\n";
    echo "Current server time: " . date('Y-m-d H:i:s') . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
