<?php
// connect.php is already loaded by the calling script

class AdminProfile {
    private $db;
    private $conn;
    
    // Table name
    private $table = 'admin_profiles';
    
    // Object properties
    public $id;
    public $user_id;
    public $full_name;
    public $position;
    public $department;
    public $employee_id;
    public $phone_extension;
    public $office_location;
    public $bio;
    public $profile_image_url;
    public $emergency_contact_name;
    public $emergency_contact_phone;
    public $emergency_contact_relationship;
    public $date_hired;
    public $last_login_at;
    public $permissions;
    public $settings;
    public $is_super_admin;
    public $is_active;
    public $created_at;
    public $updated_at;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Create admin profile
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  (user_id, full_name, position, department, employee_id, 
                   phone_extension, office_location, bio, profile_image_url,
                   emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                   date_hired, permissions, settings, is_super_admin, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->department = htmlspecialchars(strip_tags($this->department));
        $this->employee_id = htmlspecialchars(strip_tags($this->employee_id));
        $this->phone_extension = htmlspecialchars(strip_tags($this->phone_extension));
        $this->office_location = htmlspecialchars(strip_tags($this->office_location));
        $this->bio = htmlspecialchars(strip_tags($this->bio));
        $this->profile_image_url = htmlspecialchars(strip_tags($this->profile_image_url));
        $this->emergency_contact_name = htmlspecialchars(strip_tags($this->emergency_contact_name));
        $this->emergency_contact_phone = htmlspecialchars(strip_tags($this->emergency_contact_phone));
        $this->emergency_contact_relationship = htmlspecialchars(strip_tags($this->emergency_contact_relationship));
        
        // Bind data
        $stmt->execute([
            $this->user_id,
            $this->full_name,
            $this->position,
            $this->department,
            $this->employee_id,
            $this->phone_extension,
            $this->office_location,
            $this->bio,
            $this->profile_image_url,
            $this->emergency_contact_name,
            $this->emergency_contact_phone,
            $this->emergency_contact_relationship,
            $this->date_hired,
            json_encode($this->permissions),
            json_encode($this->settings),
            $this->is_super_admin ? 1 : 0,
            $this->is_active ? 1 : 0
        ]);
        
        if ($stmt->rowCount() > 0) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    /**
     * Read admin profile by user ID
     */
    public function getByUserId($user_id) {
        $query = "SELECT ap.*, u.username, u.email, u.phone
                  FROM " . $this->table . " ap
                  LEFT JOIN users u ON ap.user_id = u.id
                  WHERE ap.user_id = ?
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapRowToProperties($row);
            return $row;
        }
        
        return false;
    }
    
    /**
     * Read admin profile by ID
     */
    public function getById($id) {
        $query = "SELECT ap.*, u.username, u.email, u.phone
                  FROM " . $this->table . " ap
                  LEFT JOIN users u ON ap.user_id = u.id
                  WHERE ap.id = ?
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapRowToProperties($row);
            return $row;
        }
        
