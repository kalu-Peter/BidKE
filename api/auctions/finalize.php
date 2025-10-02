<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/connect.php';
require_once __DIR__ . '/../../models/Auth.php';

// This endpoint is designed to be called from CLI or a cron job.
// If called by a web user, require admin role to avoid abuse.
try {
    $db = Database::getInstance()->getConnection();

    // Find auctions that should be finalized: end_time <= NOW() and status = 'active' or 'live'
    $sql = "SELECT id FROM auctions WHERE (status = 'active' OR status = 'live') AND end_time <= NOW()";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $finalized = [];
    // detect bidder column name in bids table
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : 'bidder_id');

    foreach ($rows as $auctionId) {
        // Use transaction per auction
        $db->beginTransaction();
        try {
            // Lock auction row
            $lock = $db->prepare("SELECT id, current_price, current_bidder_id FROM auctions WHERE id = :id FOR UPDATE");
            $lock->execute([':id' => $auctionId]);
            $a = $lock->fetch(PDO::FETCH_ASSOC);
            if (!$a) {
                $db->commit();
                continue;
            }

            // Find highest active bid using detected bidder column
            $bidQuery = "SELECT id, " . $bidderCol . " AS bidder_id, bid_amount FROM bids WHERE auction_id = :aid AND bid_status IN ('active','winning') ORDER BY bid_amount DESC, bid_time ASC LIMIT 1";
            $bidStmt = $db->prepare($bidQuery);
            $bidStmt->execute([':aid' => $auctionId]);
            $winnerBid = $bidStmt->fetch(PDO::FETCH_ASSOC);

            if ($winnerBid && isset($winnerBid['bid_amount'])) {
                // Mark auction ended and set final fields
                $update = $db->prepare("UPDATE auctions SET status = 'ended', current_price = :price, current_bidder_id = :bidder, updated_at = NOW() WHERE id = :id");
                $update->execute([':price' => $winnerBid['bid_amount'], ':bidder' => $winnerBid['bidder_id'], ':id' => $auctionId]);

                // Update bids: winning bid -> won, others -> outbid
                $winUpdate = $db->prepare("UPDATE bids SET bid_status = CASE WHEN id = :winId THEN 'won' ELSE 'outbid' END WHERE auction_id = :aid AND bid_status IN ('active','winning')");
                $winUpdate->execute([':winId' => $winnerBid['id'], ':aid' => $auctionId]);

                // Insert into auction_winners table
                try {
                    $ins = $db->prepare("INSERT INTO auction_winners (auction_id, winner_id, winning_bid_id, winning_amount, created_at) VALUES (:aid, :uid, :bidid, :amount, NOW())");
                    $ins->execute([':aid' => $auctionId, ':uid' => $winnerBid['bidder_id'], ':bidid' => $winnerBid['id'], ':amount' => $winnerBid['bid_amount']]);
                } catch (Exception $ie) {
                    // If table doesn't exist or insert fails, log and continue (backward compatible)
                    error_log('auction_winners insert failed: ' . $ie->getMessage());
                }

                // Optionally update buyer_profiles/won counters if present
                // Try to update buyer_profiles.won_auctions if exists
                $cols = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'buyer_profiles'");
                $cols->execute();
                $bpCols = $cols->fetchAll(PDO::FETCH_COLUMN);
                if (in_array('won_auctions', $bpCols)) {
                    $inc = $db->prepare("UPDATE buyer_profiles SET won_auctions = COALESCE(won_auctions,0) + 1 WHERE user_id = :uid");
                    $inc->execute([':uid' => $winnerBid['bidder_id']]);
                }

                // Send email to winner if user has email and notifications enabled
                // Fetch user email
                $userStmt = $db->prepare("SELECT email, email_notifications FROM users WHERE id = :uid");
                $userStmt->execute([':uid' => $winnerBid['bidder_id']]);
                $u = $userStmt->fetch(PDO::FETCH_ASSOC);
                if ($u && !empty($u['email']) && ($u['email_notifications'] ?? true)) {
                    // Compose simple email using mail() fallback
                    $subject = "You won an auction on BidKE";
                    $message = "Congratulations! You have won auction #{$auctionId}. Please login to complete payment and arrange collection.";
                    // Prefer PHPMailer or similar in production; use mail() here
                    @mail($u['email'], $subject, $message);
                }

                $finalized[] = ['auction_id' => $auctionId, 'winner_bid' => $winnerBid['bid_amount'], 'winner_id' => $winnerBid['bidder_id']];
            } else {
                // No bids: mark ended without winner
                $update = $db->prepare("UPDATE auctions SET status = 'ended', updated_at = NOW() WHERE id = :id");
                $update->execute([':id' => $auctionId]);
                $finalized[] = ['auction_id' => $auctionId, 'winner_bid' => null, 'winner_id' => null];
            }

            $db->commit();
        } catch (Exception $ex) {
            $db->rollBack();
            error_log('finalize auction error for ' . $auctionId . ': ' . $ex->getMessage());
            continue;
        }
    }

    echo json_encode(['success' => true, 'finalized' => $finalized]);
} catch (Exception $e) {
    error_log('auctions/finalize.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
