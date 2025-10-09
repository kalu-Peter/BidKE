<?php

/**
 * Notification Helper Functions
 * Centralized functions for sending notifications to users
 */

require_once __DIR__ . '/../config/connect.php';

class NotificationHelper
{

    /**
     * Send a notification to a user
     * 
     * @param int $userId - User ID to send notification to
     * @param string $type - Notification type (outbid, approval, rejection, won_auction, payment_received, general, info_request)
     * @param string $title - Notification title
     * @param string $message - Notification message
     * @param array $data - Additional data (auction_id, amounts, etc.)
     * @return bool - True if successful, false otherwise
     */
    public static function sendNotification($userId, $type, $title, $message, $data = null)
    {
        try {
            $pdo = Database::getInstance()->getConnection();

            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (:user_id, :type, :title, :message, :data)
            ");

            $result = $stmt->execute([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data ? json_encode($data) : null
            ]);

            return $result;
        } catch (Exception $e) {
            error_log("NotificationHelper::sendNotification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification when admin requests additional information from seller
     * 
     * @param int $sellerId - Seller user ID
     * @param int $auctionId - Auction ID
     * @param string $auctionTitle - Auction title
     * @param string $requestMessage - The message from admin requesting info
     * @return bool
     */
    public static function sendInfoRequestNotification($sellerId, $auctionId, $auctionTitle, $requestMessage)
    {
        $title = "Additional Information Required";
        $message = "An admin has requested additional information for your auction listing: \"$auctionTitle\". 
                   
Details: $requestMessage

Please log in to your dashboard and update your listing with the requested information.";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'request_message' => $requestMessage,
            'action_required' => true
        ];

        return self::sendNotification($sellerId, 'info_request', $title, $message, $data);
    }

    /**
     * Send notification when auction is approved
     * 
     * @param int $sellerId - Seller user ID  
     * @param int $auctionId - Auction ID
     * @param string $auctionTitle - Auction title
     * @return bool
     */
    public static function sendAuctionApprovedNotification($sellerId, $auctionId, $auctionTitle)
    {
        $title = "Auction Approved & Live";
        $message = "Great news! Your auction listing \"$auctionTitle\" has been approved by our team and is now live for bidding.";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'status' => 'approved'
        ];

        return self::sendNotification($sellerId, 'approval', $title, $message, $data);
    }

    /**
     * Send notification when auction is rejected
     * 
     * @param int $sellerId - Seller user ID
     * @param int $auctionId - Auction ID
     * @param string $auctionTitle - Auction title
     * @param string $rejectionReason - Reason for rejection
     * @return bool
     */
    public static function sendAuctionRejectedNotification($sellerId, $auctionId, $auctionTitle, $rejectionReason)
    {
        $title = "Auction Listing Rejected";
        $message = "Unfortunately, your auction listing \"$auctionTitle\" has been rejected by our review team.
                   
Reason: $rejectionReason

You can revise your listing and resubmit it for review. Please make the necessary changes and try again.";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'rejection_reason' => $rejectionReason,
            'status' => 'rejected'
        ];

        return self::sendNotification($sellerId, 'rejection', $title, $message, $data);
    }

    /**
     * Send notification when user is outbid
     * 
     * @param int $userId - User ID who was outbid
     * @param int $auctionId - Auction ID
     * @param string $auctionTitle - Auction title
     * @param float $newBidAmount - The new higher bid amount
     * @return bool
     */
    public static function sendOutbidNotification($userId, $auctionId, $auctionTitle, $newBidAmount)
    {
        $title = "You've Been Outbid";
        $message = "Someone has placed a higher bid on \"$auctionTitle\". 
                   
Current highest bid: KSh " . number_format($newBidAmount, 2) . "

Place a new bid to stay in the running!";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'new_bid_amount' => $newBidAmount
        ];

        return self::sendNotification($userId, 'outbid', $title, $message, $data);
    }

    /**
     * Send notification when user wins an auction
     * 
     * @param int $userId - Winner user ID
     * @param int $auctionId - Auction ID
     * @param string $auctionTitle - Auction title
     * @param float $winningAmount - Final winning bid amount
     * @return bool
     */
    public static function sendAuctionWonNotification($userId, $auctionId, $auctionTitle, $winningAmount)
    {
        $title = "Congratulations! You Won the Auction";
        $message = "You've successfully won the auction for \"$auctionTitle\" with a bid of KSh " . number_format($winningAmount, 2) . ".
                   
Please complete the payment to finalize your purchase. Check your dashboard for payment instructions.";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'winning_amount' => $winningAmount
        ];

        return self::sendNotification($userId, 'won_auction', $title, $message, $data);
    }

    /**
     * Send notification when seller receives payment
     * 
     * @param int $sellerId - Seller user ID
     * @param int $auctionId - Auction ID  
     * @param string $auctionTitle - Auction title
     * @param float $paymentAmount - Payment amount received
     * @return bool
     */
    public static function sendPaymentReceivedNotification($sellerId, $auctionId, $auctionTitle, $paymentAmount)
    {
        $title = "Payment Received";
        $message = "You've received payment for your auction \"$auctionTitle\". 
                   
Amount: KSh " . number_format($paymentAmount, 2) . "

The funds will be processed according to your payout method settings.";

        $data = [
            'auction_id' => $auctionId,
            'auction_title' => $auctionTitle,
            'payment_amount' => $paymentAmount
        ];

        return self::sendNotification($sellerId, 'payment_received', $title, $message, $data);
    }

    /**
     * Get unread notification count for a user
     * 
     * @param int $userId - User ID
     * @return int - Number of unread notifications
     */
    public static function getUnreadCount($userId)
    {
        try {
            $pdo = Database::getInstance()->getConnection();

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = FALSE");
            $stmt->execute(['user_id' => $userId]);

            return (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            error_log("NotificationHelper::getUnreadCount error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Mark notifications as read
     * 
     * @param int $userId - User ID
     * @param array $notificationIds - Array of notification IDs to mark as read (optional, if empty marks all)
     * @return bool
     */
    public static function markAsRead($userId, $notificationIds = [])
    {
        try {
            $pdo = Database::getInstance()->getConnection();

            if (empty($notificationIds)) {
                // Mark all as read
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id AND is_read = FALSE");
                $stmt->execute(['user_id' => $userId]);
            } else {
                // Mark specific notifications as read
                $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id IN ($placeholders)");
                $params = array_merge([$userId], $notificationIds);
                $stmt->execute($params);
            }

            return true;
        } catch (Exception $e) {
            error_log("NotificationHelper::markAsRead error: " . $e->getMessage());
            return false;
        }
    }
}
