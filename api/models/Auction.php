<?php
require_once '../config/connect.php';

/**
 * Auction Model for BidKE
 * Handles auction creation and management
 */
class Auction {
    private $db;
    private $table_name = "auctions";

    // Auction properties
    public $id;
    public $seller_id;
    public $category_id;
    public $title;
    public $description;
    public $starting_price;
    public $reserve_price;
    public $current_bid;
    public $bid_increment;
    public $start_time;
    public $end_time;
    public $status;
    public $featured;
    public $view_count;
    public $bid_count;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create new auction
     */
    public function create() {
        try {
            $this->db->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " 
                      (seller_id, category_id, title, description, starting_price, reserve_price, 
                       bid_increment, start_time, end_time, status, featured) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->seller_id);
            $stmt->bindParam(2, $this->category_id);
            $stmt->bindParam(3, $this->title);
            $stmt->bindParam(4, $this->description);
            $stmt->bindParam(5, $this->starting_price);
            $stmt->bindParam(6, $this->reserve_price);
            $stmt->bindParam(7, $this->bid_increment);
            $stmt->bindParam(8, $this->start_time);
            $stmt->bindParam(9, $this->end_time);
            $stmt->bindParam(10, $this->status);
            $stmt->bindParam(11, $this->featured);

            if ($stmt->execute()) {
                $this->id = $this->db->lastInsertId();
                $this->db->commit();
                return $this->id;
            }

            $this->db->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Auction creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get category ID by slug or name
     */
    public function getCategoryId($categoryIdentifier) {
        $query = "SELECT id FROM categories WHERE (slug = ? OR name = ?) AND is_active = true";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $categoryIdentifier);
        $stmt->bindParam(2, $categoryIdentifier);
        
        if ($stmt->execute()) {
            $row = $stmt->fetch();
            return $row ? $row['id'] : null;
        }
        return null;
    }

    /**
     * Add images to auction
     */
    public function addImages($auction_id, $images) {
        try {
            $this->db->beginTransaction();

            foreach ($images as $index => $image) {
                $query = "INSERT INTO auction_images (auction_id, image_url, alt_text, is_primary, sort_order) 
                         VALUES (?, ?, ?, ?, ?)";
                $stmt = $this->db->prepare($query);
                
                $is_primary = ($index === 0); // First image is primary
                $alt_text = $image['alt_text'] ?? '';
                
                $stmt->bindParam(1, $auction_id);
                $stmt->bindParam(2, $image['url']);
                $stmt->bindParam(3, $alt_text);
                $stmt->bindParam(4, $is_primary);
                $stmt->bindParam(5, $index);
                
                if (!$stmt->execute()) {
                    $this->db->rollback();
                    return false;
                }
            }

            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Image addition error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get auction by ID
     */
    public function findById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        
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
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->seller_id = $row['seller_id'];
        $this->category_id = $row['category_id'];
        $this->title = $row['title'];
        $this->description = $row['description'];
        $this->starting_price = $row['starting_price'];
        $this->reserve_price = $row['reserve_price'];
        $this->current_bid = $row['current_bid'];
        $this->bid_increment = $row['bid_increment'];
        $this->start_time = $row['start_time'];
        $this->end_time = $row['end_time'];
        $this->status = $row['status'];
        $this->featured = $row['featured'];
        $this->view_count = $row['view_count'];
        $this->bid_count = $row['bid_count'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }

    /**
     * Update auction status
     */
    public function updateStatus($status) {
        $query = "UPDATE " . $this->table_name . " SET status = ?, updated_at = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $status);
        $stmt->bindParam(2, $this->id);
        
        return $stmt->execute();
    }
}
?>
