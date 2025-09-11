<?php
require_once '../config/connect.php';

/**
 * User Model for BidKE Unified Signup System
 * Handles username-based signup and role-based authentication
 */
class User {
    private $db;
    private $table_name = "users";

    // User properties matching database schema
    public $id;
    public $username;
    public $email;
    public $phone;
    public $password_hash;
    public $status;
    public $is_verified;
    public $email_verified_at;
    public $phone_verified_at;
    public $verification_code;
    public $verification_expires;
    public $phone_verification_code;
    public $phone_verification_expires;
    public $avatar_url;
    public $full_name;
    public $bio;
    public $date_of_birth;
    public $address;
    public $city;
    public $state;
    public $postal_code;
    public $country;
    public $preferred_language;
    public $timezone;
    public $email_notifications;
    public $sms_notifications;
    public $last_login_at;
    public $last_login_ip;
    public $last_login_role;
    public $failed_login_attempts;
    public $locked_until;
    public $two_factor_enabled;
    public $two_factor_secret;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create new user with unified signup (username-based)
     * Automatically assigns buyer role
     */
    public function create() {
        try {
            $this->db->beginTransaction();

            // Call the database function to create user with buyer role
            $query = "SELECT create_user_with_buyer_role(?, ?, ?, ?) as user_id";
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->username);
            $stmt->bindParam(2, $this->email);
            $stmt->bindParam(3, $this->phone);
            $stmt->bindParam(4, $this->password_hash);
            
            if ($stmt->execute()) {
                $result = $stmt->fetch();
                if ($result && $result['user_id']) {
                    $this->id = $result['user_id'];
                    $this->db->commit();
                    return $this->id;
                }
            }
            
            $this->db->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("User creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find user by username (for login)
     */
    public function findByUsername($username) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE username = ? AND status != 'banned'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $username);
        
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
     * Find user by email
     */
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? AND status != 'banned'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $email);
        
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
     * Find user by ID
     */
    public function findById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? AND status != 'banned'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        
        if ($stmt->execute()) {
            $row = $stmt->fetch();
            if ($row) {
                $this->setProperties($row);
                return $row; // Return the row data instead of true
            }
        }
        return null; // Return null instead of false for clarity
    }

    /**
     * Get user's available login roles
     */
    public function getLoginRoles($user_id = null) {
        $id = $user_id ?? $this->id;
        
        $query = "SELECT * FROM get_user_login_roles(?)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Verify password
     */
    public function verifyPassword($password) {
        return password_verify($password, $this->password_hash);
    }

    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $username);
        
        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $email);
        
        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    /**
     * Log user login with role selection
     */
    public function logLogin($login_role, $session_token, $ip_address = null, $user_agent = null) {
        try {
            $query = "SELECT log_user_login(?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->id);
            $stmt->bindParam(2, $login_role);
            $stmt->bindParam(3, $session_token);
            $stmt->bindParam(4, $ip_address);
            $stmt->bindParam(5, $user_agent);
            
            return $stmt->execute();
            
        } catch (Exception $e) {
            error_log("Login logging error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile($data) {
        $allowedFields = [
            'full_name', 'bio', 'date_of_birth', 'address', 'city', 'state',
            'postal_code', 'country', 'preferred_language', 'timezone',
            'email_notifications', 'sms_notifications', 'avatar_url'
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

        $values[] = $this->id;
        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * Verify email with code
     */
    public function verifyEmail($verification_code) {
        try {
            $this->db->beginTransaction();

            // Check if verification code is valid
            $query = "SELECT id FROM " . $this->table_name . " WHERE id = ? AND verification_code = ? AND verification_expires > NOW()";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(1, $this->id);
            $stmt->bindParam(2, $verification_code);
            
            if ($stmt->execute() && $stmt->rowCount() > 0) {
                // Update user as verified
                $updateQuery = "UPDATE " . $this->table_name . " SET is_verified = TRUE, email_verified_at = NOW(), verification_code = NULL, verification_expires = NULL, status = 'active', updated_at = NOW() WHERE id = ?";
                $updateStmt = $this->db->prepare($updateQuery);
                $updateStmt->bindParam(1, $this->id);
                
                if ($updateStmt->execute()) {
                    $this->db->commit();
                    return true;
                }
            }
            
            $this->db->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Email verification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate new verification code
     */
    public function generateVerificationCode() {
        $verification_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $query = "UPDATE " . $this->table_name . " SET verification_code = ?, verification_expires = NOW() + INTERVAL '24 HOURS', updated_at = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $verification_code);
        $stmt->bindParam(2, $this->id);
        
        if ($stmt->execute()) {
            $this->verification_code = $verification_code;
            return $verification_code;
        }
        return false;
    }

    /**
     * Apply for seller role
     */
    public function applyForSellerRole($business_name = null, $business_type = 'individual') {
        try {
            $query = "SELECT apply_for_seller_role(?, ?, ?) as success";
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(1, $this->id);
            $stmt->bindParam(2, $business_name);
            $stmt->bindParam(3, $business_type);
            
            if ($stmt->execute()) {
                $result = $stmt->fetch();
                return $result['success'] ?? false;
            }
            
            return false;
            
        } catch (Exception $e) {
            error_log("Seller role application error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update failed login attempts
     */
    public function updateFailedLoginAttempts() {
        $query = "UPDATE " . $this->table_name . " SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    /**
     * Lock user account
     */
    public function lockAccount($minutes = 30) {
        $query = "UPDATE " . $this->table_name . " SET locked_until = NOW() + INTERVAL '{$minutes} MINUTES', updated_at = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    /**
     * Check if account is locked
     */
    public function isAccountLocked() {
        return $this->locked_until && strtotime($this->locked_until) > time();
    }

    /**
     * Get user overview with roles
     */
    public static function getUserOverview($limit = 20, $offset = 0) {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT * FROM user_overview LIMIT ? OFFSET ?";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get user's buyer profile
     */
    public function getBuyerProfile() {
        $query = "SELECT * FROM buyer_profiles WHERE user_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        if ($stmt->execute()) {
            return $stmt->fetch();
        }
        return null;
    }

    /**
     * Get user's seller profile
     */
    public function getSellerProfile() {
        $query = "SELECT * FROM seller_profiles WHERE user_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        if ($stmt->execute()) {
            return $stmt->fetch();
        }
        return null;
    }

    /**
     * Set object properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->username = $row['username'];
        $this->email = $row['email'];
        $this->phone = $row['phone'];
        $this->password_hash = $row['password_hash'];
        $this->status = $row['status'];
        $this->is_verified = $row['is_verified'];
        $this->email_verified_at = $row['email_verified_at'];
        $this->phone_verified_at = $row['phone_verified_at'];
        $this->verification_code = $row['verification_code'];
        $this->verification_expires = $row['verification_expires'];
        $this->phone_verification_code = $row['phone_verification_code'];
        $this->phone_verification_expires = $row['phone_verification_expires'];
        $this->avatar_url = $row['avatar_url'];
        $this->full_name = $row['full_name'];
        $this->bio = $row['bio'];
        $this->date_of_birth = $row['date_of_birth'];
        $this->address = $row['address'];
        $this->city = $row['city'];
        $this->state = $row['state'];
        $this->postal_code = $row['postal_code'];
        $this->country = $row['country'];
        $this->preferred_language = $row['preferred_language'];
        $this->timezone = $row['timezone'];
        $this->email_notifications = $row['email_notifications'];
        $this->sms_notifications = $row['sms_notifications'];
        $this->last_login_at = $row['last_login_at'];
        $this->last_login_ip = $row['last_login_ip'];
        $this->last_login_role = $row['last_login_role'];
        $this->failed_login_attempts = $row['failed_login_attempts'];
        $this->locked_until = $row['locked_until'];
        $this->two_factor_enabled = $row['two_factor_enabled'];
        $this->two_factor_secret = $row['two_factor_secret'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }

    /**
     * Update user data
     */
    public function update($id, $data) {
        $allowedFields = [
            'email', 'phone', 'full_name', 'bio', 'date_of_birth', 'address', 
            'city', 'state', 'postal_code', 'country', 'preferred_language', 
            'timezone', 'email_notifications', 'sms_notifications', 'avatar_url'
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
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * Convert user to array (for JSON response)
     */
    public function toArray($includePassword = false) {
        $data = [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'is_verified' => $this->is_verified,
            'email_verified_at' => $this->email_verified_at,
            'phone_verified_at' => $this->phone_verified_at,
            'avatar_url' => $this->avatar_url,
            'full_name' => $this->full_name,
            'bio' => $this->bio,
            'date_of_birth' => $this->date_of_birth,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'preferred_language' => $this->preferred_language,
            'timezone' => $this->timezone,
            'email_notifications' => $this->email_notifications,
            'sms_notifications' => $this->sms_notifications,
            'last_login_at' => $this->last_login_at,
            'last_login_role' => $this->last_login_role,
            'two_factor_enabled' => $this->two_factor_enabled,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];

        if ($includePassword) {
            $data['password_hash'] = $this->password_hash;
        }

        return $data;
    }
}
?>
