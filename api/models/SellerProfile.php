<?php
require_once '../config/connect.php';

/**
 * Seller Profile Model for BidKE
 * Handles seller-specific profile information and business details
 */
class SellerProfile {
    private $conn;
    private $table_name = "seller_profiles";

    // Profile properties
    public $id;
    public $user_id;
    public $business_name;
    public $business_type;
    public $business_registration;
    public $tax_pin;
    public $business_permit;
    public $business_verified;
    public $verification_status;
    public $verification_documents;
    public $verified_at;
    public $verified_by;
    public $verification_notes;
    public $business_address;
    public $business_phone;
    public $business_email;
    public $website_url;
    public $business_description;
    public $operating_hours;
    public $service_areas;
    public $specializations;
    public $bank_account_name;
    public $bank_account_number;
    public $bank_name;
    public $bank_branch;
    public $bank_code;
    public $mobile_money_number;
    public $mobile_money_provider;
    public $commission_rate;
    public $listing_fee;
    public $auto_renewal;
    public $reserve_price_required;
    public $immediate_payment_required;
    public $total_listings;
    public $active_listings;
    public $completed_sales;
    public $total_revenue;
    public $average_sale_price;
    public $seller_rating;
    public $total_seller_reviews;
    public $response_time_hours;
    public $fulfillment_rate;
    public $seller_status;
    public $can_list_auctions;
    public $can_accept_payments;
    public $max_active_listings;
    public $subscription_plan;
    public $subscription_expires_at;
    public $featured_listings_remaining;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Get seller profile by user ID
     */
    public function getByUserId($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);

