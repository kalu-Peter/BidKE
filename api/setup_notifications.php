<?php
// Create notifications table using PHP
try {
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $pdo = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Connected to database successfully.\n";

    // Create notifications table
    $sql = "
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $pdo->exec($sql);
    echo "Notifications table created successfully.\n";

    // Create indexes
    $indexes = [
        "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);"
    ];

    foreach ($indexes as $index) {
        $pdo->exec($index);
    }
    echo "Indexes created successfully.\n";

    // Create trigger function
    $triggerFunction = "
    CREATE OR REPLACE FUNCTION update_notifications_updated_at()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql;";

    $pdo->exec($triggerFunction);
    echo "Trigger function created successfully.\n";

    // Create trigger
    $trigger = "
    DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
    CREATE TRIGGER trigger_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_notifications_updated_at();";

    $pdo->exec($trigger);
    echo "Trigger created successfully.\n";

    // Insert some sample notifications for testing
    $sampleNotifications = [
        [
            'user_id' => 9, // Assuming user ID 9 exists (Gaming PC seller)
            'type' => 'approval',
            'title' => 'Item Approved',
            'message' => 'Your gaming PC listing has been approved and is now live.',
            'data' => json_encode(['auction_id' => 20, 'auction_title' => 'Gaming PC - High Performance'])
        ],
        [
            'user_id' => 9,
            'type' => 'outbid',
            'title' => 'You have been outbid',
            'message' => 'Someone placed a higher bid on Toyota Camry 2018.',
            'data' => json_encode(['auction_id' => 15, 'auction_title' => 'Toyota Camry 2018', 'amount' => 850000])
        ]
    ];

    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (:user_id, :type, :title, :message, :data)
    ");

    foreach ($sampleNotifications as $notification) {
        $stmt->execute($notification);
    }
    echo "Sample notifications inserted successfully.\n";

    echo "Notifications system setup completed successfully!\n";
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
