<?php
require_once __DIR__ . '/../config/connect.php';

/**
 * Finalize a single auction: determine winner (highest bid), update auction
 * status, mark bids as 'won'/'outbid', insert into auction_winners, and
 * perform optional profile updates and notifications. Returns an array with
 * success and debug info.
 */
function finalizeAuction(PDO $db, int $auctionId)
{
    $result = ['success' => false, 'auction_id' => $auctionId, 'message' => null];

    // detect bidder column name in bids table
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : 'bidder_id');

    try {
        $db->beginTransaction();

        // Lock auction row
        $lock = $db->prepare("SELECT id, current_price FROM auctions WHERE id = :id FOR UPDATE");
        $lock->execute([':id' => $auctionId]);
        $a = $lock->fetch(PDO::FETCH_ASSOC);
        if (!$a) {
            $db->commit();
            $result['message'] = 'Auction not found';
            return $result;
        }

        // Find highest active/winning bid
        $bidQuery = "SELECT id, " . $bidderCol . " AS bidder_id, bid_amount FROM bids WHERE auction_id = :aid AND (bid_status = 'active' OR bid_status = 'winning') ORDER BY bid_amount DESC, bid_time ASC LIMIT 1";
        $bidStmt = $db->prepare($bidQuery);
        $bidStmt->execute([':aid' => $auctionId]);
        $winnerBid = $bidStmt->fetch(PDO::FETCH_ASSOC);

        if ($winnerBid && isset($winnerBid['bid_amount'])) {
            // Update auction status and final price
            $update = $db->prepare("UPDATE auctions SET status = 'ended', current_price = :price, current_bidder_id = :bidder, updated_at = NOW() WHERE id = :id");
            $update->execute([':price' => $winnerBid['bid_amount'], ':bidder' => $winnerBid['bidder_id'], ':id' => $auctionId]);

            // Update bids statuses
            $winUpdate = $db->prepare("UPDATE bids SET bid_status = CASE WHEN id = :winId THEN 'won' ELSE 'outbid' END WHERE auction_id = :aid AND bid_status IN ('active','winning')");
            $winUpdate->execute([':winId' => $winnerBid['id'], ':aid' => $auctionId]);

            // Insert into auction_winners if table exists
            try {
                $ins = $db->prepare("INSERT INTO auction_winners (auction_id, winner_id, winning_bid_id, winning_amount, created_at) VALUES (:aid, :uid, :bidid, :amount, NOW())");
                $ins->execute([':aid' => $auctionId, ':uid' => $winnerBid['bidder_id'], ':bidid' => $winnerBid['id'], ':amount' => $winnerBid['bid_amount']]);
            } catch (Exception $ie) {
                // Non-fatal: table may not exist, log and continue
                error_log('auction_winners insert failed (finalize helper): ' . $ie->getMessage());
            }

            // Increment buyer_profiles.won_auctions if present
            $colsStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'buyer_profiles'");
            $colsStmt->execute();
            $bpCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('won_auctions', $bpCols)) {
                $inc = $db->prepare("UPDATE buyer_profiles SET won_auctions = COALESCE(won_auctions,0) + 1 WHERE user_id = :uid");
                $inc->execute([':uid' => $winnerBid['bidder_id']]);
            }

            // Notify winner via email if present (disabled on local dev to avoid
            // blocking the finalization when no local SMTP is available). We log
            // an entry so notifications can be implemented later.
            $userStmt = $db->prepare("SELECT email, email_notifications FROM users WHERE id = :uid");
            $userStmt->execute([':uid' => $winnerBid['bidder_id']]);
            $u = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($u && !empty($u['email']) && ($u['email_notifications'] ?? true)) {
                error_log("finalizeAuction: would send mail to {$u['email']} for auction {$auctionId} (email sending disabled in dev)");
            }

            $db->commit();
            $result['success'] = true;
            $result['message'] = 'Finalized with winner';
            $result['winner'] = $winnerBid;
            return $result;
        } else {
            // No bids: mark ended without winner
            $update = $db->prepare("UPDATE auctions SET status = 'ended', updated_at = NOW() WHERE id = :id");
            $update->execute([':id' => $auctionId]);
            $db->commit();
            $result['success'] = true;
            $result['message'] = 'Finalized without winner';
            return $result;
        }
    } catch (Exception $ex) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('finalizeAuction error for ' . $auctionId . ': ' . $ex->getMessage());
        $result['message'] = $ex->getMessage();
        return $result;
    }
}
