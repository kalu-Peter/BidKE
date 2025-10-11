<?php
require_once __DIR__ . '/config/connect.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();

    echo "Checking users table structure...\n";

    $stmt = $db->prepare("SELECT * FROM users LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "User columns: " . implode(', ', array_keys($user)) . "\n\n";
    }

    echo "Testing simple payments query...\n";

    // Simple query without joins first
    $query = "SELECT * FROM payments ORDER BY created_at DESC LIMIT 2";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Payments found: " . count($payments) . "\n";
    if (!empty($payments)) {
        echo "Payment columns: " . implode(', ', array_keys($payments[0])) . "\n";
        echo "Sample payment: \n";
        print_r($payments[0]);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
