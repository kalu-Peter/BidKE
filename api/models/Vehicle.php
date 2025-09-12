<?php
require_once '../config/connect.php';

/**
 * Vehicle Model for BidKE
 * Handles vehicle-specific data for auctions
 */
class Vehicle {
    private $db;
    private $table_name = "vehicles";

    // Vehicle properties
    public $id;
    public $auction_id;
    public $vehicle_type;
    public $make;
    public $model;
    public $year;
    public $registration_number;
    public $engine_capacity;
    public $fuel_type;
    public $transmission;
    public $mileage;
    public $color;
    public $condition;
    public $location;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create new vehicle record
     */
    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                      (auction_id, vehicle_type, make, model, year, registration_number, 
                       engine_capacity, fuel_type, transmission, mileage, color, condition, location) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->auction_id);
            $stmt->bindParam(2, $this->vehicle_type);
            $stmt->bindParam(3, $this->make);
            $stmt->bindParam(4, $this->model);
            $stmt->bindParam(5, $this->year);
            $stmt->bindParam(6, $this->registration_number);
            $stmt->bindParam(7, $this->engine_capacity);
            $stmt->bindParam(8, $this->fuel_type);
            $stmt->bindParam(9, $this->transmission);
            $stmt->bindParam(10, $this->mileage);
            $stmt->bindParam(11, $this->color);
            $stmt->bindParam(12, $this->condition);
            $stmt->bindParam(13, $this->location);

            if ($stmt->execute()) {
                $this->id = $this->db->lastInsertId();
                return $this->id;
            }

            return false;
            
        } catch (Exception $e) {
            error_log("Vehicle creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get vehicle by auction ID
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
        $this->vehicle_type = $row['vehicle_type'];
        $this->make = $row['make'];
        $this->model = $row['model'];
        $this->year = $row['year'];
        $this->registration_number = $row['registration_number'];
        $this->engine_capacity = $row['engine_capacity'];
        $this->fuel_type = $row['fuel_type'];
        $this->transmission = $row['transmission'];
        $this->mileage = $row['mileage'];
        $this->color = $row['color'];
        $this->condition = $row['condition'];
        $this->location = $row['location'];
        $this->created_at = $row['created_at'];
    }

    /**
     * Update vehicle information
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET vehicle_type = ?, make = ?, model = ?, year = ?, registration_number = ?, 
                      engine_capacity = ?, fuel_type = ?, transmission = ?, mileage = ?, 
                      color = ?, condition = ?, location = ?
                  WHERE id = ?";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(1, $this->vehicle_type);
        $stmt->bindParam(2, $this->make);
        $stmt->bindParam(3, $this->model);
        $stmt->bindParam(4, $this->year);
        $stmt->bindParam(5, $this->registration_number);
        $stmt->bindParam(6, $this->engine_capacity);
        $stmt->bindParam(7, $this->fuel_type);
        $stmt->bindParam(8, $this->transmission);
        $stmt->bindParam(9, $this->mileage);
        $stmt->bindParam(10, $this->color);
        $stmt->bindParam(11, $this->condition);
        $stmt->bindParam(12, $this->location);
        $stmt->bindParam(13, $this->id);

        return $stmt->execute();
    }
}
?>
