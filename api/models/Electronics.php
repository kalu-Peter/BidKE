<?php
require_once '../config/connect.php';

/**
 * Electronics Model for BidKE
 * Handles electronics-specific data for auctions
 */
class Electronics {
    private $db;
    private $table_name = "electronics";

    // Electronics properties
    public $id;
    public $auction_id;
    public $category;
    public $brand;
    public $model;
    public $specs;
    public $serial_number;
    public $condition;
    public $warranty;
    public $location;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create new electronics record
     */
    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                      (auction_id, category, brand, model, specs, serial_number, 
                       condition, warranty, location) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->auction_id);
            $stmt->bindParam(2, $this->category);
            $stmt->bindParam(3, $this->brand);
            $stmt->bindParam(4, $this->model);
            $stmt->bindParam(5, $this->specs);
            $stmt->bindParam(6, $this->serial_number);
            $stmt->bindParam(7, $this->condition);
            $stmt->bindParam(8, $this->warranty);
            $stmt->bindParam(9, $this->location);

            if ($stmt->execute()) {
                $this->id = $this->db->lastInsertId();
                return $this->id;
            }

            return false;
            
        } catch (Exception $e) {
            error_log("Electronics creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get electronics by auction ID
     */
    public function getByAuctionId($auction_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE auction_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $auction_id);
        
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
        $this->auction_id = $row['auction_id'];
        $this->category = $row['category'];
        $this->brand = $row['brand'];
        $this->model = $row['model'];
        $this->specs = $row['specs'];
        $this->serial_number = $row['serial_number'];
        $this->condition = $row['condition'];
        $this->warranty = $row['warranty'];
        $this->location = $row['location'];
        $this->created_at = $row['created_at'];
    }

    /**
     * Update electronics information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET category = ?, brand = ?, model = ?, specs = ?, serial_number = ?, 
                      condition = ?, warranty = ?, location = ?
                  WHERE id = ?";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(1, $this->category);
        $stmt->bindParam(2, $this->brand);
        $stmt->bindParam(3, $this->model);
        $stmt->bindParam(4, $this->specs);
        $stmt->bindParam(5, $this->serial_number);
        $stmt->bindParam(6, $this->condition);
        $stmt->bindParam(7, $this->warranty);
        $stmt->bindParam(8, $this->location);
        $stmt->bindParam(9, $this->id);

        return $stmt->execute();
    }
}
?>
