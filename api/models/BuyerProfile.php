<?php
require_once '../config/connect.php';

/**
 * Buyer Profile Model for BidKE
 * Handles buyer-specific profile information and preferences
 */
class BuyerProfile {
    private $conn;
    private $table_name = "buyer_profiles";

    // Profile properties
    public $id;
    public $user_id;
    public $national_id;
    public $national_id_verified;
    public $national_id_document_url;
    public $preferred_categories;
    public $max_bid_limit;
    public $auto_bid_enabled;
    public $bid_increment_preference;
    public $default_shipping_address;
    public $shipping_instructions;
    public $preferred_delivery_time;
    public $preferred_payment_methods;
    public $total_bids;
    public $successful_bids;
    public $total_spent;
    public $average_bid_amount;
    public $won_auctions;
    public $buyer_rating;
    public $total_reviews;
    public $bid_notifications;
    public $outbid_notifications;
    public $winning_notifications;
    public $auction_ending_notifications;
    public $credit_limit;
    public $is_restricted;
    public $restriction_reason;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Get buyer profile by user ID
     */
    public function getByUserId($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);

        if ($stmt->execute()) {
            $row = $stmt->fetch();
            if ($row) {
                // Convert PostgreSQL arrays to PHP arrays for JSON response
                if (isset($row['preferred_categories']) && $row['preferred_categories']) {
                    $row['preferred_categories'] = $this->parsePostgreSQLArray($row['preferred_categories']);
                }
                if (isset($row['preferred_payment_methods']) && $row['preferred_payment_methods']) {
                    $row['preferred_payment_methods'] = $this->parsePostgreSQLArray($row['preferred_payment_methods']);
                }
                return $row;
            }
        }
        return null;
    }

    /**
     * Parse PostgreSQL array format to PHP array
     */
    private function parsePostgreSQLArray($pgArray) {
        if (empty($pgArray) || $pgArray === '{}') {
            return [];
        }
        
        // Remove the outer braces and split by comma
        $cleaned = trim($pgArray, '{}');
        if (empty($cleaned)) {
            return [];
        }
        
        // Split by comma and clean up quotes
        $items = explode(',', $cleaned);
        return array_map(function($item) {
            return trim($item, '"');
        }, $items);
    }

    /**
     * Create buyer profile
     */
    public function create($data = []) {
        $user_id = $data['user_id'] ?? $this->user_id;
        
        $fields = ['user_id'];
        $placeholders = ['?'];
        $values = [$user_id];
        
        $allowedFields = [
            'national_id', 'national_id_verified', 'preferred_categories', 
            'max_bid_limit', 'auto_bid_enabled', 'default_shipping_address', 
            'preferred_payment_methods', 'bid_notifications', 
            'outbid_notifications', 'winning_notifications', 
            'auction_ending_notifications'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = $field;
                $placeholders[] = '?';
                
                // Handle array fields for PostgreSQL
                if (in_array($field, ['preferred_categories', 'preferred_payment_methods'])) {
                    if (is_array($data[$field]) && !empty($data[$field])) {
                        $escapedValues = array_map(function($item) {
                            return '"' . str_replace('"', '""', $item) . '"';
                        }, $data[$field]);
                        $values[] = '{' . implode(',', $escapedValues) . '}';
                    } elseif (is_string($data[$field]) && $data[$field] !== '') {
                        $values[] = $data[$field];
                    } else {
                        $values[] = null;
                    }
                } else {
                    $values[] = $data[$field];
                }
            }
        }
        
        $query = "INSERT INTO " . $this->table_name . " (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $this->conn->prepare($query);

        if ($stmt->execute($values)) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    /**
     * Update buyer profile by ID
     */
    public function update($id, $data) {
        $allowedFields = [
            'national_id', 'national_id_verified', 'preferred_categories', 
            'max_bid_limit', 'auto_bid_enabled', 'default_shipping_address', 
            'preferred_payment_methods', 'bid_notifications', 
            'outbid_notifications', 'winning_notifications', 
            'auction_ending_notifications'
        ];

        $updateFields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updateFields[] = $key . " = ?";
                $values[] = $value;
            }
        }

        if (empty($updateFields)) {
            return false;
        }

        $values[] = $id;
        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * Get buyer statistics for dashboard
     */
    public function getBuyerStats($user_id) {
        try {
            // For now, return mock data since auction/bid tables might not exist yet
            // TODO: Replace with real queries when auction system is implemented
            
            // Check if buyer profile exists first
            $profileQuery = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE user_id = ?";
            $stmt = $this->conn->prepare($profileQuery);
            $stmt->execute([$user_id]);
            $hasProfile = $stmt->fetch()['count'] > 0;
            
            if (!$hasProfile) {
                // Create buyer profile if it doesn't exist
                $this->create(['user_id' => $user_id]);
            }
            
            // Return sample data for now
            return [
                'activeBids' => 0,
                'watchlistItems' => 0, 
                'wonAuctions' => 0,
                'totalSpent' => 0.0
            ];
            
            /* TODO: Implement when auction tables are ready
            // Get active bids count
            $activeBidsQuery = "SELECT COUNT(*) as count FROM bids b 
                               JOIN auctions a ON b.auction_id = a.id 
                               WHERE b.bidder_id = ? AND a.status = 'active' AND a.end_date > NOW()";
            $stmt = $this->conn->prepare($activeBidsQuery);
            $stmt->execute([$user_id]);
            $activeBids = $stmt->fetch()['count'] ?? 0;

            // Get watchlist count
            $watchlistQuery = "SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?";
            $stmt = $this->conn->prepare($watchlistQuery);
            $stmt->execute([$user_id]);
            $watchlistItems = $stmt->fetch()['count'] ?? 0;

            // Get won auctions count
            $wonQuery = "SELECT COUNT(DISTINCT a.id) as count, COALESCE(SUM(b.bid_amount), 0) as total_spent
                         FROM auctions a 
                         JOIN bids b ON a.id = b.auction_id 
                         WHERE a.winner_id = ? AND a.status = 'ended'";
            $stmt = $this->conn->prepare($wonQuery);
            $stmt->execute([$user_id]);
            $wonData = $stmt->fetch();
            $wonAuctions = $wonData['count'] ?? 0;
            $totalSpent = $wonData['total_spent'] ?? 0;

            return [
                'activeBids' => (int)$activeBids,
                'watchlistItems' => (int)$watchlistItems,
                'wonAuctions' => (int)$wonAuctions,
                'totalSpent' => (float)$totalSpent
            ];
            */
            
        } catch (Exception $e) {
            error_log("Error getting buyer stats: " . $e->getMessage());
            return [
                'activeBids' => 0,
                'watchlistItems' => 0,
                'wonAuctions' => 0,
                'totalSpent' => 0.0
            ];
        }
    }

    /**
     * Update bidding statistics
     */
    public function updateBiddingStats($bid_amount, $won = false) {
        try {
            $this->conn->beginTransaction();

            // Update total bids and spent
            $query = "UPDATE " . $this->table_name . " 
                      SET total_bids = total_bids + 1,
                          total_spent = total_spent + ?,
                          average_bid_amount = (total_spent + ?) / (total_bids + 1),
                          successful_bids = successful_bids + ?,
                          won_auctions = won_auctions + ?,
                          updated_at = NOW()
                      WHERE user_id = ?";

            $stmt = $this->conn->prepare($query);
            $successful_bid = $won ? 1 : 0;
            
            $stmt->bindParam(1, $bid_amount);
            $stmt->bindParam(2, $bid_amount);
            $stmt->bindParam(3, $successful_bid);
            $stmt->bindParam(4, $successful_bid);
            $stmt->bindParam(5, $this->user_id);

            if ($stmt->execute()) {
                $this->conn->commit();
                return true;
            }

            $this->conn->rollback();
            return false;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Bidding stats update error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update buyer rating
     */
    public function updateRating($new_rating) {
        $query = "UPDATE " . $this->table_name . " 
                  SET buyer_rating = (buyer_rating * total_reviews + ?) / (total_reviews + 1),
                      total_reviews = total_reviews + 1,
                      updated_at = NOW()
                  WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $new_rating);
        $stmt->bindParam(2, $this->user_id);

        return $stmt->execute();
    }

    /**
     * Verify national ID
     */
    public function verifyNationalId($document_url = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET national_id_verified = TRUE";
        
        if ($document_url) {
            $query .= ", national_id_document_url = ?";
        }
        
        $query .= ", updated_at = NOW() WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        
        if ($document_url) {
            $stmt->bindParam(1, $document_url);
            $stmt->bindParam(2, $this->user_id);
        } else {
            $stmt->bindParam(1, $this->user_id);
        }

        return $stmt->execute();
    }

    /**
     * Restrict buyer account
     */
    public function restrictAccount($reason) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_restricted = TRUE, restriction_reason = ?, updated_at = NOW() 
                  WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $reason);
        $stmt->bindParam(2, $this->user_id);

        return $stmt->execute();
    }

    /**
     * Unrestrict buyer account
     */
    public function unrestrictAccount() {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_restricted = FALSE, restriction_reason = NULL, updated_at = NOW() 
                  WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);

        return $stmt->execute();
    }

    /**
     * Get top buyers by spending
     */
    public static function getTopBuyers($limit = 10) {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT bp.*, u.username, u.email 
                  FROM buyer_profiles bp
                  JOIN users u ON bp.user_id = u.id
                  WHERE bp.is_restricted = FALSE
                  ORDER BY bp.total_spent DESC
                  LIMIT ?";

        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get buyer statistics
     */
    public static function getBuyerStatistics() {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT 
                    COUNT(*) as total_buyers,
                    COUNT(CASE WHEN national_id_verified = TRUE THEN 1 END) as verified_buyers,
                    COUNT(CASE WHEN is_restricted = TRUE THEN 1 END) as restricted_buyers,
                    COALESCE(AVG(buyer_rating), 0) as average_rating,
                    COALESCE(SUM(total_spent), 0) as total_platform_spending,
                    COALESCE(AVG(total_spent), 0) as average_spending_per_buyer
                  FROM buyer_profiles";

        $stmt = $db->prepare($query);

        if ($stmt->execute()) {
            return $stmt->fetch();
        }
        return null;
    }

    /**
     * Get buyer activity summary
     */
    public function getActivitySummary() {
        if (!$this->user_id) {
            return null;
        }

        return [
            'total_bids' => $this->total_bids,
            'successful_bids' => $this->successful_bids,
            'won_auctions' => $this->won_auctions,
            'total_spent' => number_format($this->total_spent, 2),
            'average_bid_amount' => number_format($this->average_bid_amount, 2),
            'buyer_rating' => number_format($this->buyer_rating, 2),
            'total_reviews' => $this->total_reviews,
            'success_rate' => $this->total_bids > 0 ? round(($this->successful_bids / $this->total_bids) * 100, 2) : 0
        ];
    }

    /**
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->user_id = $row['user_id'];
        $this->national_id = $row['national_id'];
        $this->national_id_verified = $row['national_id_verified'];
        $this->national_id_document_url = $row['national_id_document_url'];
        $this->preferred_categories = $row['preferred_categories'];
        $this->max_bid_limit = $row['max_bid_limit'];
        $this->auto_bid_enabled = $row['auto_bid_enabled'];
        $this->bid_increment_preference = $row['bid_increment_preference'];
        $this->default_shipping_address = $row['default_shipping_address'];
        $this->shipping_instructions = $row['shipping_instructions'];
        $this->preferred_delivery_time = $row['preferred_delivery_time'];
        $this->preferred_payment_methods = $row['preferred_payment_methods'];
        $this->total_bids = $row['total_bids'];
        $this->successful_bids = $row['successful_bids'];
        $this->total_spent = $row['total_spent'];
        $this->average_bid_amount = $row['average_bid_amount'];
        $this->won_auctions = $row['won_auctions'];
        $this->buyer_rating = $row['buyer_rating'];
        $this->total_reviews = $row['total_reviews'];
        $this->bid_notifications = $row['bid_notifications'];
        $this->outbid_notifications = $row['outbid_notifications'];
        $this->winning_notifications = $row['winning_notifications'];
        $this->auction_ending_notifications = $row['auction_ending_notifications'];
        $this->credit_limit = $row['credit_limit'];
        $this->is_restricted = $row['is_restricted'];
        $this->restriction_reason = $row['restriction_reason'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }

    /**
     * Convert to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'national_id' => $this->national_id,
            'national_id_verified' => $this->national_id_verified,
            'national_id_document_url' => $this->national_id_document_url,
            'preferred_categories' => $this->preferred_categories,
            'max_bid_limit' => $this->max_bid_limit,
            'auto_bid_enabled' => $this->auto_bid_enabled,
            'bid_increment_preference' => $this->bid_increment_preference,
            'default_shipping_address' => $this->default_shipping_address,
            'shipping_instructions' => $this->shipping_instructions,
            'preferred_delivery_time' => $this->preferred_delivery_time,
            'preferred_payment_methods' => $this->preferred_payment_methods,
            'total_bids' => $this->total_bids,
            'successful_bids' => $this->successful_bids,
            'total_spent' => $this->total_spent,
            'average_bid_amount' => $this->average_bid_amount,
            'won_auctions' => $this->won_auctions,
            'buyer_rating' => $this->buyer_rating,
            'total_reviews' => $this->total_reviews,
            'bid_notifications' => $this->bid_notifications,
            'outbid_notifications' => $this->outbid_notifications,
            'winning_notifications' => $this->winning_notifications,
            'auction_ending_notifications' => $this->auction_ending_notifications,
            'credit_limit' => $this->credit_limit,
            'is_restricted' => $this->is_restricted,
            'restriction_reason' => $this->restriction_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
?>
