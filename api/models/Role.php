<?php
require_once '../config/connect.php';

/**
 * Role Model for BidKE
 * Manages user roles and permissions
 */
class Role {
    private $conn;
    private $table_name = "roles";

    // Role properties
    public $id;
    public $role_name;
    public $display_name;
    public $description;
    public $is_active;
    public $can_login;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Get all active roles
     */
    public function getAllActive() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE is_active = TRUE ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get role by name
     */
    public function getByName($role_name) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE role_name = ? AND is_active = TRUE";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $role_name);
        
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
     * Get role by ID
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? AND is_active = TRUE";
        $stmt = $this->conn->prepare($query);
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
     * Create new role
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (role_name, display_name, description, is_active, can_login) 
                  VALUES (?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->role_name = htmlspecialchars(strip_tags($this->role_name));
        $this->display_name = htmlspecialchars(strip_tags($this->display_name));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(1, $this->role_name);
        $stmt->bindParam(2, $this->display_name);
        $stmt->bindParam(3, $this->description);
        $stmt->bindParam(4, $this->is_active);
        $stmt->bindParam(5, $this->can_login);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Update role
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET display_name = ?, description = ?, is_active = ?, can_login = ?, updated_at = NOW() 
                  WHERE id = ?";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->display_name = htmlspecialchars(strip_tags($this->display_name));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(1, $this->display_name);
        $stmt->bindParam(2, $this->description);
        $stmt->bindParam(3, $this->is_active);
        $stmt->bindParam(4, $this->can_login);
        $stmt->bindParam(5, $this->id);

        return $stmt->execute();
    }

    /**
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->role_name = $row['role_name'];
        $this->display_name = $row['display_name'];
        $this->description = $row['description'];
        $this->is_active = $row['is_active'];
        $this->can_login = $row['can_login'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }

    /**
     * Convert to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'role_name' => $this->role_name,
            'display_name' => $this->display_name,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'can_login' => $this->can_login,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
?>