        if ($stmt->execute()) {
            $row = $stmt->fetch();
            if ($row) {
                $this->setProperties($row);
                return true;
            }
        }
        return false;
    }

    /**
     * Create seller profile
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, business_name, business_type, verification_status) 
                  VALUES (?, ?, ?, ?)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $this->business_name);
        $stmt->bindParam(3, $this->business_type);
        $stmt->bindParam(4, $this->verification_status);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update seller profile
     */
    public function update($data) {
        $allowedFields = [
            'business_name', 'business_type', 'business_registration', 'tax_pin', 'business_permit',
            'business_address', 'business_phone', 'business_email', 'website_url', 'business_description',
            'operating_hours', 'service_areas', 'specializations', 'bank_account_name', 'bank_account_number',
            'bank_name', 'bank_branch', 'bank_code', 'mobile_money_number', 'mobile_money_provider',
            'auto_renewal', 'reserve_price_required', 'immediate_payment_required'
        ];

        $updateFields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updateFields[] = $key . " = ?";
                // Handle special field types
                if ($key === 'operating_hours') {
                    $values[] = json_encode($value);
                } elseif (in_array($key, ['service_areas', 'specializations', 'verification_documents'])) {
                    $values[] = '{' . implode(',', (array)$value) . '}';
                } else {
                    $values[] = $value;
                }
            }
        }

        if (empty($updateFields)) {
            return false;
        }

        $values[] = $this->user_id;
        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * Update business verification status
     */
    public function updateVerificationStatus($status, $verified_by = null, $notes = null, $documents = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET verification_status = ?, verified_by = ?, verification_notes = ?";
        
        if ($documents) {
            $query .= ", verification_documents = ?";
        }
        
        if ($status === 'verified') {
            $query .= ", business_verified = TRUE, verified_at = NOW()";
        }
        
        $query .= ", updated_at = NOW() WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $params = [$status, $verified_by, $notes];
        
        if ($documents) {
            $params[] = '{' . implode(',', (array)$documents) . '}';
        }
        
        $params[] = $this->user_id;
        
        return $stmt->execute($params);
    }

    /**
     * Update selling statistics
     */
    public function updateSellingStats($sale_amount, $listing_count_change = 0, $active_listings_change = 0) {
        try {
            $this->conn->beginTransaction();

            $query = "UPDATE " . $this->table_name . " 
                      SET total_listings = total_listings + ?,
                          active_listings = GREATEST(0, active_listings + ?),
                          completed_sales = completed_sales + 1,
                          total_revenue = total_revenue + ?,
                          average_sale_price = (total_revenue + ?) / (completed_sales + 1),
                          updated_at = NOW()
                      WHERE user_id = ?";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $listing_count_change);
            $stmt->bindParam(2, $active_listings_change);
            $stmt->bindParam(3, $sale_amount);
            $stmt->bindParam(4, $sale_amount);
            $stmt->bindParam(5, $this->user_id);

            if ($stmt->execute()) {
                $this->conn->commit();
                return true;
            }

            $this->conn->rollback();
            return false;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Selling stats update error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update seller rating
     */
    public function updateRating($new_rating) {
        $query = "UPDATE " . $this->table_name . " 
                  SET seller_rating = (seller_rating * total_seller_reviews + ?) / (total_seller_reviews + 1),
                      total_seller_reviews = total_seller_reviews + 1,
                      updated_at = NOW()
                  WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $new_rating);
        $stmt->bindParam(2, $this->user_id);

        return $stmt->execute();
    }

    /**
     * Update seller status
     */
    public function updateStatus($status, $can_list = null, $can_accept_payments = null) {
        $query = "UPDATE " . $this->table_name . " SET seller_status = ?";
        $params = [$status];

        if ($can_list !== null) {
            $query .= ", can_list_auctions = ?";
            $params[] = $can_list;
        }

        if ($can_accept_payments !== null) {
            $query .= ", can_accept_payments = ?";
            $params[] = $can_accept_payments;
        }

        $query .= ", updated_at = NOW() WHERE user_id = ?";
        $params[] = $this->user_id;

        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Update subscription
     */
    public function updateSubscription($plan, $expires_at = null, $featured_listings = 0) {
        $query = "UPDATE " . $this->table_name . " 
                  SET subscription_plan = ?, subscription_expires_at = ?, featured_listings_remaining = ?, updated_at = NOW() 
                  WHERE user_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $plan);
        $stmt->bindParam(2, $expires_at);
        $stmt->bindParam(3, $featured_listings);
        $stmt->bindParam(4, $this->user_id);

        return $stmt->execute();
    }

    /**
     * Get pending verifications
     */
    public static function getPendingVerifications($limit = 20, $offset = 0) {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT sp.*, u.username, u.email 
                  FROM seller_profiles sp
                  JOIN users u ON sp.user_id = u.id
                  WHERE sp.verification_status = 'pending'
                  ORDER BY sp.created_at ASC
                  LIMIT ? OFFSET ?";

        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get top sellers by revenue
     */
    public static function getTopSellers($limit = 10) {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT sp.*, u.username, u.email 
                  FROM seller_profiles sp
                  JOIN users u ON sp.user_id = u.id
                  WHERE sp.seller_status = 'active' AND sp.business_verified = TRUE
                  ORDER BY sp.total_revenue DESC
                  LIMIT ?";

        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get seller statistics
     */
    public static function getSellerStatistics() {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT 
                    COUNT(*) as total_sellers,
                    COUNT(CASE WHEN business_verified = TRUE THEN 1 END) as verified_sellers,
                    COUNT(CASE WHEN seller_status = 'active' THEN 1 END) as active_sellers,
                    COUNT(CASE WHEN seller_status = 'suspended' THEN 1 END) as suspended_sellers,
                    COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_verifications,
                    COALESCE(AVG(seller_rating), 0) as average_rating,
                    COALESCE(SUM(total_revenue), 0) as total_platform_revenue,
                    COALESCE(AVG(total_revenue), 0) as average_revenue_per_seller
                  FROM seller_profiles";

        $stmt = $db->prepare($query);

        if ($stmt->execute()) {
            return $stmt->fetch();
        }
        return null;
    }

    /**
     * Get seller performance summary
     */
    public function getPerformanceSummary() {
        if (!$this->user_id) {
            return null;
        }

        return [
            'total_listings' => $this->total_listings,
            'active_listings' => $this->active_listings,
            'completed_sales' => $this->completed_sales,
            'total_revenue' => number_format($this->total_revenue, 2),
            'average_sale_price' => number_format($this->average_sale_price, 2),
            'seller_rating' => number_format($this->seller_rating, 2),
            'total_reviews' => $this->total_seller_reviews,
            'response_time_hours' => $this->response_time_hours,
            'fulfillment_rate' => number_format($this->fulfillment_rate, 2),
            'conversion_rate' => $this->total_listings > 0 ? round(($this->completed_sales / $this->total_listings) * 100, 2) : 0
        ];
    }

    /**
     * Check if seller can list auction
     */
    public function canListAuction() {
        return $this->seller_status === 'active' && 
               $this->can_list_auctions && 
               $this->business_verified && 
               $this->active_listings < $this->max_active_listings;
    }

    /**
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->user_id = $row['user_id'];
        $this->business_name = $row['business_name'];
        $this->business_type = $row['business_type'];
        $this->business_registration = $row['business_registration'];
        $this->tax_pin = $row['tax_pin'];
        $this->business_permit = $row['business_permit'];
        $this->business_verified = $row['business_verified'];
        $this->verification_status = $row['verification_status'];
        $this->verification_documents = $row['verification_documents'];
        $this->verified_at = $row['verified_at'];
        $this->verified_by = $row['verified_by'];
        $this->verification_notes = $row['verification_notes'];
        $this->business_address = $row['business_address'];
        $this->business_phone = $row['business_phone'];
        $this->business_email = $row['business_email'];
        $this->website_url = $row['website_url'];
        $this->business_description = $row['business_description'];
        $this->operating_hours = $row['operating_hours'];
        $this->service_areas = $row['service_areas'];
        $this->specializations = $row['specializations'];
        $this->bank_account_name = $row['bank_account_name'];
        $this->bank_account_number = $row['bank_account_number'];
        $this->bank_name = $row['bank_name'];
        $this->bank_branch = $row['bank_branch'];
        $this->bank_code = $row['bank_code'];
        $this->mobile_money_number = $row['mobile_money_number'];
        $this->mobile_money_provider = $row['mobile_money_provider'];
        $this->commission_rate = $row['commission_rate'];
        $this->listing_fee = $row['listing_fee'];
        $this->auto_renewal = $row['auto_renewal'];
        $this->reserve_price_required = $row['reserve_price_required'];
        $this->immediate_payment_required = $row['immediate_payment_required'];
        $this->total_listings = $row['total_listings'];
        $this->active_listings = $row['active_listings'];
        $this->completed_sales = $row['completed_sales'];
        $this->total_revenue = $row['total_revenue'];
        $this->average_sale_price = $row['average_sale_price'];
        $this->seller_rating = $row['seller_rating'];
        $this->total_seller_reviews = $row['total_seller_reviews'];
        $this->response_time_hours = $row['response_time_hours'];
        $this->fulfillment_rate = $row['fulfillment_rate'];
        $this->seller_status = $row['seller_status'];
        $this->can_list_auctions = $row['can_list_auctions'];
        $this->can_accept_payments = $row['can_accept_payments'];
        $this->max_active_listings = $row['max_active_listings'];
        $this->subscription_plan = $row['subscription_plan'];
        $this->subscription_expires_at = $row['subscription_expires_at'];
        $this->featured_listings_remaining = $row['featured_listings_remaining'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }

    /**
     * Convert to array
     */
    public function toArray($includeSensitive = false) {
        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'business_name' => $this->business_name,
            'business_type' => $this->business_type,
            'business_verified' => $this->business_verified,
            'verification_status' => $this->verification_status,
            'verified_at' => $this->verified_at,
            'business_address' => $this->business_address,
            'business_phone' => $this->business_phone,
            'business_email' => $this->business_email,
            'website_url' => $this->website_url,
            'business_description' => $this->business_description,
            'operating_hours' => $this->operating_hours,
            'service_areas' => $this->service_areas,
            'specializations' => $this->specializations,
            'total_listings' => $this->total_listings,
            'active_listings' => $this->active_listings,
            'completed_sales' => $this->completed_sales,
            'total_revenue' => $this->total_revenue,
            'average_sale_price' => $this->average_sale_price,
            'seller_rating' => $this->seller_rating,
            'total_seller_reviews' => $this->total_seller_reviews,
            'response_time_hours' => $this->response_time_hours,
            'fulfillment_rate' => $this->fulfillment_rate,
            'seller_status' => $this->seller_status,
            'can_list_auctions' => $this->can_list_auctions,
            'can_accept_payments' => $this->can_accept_payments,
            'max_active_listings' => $this->max_active_listings,
            'subscription_plan' => $this->subscription_plan,
            'subscription_expires_at' => $this->subscription_expires_at,
            'featured_listings_remaining' => $this->featured_listings_remaining,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];

        if ($includeSensitive) {
            $data['business_registration'] = $this->business_registration;
            $data['tax_pin'] = $this->tax_pin;
            $data['business_permit'] = $this->business_permit;
            $data['verification_documents'] = $this->verification_documents;
            $data['verification_notes'] = $this->verification_notes;
            $data['bank_account_name'] = $this->bank_account_name;
            $data['bank_account_number'] = $this->bank_account_number;
            $data['bank_name'] = $this->bank_name;
            $data['bank_branch'] = $this->bank_branch;
            $data['bank_code'] = $this->bank_code;
            $data['mobile_money_number'] = $this->mobile_money_number;
            $data['mobile_money_provider'] = $this->mobile_money_provider;
        }

        return $data;
    }
}
?>
