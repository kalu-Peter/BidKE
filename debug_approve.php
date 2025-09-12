<?php
// Debug the approve listing functionality

header('Content-Type: application/json');

// Test database connection
try {
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $pdo = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "=== DATABASE CONNECTION TEST ===\n";
    echo "✅ Connected to database successfully\n\n";
    
    // Check auctions table and status constraint
    echo "=== AUCTIONS TABLE CHECK ===\n";
    $check_auctions = "SELECT id, title, status FROM auctions LIMIT 3";
    $result = $pdo->query($check_auctions);
    $auctions = $result->fetchAll();
    
    foreach ($auctions as $auction) {
        echo "ID: {$auction['id']} - Title: {$auction['title']} - Status: {$auction['status']}\n";
    }
    echo "\n";
    
    // Test updating to approved status
    echo "=== STATUS UPDATE TEST ===\n";
    $test_id = $auctions[0]['id'] ?? 1;
    
    try {
        $update_query = "UPDATE auctions SET status = 'approved' WHERE id = ?";
        $stmt = $pdo->prepare($update_query);
        $stmt->execute([$test_id]);
        echo "✅ Successfully updated auction ID $test_id to 'approved' status\n";
        
        // Reset back to draft
        $reset_query = "UPDATE auctions SET status = 'draft' WHERE id = ?";
        $reset_stmt = $pdo->prepare($reset_query);
        $reset_stmt->execute([$test_id]);
        echo "✅ Reset auction ID $test_id back to 'draft' status\n";
        
    } catch (PDOException $e) {
        echo "❌ Error updating status: " . $e->getMessage() . "\n";
    }
    echo "\n";
    
    // Test admin_actions table creation
    echo "=== ADMIN ACTIONS TABLE TEST ===\n";
    try {
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
        echo "✅ admin_actions table created/verified\n";
        
        // Test insert
        $insert_query = "
            INSERT INTO admin_actions (admin_id, action, target_type, target_id, notes) 
            VALUES (1, 'test', 'auction', $test_id, 'Debug test')
        ";
        $pdo->exec($insert_query);
        echo "✅ Successfully inserted test record into admin_actions\n";
        
    } catch (PDOException $e) {
        echo "❌ Error with admin_actions: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== ALL TESTS COMPLETED ===\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General error: " . $e->getMessage() . "\n";
}
?>
