<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check current auction statuses and times
    $query = "
        SELECT 
            id,
            title,
            status,
            start_time,
            end_time,
            NOW() as current_time,
            CASE 
                WHEN start_time <= NOW() AND end_time > NOW() THEN 'SHOULD_SHOW'
                WHEN start_time > NOW() THEN 'STARTS_IN_FUTURE'
                WHEN end_time <= NOW() THEN 'ALREADY_ENDED'
                ELSE 'OTHER'
            END as time_status
        FROM auctions 
        ORDER BY created_at DESC
    ";
    
    $stmt = $db->query($query);
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Auction Status Analysis:\n";
    echo "========================\n\n";
    
    foreach ($auctions as $auction) {
        echo "ID: {$auction['id']}\n";
        echo "Title: {$auction['title']}\n";
        echo "Status: {$auction['status']}\n";
        echo "Start Time: {$auction['start_time']}\n";
        echo "End Time: {$auction['end_time']}\n";
        echo "Current Time: {$auction['current_time']}\n";
        echo "Time Status: {$auction['time_status']}\n";
        echo "Would Show in 'live' filter: " . 
             ($auction['status'] === 'approved' && $auction['time_status'] === 'SHOULD_SHOW' ? 'YES' : 'NO') . "\n";
        echo "---\n";
    }
    
    // Count by status
    echo "\nCounts by Status:\n";
    $countQuery = "
        SELECT 
            status, 
            COUNT(*) as count,
            COUNT(CASE WHEN start_time <= NOW() AND end_time > NOW() THEN 1 END) as live_now
        FROM auctions 
        GROUP BY status
    ";
    $stmt = $db->query($countQuery);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Status '{$row['status']}': {$row['count']} total, {$row['live_now']} live now\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>