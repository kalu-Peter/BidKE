<?php
require_once __DIR__ . '/../api/config/connect.php';

try {
    $db = Database::getInstance()->getConnection();

    // Check current database timezone
    $tz = $db->query("SELECT now() as db_time, current_setting('timezone') as db_timezone")->fetch(PDO::FETCH_ASSOC);
    echo "Database Time: " . $tz['db_time'] . PHP_EOL;
    echo "Database Timezone: " . $tz['db_timezone'] . PHP_EOL;

    // Check PHP timezone
    echo "PHP Timezone: " . date_default_timezone_get() . PHP_EOL;
    echo "PHP Current Time: " . date('Y-m-d H:i:s') . PHP_EOL;
    echo "PHP Current Time (UTC): " . gmdate('Y-m-d H:i:s') . PHP_EOL;

    echo PHP_EOL . "=== Auction 8 Details ===" . PHP_EOL;

    // Check auction 8 specifically
    $stmt = $db->prepare('SELECT id, title, status, start_time, end_time, current_price, current_bidder_id FROM auctions WHERE id = 8');
    $stmt->execute();
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($auction) {
        foreach ($auction as $key => $value) {
            echo $key . ': ' . $value . PHP_EOL;
        }

        // Check if end_time has passed
        $endTime = new DateTime($auction['end_time']);
        $now = new DateTime();
        echo PHP_EOL . "Time Analysis:" . PHP_EOL;
        echo "End Time (as stored): " . $auction['end_time'] . PHP_EOL;
        echo "End Time (parsed): " . $endTime->format('Y-m-d H:i:s T') . PHP_EOL;
        echo "Current Time (local): " . $now->format('Y-m-d H:i:s T') . PHP_EOL;

        // Try with UTC
        $endTimeUTC = new DateTime($auction['end_time'] . ' UTC');
        $nowUTC = new DateTime('now', new DateTimeZone('UTC'));
        echo "End Time (UTC): " . $endTimeUTC->format('Y-m-d H:i:s T') . PHP_EOL;
        echo "Current Time (UTC): " . $nowUTC->format('Y-m-d H:i:s T') . PHP_EOL;
        echo "Has Ended (UTC comparison): " . ($nowUTC >= $endTimeUTC ? 'YES' : 'NO') . PHP_EOL;
        echo "Time difference: " . ($nowUTC->getTimestamp() - $endTimeUTC->getTimestamp()) . " seconds" . PHP_EOL;

        // Check for bids
        echo PHP_EOL . "=== Top Bids for Auction 8 ===" . PHP_EOL;
        $bidStmt = $db->prepare('SELECT id, bidder_id, bid_amount, bid_time, bid_status FROM bids WHERE auction_id = 8 ORDER BY bid_amount DESC LIMIT 5');
        $bidStmt->execute();
        $bids = $bidStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($bids)) {
            echo "No bids found for auction 8" . PHP_EOL;
        } else {
            foreach ($bids as $bid) {
                echo "Bid ID: " . $bid['id'] . ", Bidder: " . $bid['bidder_id'] . ", Amount: " . $bid['bid_amount'] . ", Time: " . $bid['bid_time'] . ", Status: " . $bid['bid_status'] . PHP_EOL;
            }
        }

        // Check auction_winners table
        echo PHP_EOL . "=== Auction Winners Table ===" . PHP_EOL;
        $winnerStmt = $db->prepare('SELECT * FROM auction_winners WHERE auction_id = 8');
        $winnerStmt->execute();
        $winners = $winnerStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($winners)) {
            echo "No winner recorded for auction 8" . PHP_EOL;
        } else {
            foreach ($winners as $winner) {
                echo "Winner ID: " . $winner['winner_id'] . ", Amount: " . $winner['winning_amount'] . ", Created: " . $winner['created_at'] . PHP_EOL;
            }
        }
    } else {
        echo "Auction 8 not found!" . PHP_EOL;
    }

    echo PHP_EOL . "=== All Active Auctions Past End Time ===" . PHP_EOL;
    $expiredStmt = $db->prepare("SELECT id, title, status, end_time FROM auctions WHERE status = 'active' AND end_time <= NOW()");
    $expiredStmt->execute();
    $expired = $expiredStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($expired)) {
        echo "No active auctions past their end time found" . PHP_EOL;
    } else {
        foreach ($expired as $exp) {
            echo "Auction ID: " . $exp['id'] . ", Title: " . $exp['title'] . ", Status: " . $exp['status'] . ", End Time: " . $exp['end_time'] . PHP_EOL;
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
