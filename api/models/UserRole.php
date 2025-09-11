<?php
require_once '../config/connect.php';

/**
 * User Role Model for BidKE
 * Manages the many-to-many relationship between users and roles
 */
class UserRole {
    private $conn;
    private $table_name = "user_roles";

    // UserRole properties
    public $id;
    public $user_id;
    public $role_id;
    public $is_primary;
    public $is_active;
    public $applied_at;
    public $approved_at;
    public $approved_by;
    public $role_status;
    public $expires_at;
    public $created_at;
    public $updated_at;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Assign role to user
     */
    public function assignRole() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, role_id, is_primary, is_active, role_status, expires_at) 
                  VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $this->role_id);
        $stmt->bindParam(3, $this->is_primary);
        $stmt->bindParam(4, $this->is_active);
        $stmt->bindParam(5, $this->role_status);
        $stmt->bindParam(6, $this->expires_at);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get user roles
     */
    public function getUserRoles($user_id) {
        $query = "SELECT ur.*, r.role_name, r.display_name, r.description, r.can_login
                  FROM " . $this->table_name . " ur
                  JOIN roles r ON ur.role_id = r.id
                  WHERE ur.user_id = ? AND ur.is_active = TRUE
                  ORDER BY ur.is_primary DESC, r.id ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get active user roles for login
     */
    public function getUserLoginRoles($user_id) {
        $query = "SELECT ur.*, r.role_name, r.display_name, r.can_login
                  FROM " . $this->table_name . " ur
                  JOIN roles r ON ur.role_id = r.id
                  WHERE ur.user_id = ? AND ur.is_active = TRUE AND ur.role_status = 'active' 
                  AND r.is_active = TRUE AND r.can_login = TRUE
                  ORDER BY ur.is_primary DESC, r.id ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Check if user has specific role
     */
    public function userHasRole($user_id, $role_name) {
        $query = "SELECT ur.id FROM " . $this->table_name . " ur
                  JOIN roles r ON ur.role_id = r.id
                  WHERE ur.user_id = ? AND r.role_name = ? 
                  AND ur.is_active = TRUE AND ur.role_status = 'active'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->bindParam(2, $role_name);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    /**
     * Check if user has active role (any role)
     */
    public function userHasActiveRole($user_id) {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE user_id = ? AND is_active = TRUE AND role_status = 'active'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    /**
     * Get pending role applications
     */
    public function getPendingApplications($limit = 20, $offset = 0) {
        $query = "SELECT ur.*, u.username, u.email, r.role_name, r.display_name
                  FROM " . $this->table_name . " ur
                  JOIN users u ON ur.user_id = u.id
                  JOIN roles r ON ur.role_id = r.id
                  WHERE ur.role_status = 'pending'
                  ORDER BY ur.applied_at ASC
                  LIMIT ? OFFSET ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Approve role application
     */
    public function approveRole($user_role_id, $approved_by_user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET role_status = 'active', approved_at = NOW(), approved_by = ? 
                  WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $approved_by_user_id);
        $stmt->bindParam(2, $user_role_id);

        return $stmt->execute();
    }

    /**
     * Reject role application
     */
    public function rejectRole($user_role_id, $approved_by_user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET role_status = 'rejected', approved_at = NOW(), approved_by = ? 
                  WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $approved_by_user_id);
        $stmt->bindParam(2, $user_role_id);

        return $stmt->execute();
    }

    /**
     * Suspend user role
     */
    public function suspendRole($user_role_id, $suspended_by_user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET role_status = 'suspended', updated_at = NOW() 
                  WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_role_id);

        return $stmt->execute();
    }

    /**
     * Reactivate suspended role
     */
    public function reactivateRole($user_role_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET role_status = 'active', updated_at = NOW() 
                  WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_role_id);

        return $stmt->execute();
    }

    /**
     * Set primary role for user
     */
    public function setPrimaryRole($user_id, $role_id) {
        try {
            $this->conn->beginTransaction();

            // First, unset all primary roles for the user
            $query1 = "UPDATE " . $this->table_name . " SET is_primary = FALSE WHERE user_id = ?";
            $stmt1 = $this->conn->prepare($query1);
            $stmt1->bindParam(1, $user_id);
            $stmt1->execute();

            // Then set the specified role as primary
            $query2 = "UPDATE " . $this->table_name . " 
                       SET is_primary = TRUE 
                       WHERE user_id = ? AND role_id = ? AND is_active = TRUE AND role_status = 'active'";
            $stmt2 = $this->conn->prepare($query2);
            $stmt2->bindParam(1, $user_id);
            $stmt2->bindParam(2, $role_id);
            
            if ($stmt2->execute() && $stmt2->rowCount() > 0) {
                $this->conn->commit();
                return true;
            }

            $this->conn->rollback();
            return false;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Set primary role error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole($user_id, $role_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = FALSE, updated_at = NOW() 
                  WHERE user_id = ? AND role_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->bindParam(2, $role_id);

        return $stmt->execute();
    }

    /**
     * Get role statistics
     */
    public static function getRoleStatistics() {
        $db = Database::getInstance()->getConnection();
        $query = "SELECT 
                    r.role_name,
                    r.display_name,
                    COUNT(ur.id) as total_users,
                    COUNT(CASE WHEN ur.role_status = 'active' THEN 1 END) as active_users,
                    COUNT(CASE WHEN ur.role_status = 'pending' THEN 1 END) as pending_users,
                    COUNT(CASE WHEN ur.role_status = 'suspended' THEN 1 END) as suspended_users
                  FROM roles r
                  LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = TRUE
                  WHERE r.is_active = TRUE
                  GROUP BY r.id, r.role_name, r.display_name
                  ORDER BY r.id";

        $stmt = $db->prepare($query);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Get users by role
     */
    public function getUsersByRole($role_name, $status = 'active', $limit = 20, $offset = 0) {
        $query = "SELECT u.id, u.username, u.email, u.status, ur.role_status, ur.is_primary, ur.created_at as role_assigned_at
                  FROM " . $this->table_name . " ur
                  JOIN users u ON ur.user_id = u.id
                  JOIN roles r ON ur.role_id = r.id
                  WHERE r.role_name = ? AND ur.role_status = ? AND ur.is_active = TRUE
                  ORDER BY ur.created_at DESC
                  LIMIT ? OFFSET ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $role_name);
        $stmt->bindParam(2, $status);
        $stmt->bindParam(3, $limit, PDO::PARAM_INT);
        $stmt->bindParam(4, $offset, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $stmt->fetchAll();
        }
        return [];
    }

    /**
     * Set properties from database row
     */
    private function setProperties($row) {
        $this->id = $row['id'];
        $this->user_id = $row['user_id'];
        $this->role_id = $row['role_id'];
        $this->is_primary = $row['is_primary'];
        $this->is_active = $row['is_active'];
        $this->applied_at = $row['applied_at'];
        $this->approved_at = $row['approved_at'];
        $this->approved_by = $row['approved_by'];
        $this->role_status = $row['role_status'];
        $this->expires_at = $row['expires_at'];
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
            'role_id' => $this->role_id,
            'is_primary' => $this->is_primary,
            'is_active' => $this->is_active,
            'applied_at' => $this->applied_at,
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,
            'role_status' => $this->role_status,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
?>
