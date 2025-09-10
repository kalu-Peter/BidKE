<?php
/**
 * Authentication Middleware
 * Protects API endpoints by validating session tokens
 */

require_once '../config/connect.php';

class AuthMiddleware {
    
    /**
     * Verify session token and return user data
     */
    public static function verifySession($required_role = null) {
        try {
            $session_token = self::getSessionToken();
            
            if (!$session_token) {
                throw new Exception('No session token provided');
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get user data with session validation
            $stmt = $pdo->prepare("
                SELECT u.*, s.expires_at
                FROM users u
                INNER JOIN user_sessions s ON u.id = s.user_id
                WHERE s.session_token = ? AND s.expires_at > NOW()
            ");
            $stmt->execute([$session_token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('Invalid or expired session');
            }
            
            // Check if account is suspended
            if ($user['status'] === 'suspended') {
                throw new Exception('Account suspended');
            }
            
            // Check role if required
            if ($required_role && $user['role'] !== $required_role) {
                throw new Exception('Insufficient privileges');
            }
            
            // Update session activity
            $stmt = $pdo->prepare("UPDATE user_sessions SET updated_at = NOW() WHERE session_token = ?");
            $stmt->execute([$session_token]);
            
            return [
                'success' => true,
                'user' => $user
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get session token from request headers or session
     */
    private static function getSessionToken() {
        // Try Authorization header first
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            return str_replace('Bearer ', '', $headers['Authorization']);
        }
        
        // Try session
        session_start();
        if (isset($_SESSION['session_token'])) {
            return $_SESSION['session_token'];
        }
        
        return null;
    }
    
    /**
     * Require authentication for endpoint
     */
    public static function requireAuth($required_role = null) {
        $result = self::verifySession($required_role);
        
        if (!$result['success']) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => $result['error']
            ]);
            exit;
        }
        
        return $result['user'];
    }
    
    /**
     * Optional authentication (returns user if authenticated, null if not)
     */
    public static function optionalAuth() {
        $result = self::verifySession();
        
        if ($result['success']) {
            return $result['user'];
        }
        
        return null;
    }
    
    /**
     * Check if user has specific permission
     */
    public static function hasPermission($user, $permission) {
        // Define role permissions
        $permissions = [
            'admin' => ['*'], // Admin has all permissions
            'seller' => [
                'create_auction',
                'edit_own_auction',
                'view_own_auctions',
                'manage_inventory',
                'view_sales_reports'
            ],
            'buyer' => [
                'place_bid',
                'view_auctions',
                'add_to_watchlist',
                'view_bid_history'
            ]
        ];
        
        $user_permissions = $permissions[$user['role']] ?? [];
        
        // Admin has all permissions
        if (in_array('*', $user_permissions)) {
            return true;
        }
        
        return in_array($permission, $user_permissions);
    }
    
    /**
     * Require specific permission
     */
    public static function requirePermission($permission) {
        $user = self::requireAuth();
        
        if (!self::hasPermission($user, $permission)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Permission denied'
            ]);
            exit;
        }
        
        return $user;
    }
    
    /**
     * Clean up expired sessions
     */
    public static function cleanupExpiredSessions() {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE expires_at < NOW()");
            $stmt->execute();
            
            return true;
        } catch (Exception $e) {
            error_log("Failed to cleanup expired sessions: " . $e->getMessage());
            return false;
        }
    }
}

// Clean up expired sessions periodically (you might want to run this as a cron job)
if (mt_rand(1, 100) <= 5) { // 5% chance
    AuthMiddleware::cleanupExpiredSessions();
}
?>
