<?php
require_once '../config/connect.php';

/**
 * User Session Model for BidKE
 * Handles role-based login sessions and security
 */
class UserSession {
    private $conn;
    private $table_name = "user_sessions";

    // Session properties
    public $id;
    public $user_id;
    public $session_token;
    public $refresh_token;
    public $login_role;
    public $ip_address;
    public $user_agent;
    public $device_fingerprint;
    public $device_type;
    public $browser;
    public $operating_system;
    public $is_active;
    public $expires_at;
    public $last_activity;
    public $is_suspicious;
    public $flagged_reason;
    public $created_at;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Create new session
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, session_token, refresh_token, login_role, ip_address, user_agent, 
                   device_fingerprint, device_type, browser, operating_system, expires_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->session_token = htmlspecialchars(strip_tags($this->session_token));
        $this->refresh_token = htmlspecialchars(strip_tags($this->refresh_token));
        $this->login_role = htmlspecialchars(strip_tags($this->login_role));

        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $this->session_token);
        $stmt->bindParam(3, $this->refresh_token);
        $stmt->bindParam(4, $this->login_role);
        $stmt->bindParam(5, $this->ip_address);
        $stmt->bindParam(6, $this->user_agent);
        $stmt->bindParam(7, $this->device_fingerprint);
        $stmt->bindParam(8, $this->device_type);
        $stmt->bindParam(9, $this->browser);
        $stmt->bindParam(10, $this->operating_system);
        $stmt->bindParam(11, $this->expires_at);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Validate session token and return session data
     */
    public function validateSession($token) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE session_token = ? AND is_active = TRUE AND expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $token);

        if ($stmt->execute()) {
            $row = $stmt->fetch();
            if ($row) {
                // Update last activity
                $updateQuery = "UPDATE " . $this->table_name . " 
                               SET last_activity = NOW() 
                               WHERE id = ?";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->execute([$row['id']]);
                
                return $row;
            }
        }
        return null;
    }

    /**
     * Find session by token
     */
    public function findByToken($token) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE session_token = ? AND is_active = TRUE AND expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $token);

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
     * Find session by refresh token
     */
    public function findByRefreshToken($refresh_token) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE refresh_token = ? AND is_active = TRUE AND expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $refresh_token);

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
     * Update last activity
     */
    public function updateActivity() {
        $query = "UPDATE " . $this->table_name . " 
                  SET last_activity = NOW() 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        return $stmt->execute();
    }

    /**
     * Deactivate session (logout)
     */
    public function deactivate() {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = FALSE 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        return $stmt->execute();
    }

    /**
     * Deactivate all user sessions
     */
    public function deactivateAllUserSessions($user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = FALSE 
                  WHERE user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        
        return $stmt->execute();
    }

    /**
     * Get active sessions for user
     */
    public function getUserActiveSessions($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
                  ORDER BY last_activity DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Clean expired sessions
     */
    public static function cleanExpiredSessions() {
        $db = Database::getInstance()->getConnection();
        $query = "UPDATE user_sessions 
                  SET is_active = FALSE 
                  WHERE expires_at < NOW() AND is_active = TRUE";
        
        $stmt = $db->prepare($query);
        return $stmt->execute();
    }

    /**
     * Flag session as suspicious
     */
    public function flagAsSuspicious($reason) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_suspicious = TRUE, flagged_reason = ? 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $reason);
        $stmt->bindParam(2, $this->id);
        
        return $stmt->execute();
    }

    /**
     * Generate session token
     */
    public static function generateToken($length = 64) {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Parse user agent for device information
     */
    public static function parseUserAgent($user_agent) {
        $device_type = 'unknown';
        $browser = 'unknown';
        $operating_system = 'unknown';

        if (empty($user_agent)) {
            return compact('device_type', 'browser', 'operating_system');
        }

        // Detect device type
        if (preg_match('/Mobile|Android|iPhone|iPad/', $user_agent)) {
            if (preg_match('/iPad/', $user_agent)) {
                $device_type = 'tablet';
            } else {
                $device_type = 'mobile';
            }
        } else {
            $device_type = 'desktop';
        }

        // Detect browser
        if (preg_match('/Chrome\/([0-9.]+)/', $user_agent, $matches)) {
            $browser = 'Chrome ' . $matches[1];
        } elseif (preg_match('/Firefox\/([0-9.]+)/', $user_agent, $matches)) {
            $browser = 'Firefox ' . $matches[1];
        } elseif (preg_match('/Safari\/([0-9.]+)/', $user_agent, $matches)) {
            $browser = 'Safari ' . $matches[1];
        } elseif (preg_match('/Edge\/([0-9.]+)/', $user_agent, $matches)) {
            $browser = 'Edge ' . $matches[1];
        }

        // Detect operating system
        if (preg_match('/Windows NT ([0-9.]+)/', $user_agent, $matches)) {
            $operating_system = 'Windows ' . $matches[1];
        } elseif (preg_match('/Mac OS X ([0-9_]+)/', $user_agent, $matches)) {
            $operating_system = 'macOS ' . str_replace('_', '.', $matches[1]);
        } elseif (preg_match('/Android ([0-9.]+)/', $user_agent, $matches)) {
            $operating_system = 'Android ' . $matches[1];
        } elseif (preg_match('/iPhone OS ([0-9_]+)/', $user_agent, $matches)) {
            $operating_system = 'iOS ' . str_replace('_', '.', $matches[1]);
        } elseif (preg_match('/Linux/', $user_agent)) {
            $operating_system = 'Linux';
        }

        return compact('device_type', 'browser', 'operating_system');
    }

    /**
     * Generate device fingerprint
     */
    public static function generateDeviceFingerprint($ip_address, $user_agent) {
        return hash('sha256', $ip_address . '|' . $user_agent . '|' . date('Y-m-d'));
    }

    /**
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->user_id = $row['user_id'];
        $this->session_token = $row['session_token'];
        $this->refresh_token = $row['refresh_token'];
        $this->login_role = $row['login_role'];
        $this->ip_address = $row['ip_address'];
        $this->user_agent = $row['user_agent'];
        $this->device_fingerprint = $row['device_fingerprint'];
        $this->device_type = $row['device_type'];
        $this->browser = $row['browser'];
        $this->operating_system = $row['operating_system'];
        $this->is_active = $row['is_active'];
        $this->expires_at = $row['expires_at'];
        $this->last_activity = $row['last_activity'];
        $this->is_suspicious = $row['is_suspicious'];
        $this->flagged_reason = $row['flagged_reason'];
        $this->created_at = $row['created_at'];
    }

    /**
     * Convert session to array
     */
    public function toArray($includeSensitive = false) {
        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'login_role' => $this->login_role,
            'ip_address' => $this->ip_address,
            'device_type' => $this->device_type,
            'browser' => $this->browser,
            'operating_system' => $this->operating_system,
            'is_active' => $this->is_active,
            'expires_at' => $this->expires_at,
            'last_activity' => $this->last_activity,
            'created_at' => $this->created_at
        ];

        if ($includeSensitive) {
            $data['session_token'] = $this->session_token;
            $data['refresh_token'] = $this->refresh_token;
            $data['device_fingerprint'] = $this->device_fingerprint;
        }

        return $data;
    }
}
?>
