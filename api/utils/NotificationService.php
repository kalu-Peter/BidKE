<?php
// Notification helper functions
class NotificationService
{
    private $pdo;

    public function __construct($pdo = null)
    {
        if ($pdo === null) {
            $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
            $this->pdo = new PDO($dsn, 'postgres', 'webwiz', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        } else {
            $this->pdo = $pdo;
        }
    }

    /**
     * Send a notification to a user
     */
    public function sendNotification($userId, $type, $title, $message, $data = null)
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (:user_id, :type, :title, :message, :data)
                RETURNING id
            ");

            $stmt->execute([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data ? json_encode($data) : null
            ]);

            return $stmt->fetchColumn();
        } catch (Exception $e) {
            error_log("Failed to send notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notify user when they've been outbid
     */
    public function notifyOutbid($userId, $auctionId, $auctionTitle, $newBidAmount)
    {
        return $this->sendNotification(
            $userId,
            'outbid',
            'You have been outbid!',
            "Someone placed a higher bid on {$auctionTitle}.",
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle,
                'amount' => $newBidAmount
            ]
        );
    }

    /**
     * Notify seller when their item is approved
     */
    public function notifyItemApproved($sellerId, $auctionId, $auctionTitle)
    {
        return $this->sendNotification(
            $sellerId,
            'approval',
            'Item Approved!',
            "Your listing '{$auctionTitle}' has been approved and is now live.",
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle
            ]
        );
    }

    /**
     * Notify seller when their item is rejected
     */
    public function notifyItemRejected($sellerId, $auctionId, $auctionTitle, $reason = '')
    {
        $message = "Your listing '{$auctionTitle}' has been rejected.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        return $this->sendNotification(
            $sellerId,
            'rejection',
            'Item Rejected',
            $message,
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle,
                'reason' => $reason
            ]
        );
    }

    /**
     * Notify user when they win an auction
     */
    public function notifyWonAuction($winnerId, $auctionId, $auctionTitle, $winningAmount)
    {
        return $this->sendNotification(
            $winnerId,
            'won_auction',
            'Congratulations! You won an auction!',
            "You won the auction for '{$auctionTitle}' with a bid of Ksh " . number_format($winningAmount) . ".",
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle,
                'amount' => $winningAmount
            ]
        );
    }

    /**
     * Notify seller when they receive payment
     */
    public function notifyPaymentReceived($sellerId, $auctionId, $auctionTitle, $amount)
    {
        return $this->sendNotification(
            $sellerId,
            'payment_received',
            'Payment Received!',
            "You have received payment of Ksh " . number_format($amount) . " for '{$auctionTitle}'.",
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle,
                'amount' => $amount
            ]
        );
    }

    /**
     * Notify user about auction ending soon (for watched items)
     */
    public function notifyAuctionEndingSoon($userId, $auctionId, $auctionTitle, $timeLeft)
    {
        return $this->sendNotification(
            $userId,
            'general',
            'Auction Ending Soon!',
            "The auction for '{$auctionTitle}' is ending in {$timeLeft}. Don't miss your chance to bid!",
            [
                'auction_id' => $auctionId,
                'auction_title' => $auctionTitle
            ]
        );
    }

    /**
     * Send a general notification
     */
    public function notifyGeneral($userId, $title, $message, $data = null)
    {
        return $this->sendNotification($userId, 'general', $title, $message, $data);
    }
}

// Helper function for easy access
function getNotificationService($pdo = null)
{
    return new NotificationService($pdo);
}
