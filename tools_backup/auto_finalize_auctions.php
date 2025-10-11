<?php

/**
 * Enhanced Auction Auto-Finalizer
 * This script can be called directly, via cron, or as a web endpoint
 * It includes better error handling and timezone management
 */

require_once __DIR__ . '/../api/config/connect.php';
require_once __DIR__ . '/../api/auctions/finalize_helper.php';

// Ensure we're working in UTC for consistent time handling
date_default_timezone_set('UTC');

$logFile = __DIR__ . '/../api/logs/auto_finalize.log';

function logMessage($message)
{
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND | LOCK_EX);
}

try {
    logMessage("Starting auction finalization process");

    $db = Database::getInstance()->getConnection();

    // Set database session to UTC to ensure consistent time comparisons
    $db->exec("SET timezone = 'UTC'");

    // Find auctions that should be finalized
    // Use explicit UTC time comparison to avoid timezone issues
    $sql = "SELECT id, title, end_time FROM auctions 
            WHERE (status = 'active' OR status = 'live') 
            AND end_time AT TIME ZONE 'UTC' <= NOW() AT TIME ZONE 'UTC'";

    $stmt = $db->prepare($sql);
    $stmt->execute();
    $expiredAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($expiredAuctions)) {
        logMessage("No expired auctions found to finalize");
        if (php_sapi_name() !== 'cli') {
            echo json_encode(['success' => true, 'message' => 'No auctions to finalize']);
        }
        return;
    }

    logMessage("Found " . count($expiredAuctions) . " expired auctions to finalize");

    $finalized = [];
    $errors = [];

    foreach ($expiredAuctions as $auction) {
        $auctionId = (int)$auction['id'];
        $title = $auction['title'];
        $endTime = $auction['end_time'];

        logMessage("Finalizing auction ID $auctionId: '$title' (ended: $endTime)");

        try {
            $result = finalizeAuction($db, $auctionId);
            $finalized[] = $result;

            if ($result['success']) {
                logMessage("Successfully finalized auction $auctionId: " . $result['message']);

                // Send notification to winner if available
                if (!empty($result['winner'])) {
                    $winnerId = $result['winner']['bidder_id'];
                    $winAmount = $result['winner']['bid_amount'];
                    logMessage("Winner for auction $auctionId: User $winnerId with bid $winAmount");

                    // TODO: Add notification system call here
                    // NotificationService::notifyAuctionWon($winnerId, $auctionId, $title, $winAmount);
                }
            } else {
                $errors[] = "Failed to finalize auction $auctionId: " . $result['message'];
                logMessage("Error finalizing auction $auctionId: " . $result['message']);
            }
        } catch (Exception $e) {
            $error = "Exception finalizing auction $auctionId: " . $e->getMessage();
            $errors[] = $error;
            logMessage($error);
        }
    }

    $summary = [
        'success' => true,
        'processed' => count($expiredAuctions),
        'finalized' => count($finalized),
        'errors' => count($errors),
        'details' => $finalized
    ];

    if (!empty($errors)) {
        $summary['error_messages'] = $errors;
    }

    logMessage("Finalization complete. Processed: " . count($expiredAuctions) . ", Success: " . count($finalized) . ", Errors: " . count($errors));

    // Output for web or CLI
    if (php_sapi_name() === 'cli') {
        echo "Auction finalization completed.\n";
        echo "Processed: " . count($expiredAuctions) . " auctions\n";
        echo "Successfully finalized: " . count($finalized) . " auctions\n";
        if (!empty($errors)) {
            echo "Errors: " . count($errors) . "\n";
            foreach ($errors as $error) {
                echo "  - $error\n";
            }
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode($summary);
    }
} catch (Exception $e) {
    $error = "Fatal error in auto-finalizer: " . $e->getMessage();
    logMessage($error);

    if (php_sapi_name() === 'cli') {
        echo "Error: $error\n";
        exit(1);
    } else {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $error]);
    }
}