        return false;
    }
    
    /**
     * Update admin profile
     */
    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET full_name = ?, position = ?, department = ?, employee_id = ?,
                      phone_extension = ?, office_location = ?, bio = ?, profile_image_url = ?,
                      emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relationship = ?,
                      date_hired = ?, permissions = ?, settings = ?, is_super_admin = ?, is_active = ?
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->department = htmlspecialchars(strip_tags($this->department));
        $this->employee_id = htmlspecialchars(strip_tags($this->employee_id));
        $this->phone_extension = htmlspecialchars(strip_tags($this->phone_extension));
        $this->office_location = htmlspecialchars(strip_tags($this->office_location));
        $this->bio = htmlspecialchars(strip_tags($this->bio));
        $this->profile_image_url = htmlspecialchars(strip_tags($this->profile_image_url));
        $this->emergency_contact_name = htmlspecialchars(strip_tags($this->emergency_contact_name));
        $this->emergency_contact_phone = htmlspecialchars(strip_tags($this->emergency_contact_phone));
        $this->emergency_contact_relationship = htmlspecialchars(strip_tags($this->emergency_contact_relationship));
        
        // Bind data
        return $stmt->execute([
            $this->full_name,
            $this->position,
            $this->department,
            $this->employee_id,
            $this->phone_extension,
            $this->office_location,
            $this->bio,
            $this->profile_image_url,
            $this->emergency_contact_name,
            $this->emergency_contact_phone,
            $this->emergency_contact_relationship,
            $this->date_hired,
            json_encode($this->permissions),
            json_encode($this->settings),
            $this->is_super_admin ? 1 : 0,
            $this->is_active ? 1 : 0,
            $this->id
        ]);
    }
    
    /**
     * Delete admin profile
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$this->id]);
    }
    
    /**
     * Get all admin profiles
     */
    public function getAll($limit = 50, $offset = 0) {
        $query = "SELECT ap.*, u.username, u.email, u.phone
                  FROM " . $this->table . " ap
                  LEFT JOIN users u ON ap.user_id = u.id
                  ORDER BY ap.created_at DESC
                  LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$limit, $offset]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get active admin profiles
     */
    public function getActive() {
        $query = "SELECT ap.*, u.username, u.email, u.phone
                  FROM " . $this->table . " ap
                  LEFT JOIN users u ON ap.user_id = u.id
                  WHERE ap.is_active = true
                  ORDER BY ap.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get super admin profiles
     */
    public function getSuperAdmins() {
        $query = "SELECT ap.*, u.username, u.email, u.phone
                  FROM " . $this->table . " ap
                  LEFT JOIN users u ON ap.user_id = u.id
                  WHERE ap.is_super_admin = true AND ap.is_active = true
                  ORDER BY ap.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update last login time
     */
    public function updateLastLogin($user_id) {
        $query = "UPDATE " . $this->table . " SET last_login_at = NOW() WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$user_id]);
    }
    
    /**
     * Check if profile exists for user
     */
    public function existsForUser($user_id) {
        $query = "SELECT id FROM " . $this->table . " WHERE user_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Map database row to object properties
     */
    private function mapRowToProperties($row) {
        $this->id = $row['id'];
        $this->user_id = $row['user_id'];
        $this->full_name = $row['full_name'];
        $this->position = $row['position'];
        $this->department = $row['department'];
        $this->employee_id = $row['employee_id'];
        $this->phone_extension = $row['phone_extension'];
        $this->office_location = $row['office_location'];
        $this->bio = $row['bio'];
        $this->profile_image_url = $row['profile_image_url'];
        $this->emergency_contact_name = $row['emergency_contact_name'];
        $this->emergency_contact_phone = $row['emergency_contact_phone'];
        $this->emergency_contact_relationship = $row['emergency_contact_relationship'];
        $this->date_hired = $row['date_hired'];
        $this->last_login_at = $row['last_login_at'];
        $this->permissions = json_decode($row['permissions'], true);
        $this->settings = json_decode($row['settings'], true);
        $this->is_super_admin = $row['is_super_admin'];
        $this->is_active = $row['is_active'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }
    
    /**
     * Get admin profile statistics
     */
    public function getStats() {
        $stats = [];
        
        // Total admin profiles
        $query = "SELECT COUNT(*) as total FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Active admin profiles
        $query = "SELECT COUNT(*) as active FROM " . $this->table . " WHERE is_active = true";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['active'] = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
        
        // Super admins
        $query = "SELECT COUNT(*) as super_admins FROM " . $this->table . " WHERE is_super_admin = true AND is_active = true";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['super_admins'] = $stmt->fetch(PDO::FETCH_ASSOC)['super_admins'];
        
        // Departments
        $query = "SELECT department, COUNT(*) as count FROM " . $this->table . " WHERE is_active = true GROUP BY department ORDER BY count DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['departments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
    }
}
?>
