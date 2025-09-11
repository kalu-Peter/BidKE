<?php
require_once '../config/connect.php';

/**
 * Authentication Helper Class for BidKE
 * Handles JWT tokens, session management, and role-based authentication
 */
class Auth {
    private static $jwt_secret = "your-secret-key-here"; // Change this in production
    private static $jwt_algorithm = "HS256";
    private static $token_expiry = 86400; // 24 hours
    private static $refresh_token_expiry = 2592000; // 30 days

    /**
     * Generate JWT token
     */
    public static function generateToken($user_id, $username, $login_role, $session_id = null) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$jwt_algorithm]);
        $payload = json_encode([
            'user_id' => $user_id,
            'username' => $username,
            'login_role' => $login_role,
            'session_id' => $session_id,
            'iat' => time(),
            'exp' => time() + self::$token_expiry
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$jwt_secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    /**
     * Generate refresh token
     */
    public static function generateRefreshToken($length = 64) {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Verify JWT token
     */
    public static function verifyToken($token) {
        try {
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return false;
            }

            $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
            $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
            $signatureProvided = $tokenParts[2];

            // Verify signature
            $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
            $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$jwt_secret, true);
            $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            if (!hash_equals($base64Signature, $signatureProvided)) {
                return false;
            }

            $payloadData = json_decode($payload, true);

            // Check expiration
            if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
                return false;
            }

            return $payloadData;

        } catch (Exception $e) {
            error_log("Token verification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get bearer token from headers
     */
    public static function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    /**
     * Authenticate request and return user data
     */
    public static function authenticate() {
        $token = self::getBearerToken();
        
        if (!$token) {
            return null;
        }

        $payload = self::verifyToken($token);
        
        if (!$payload) {
            return null;
        }

        // Verify session is still active if session_id is provided
        if (isset($payload['session_id'])) {
            require_once 'UserSession.php';
            $session = new UserSession();
            
            if (!$session->findByToken($token)) {
                return null;
            }
            
            // Update last activity
            $session->updateActivity();
        }

        return $payload;
    }

    /**
     * Check if user has required role
     */
    public static function hasRole($required_role, $user_data) {
        if (!$user_data || !isset($user_data['login_role'])) {
            return false;
        }

        // Admin can access everything
        if ($user_data['login_role'] === 'admin') {
            return true;
        }

        // Check specific role
        return $user_data['login_role'] === $required_role;
    }

    /**
     * Check if user has any of the required roles
     */
    public static function hasAnyRole($required_roles, $user_data) {
        if (!$user_data || !isset($user_data['login_role'])) {
            return false;
        }

        // Admin can access everything
        if ($user_data['login_role'] === 'admin') {
            return true;
        }

        return in_array($user_data['login_role'], $required_roles);
    }

    /**
     * Middleware to require authentication
     */
    public static function requireAuth($required_role = null) {
        $user_data = self::authenticate();
        
        if (!$user_data) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }

        if ($required_role && !self::hasRole($required_role, $user_data)) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit;
        }

        return $user_data;
    }

    /**
     * Middleware to require any of the specified roles
     */
    public static function requireAnyRole($required_roles) {
        $user_data = self::authenticate();
        
        if (!$user_data) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }

        if (!self::hasAnyRole($required_roles, $user_data)) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit;
        }

        return $user_data;
    }

    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    /**
     * Generate secure random string
     */
    public static function generateRandomString($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Generate verification code
     */
    public static function generateVerificationCode($length = 6) {
        return str_pad(random_int(0, pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
    }

    /**
     * Rate limiting check
     */
    public static function checkRateLimit($identifier, $max_attempts = 5, $time_window = 300) {
        // This is a simple file-based rate limiting
        // In production, use Redis or database
        $rate_limit_file = sys_get_temp_dir() . '/bidke_rate_limit_' . md5($identifier);
        
        $attempts = [];
        if (file_exists($rate_limit_file)) {
            $attempts = json_decode(file_get_contents($rate_limit_file), true) ?: [];
        }

        // Clean old attempts
        $current_time = time();
        $attempts = array_filter($attempts, function($timestamp) use ($current_time, $time_window) {
            return ($current_time - $timestamp) < $time_window;
        });

        if (count($attempts) >= $max_attempts) {
            return false;
        }

        // Record this attempt
        $attempts[] = $current_time;
        file_put_contents($rate_limit_file, json_encode($attempts));

        return true;
    }

    /**
     * Get client IP address
     */
    public static function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    if (filter_var($ip, FILTER_VALIDATE_IP, 
                        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Sanitize input data
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validate email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate phone number (Kenya format)
     */
    public static function validatePhone($phone) {
        // Remove spaces and special characters
        $phone = preg_replace('/[^\d+]/', '', $phone);
        
        // Check for Kenya phone number formats
        $patterns = [
            '/^\+254[17]\d{8}$/',     // +254701234567 or +254111234567
            '/^0[17]\d{8}$/',         // 0701234567 or 0111234567
            '/^[17]\d{8}$/'           // 701234567 or 111234567
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $phone)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Validate username
     */
    public static function validateUsername($username) {
        // Username must be 3-50 characters, alphanumeric and underscores only
        return preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username);
    }

    /**
     * Validate password strength
     */
    public static function validatePassword($password) {
        // Password must be at least 8 characters with at least one letter and one number
        return strlen($password) >= 8 && 
               preg_match('/[A-Za-z]/', $password) && 
               preg_match('/\d/', $password);
    }

    /**
     * Create API response
     */
    public static function response($data = null, $message = null, $status = 200, $success = true) {
        http_response_code($status);
        
        $response = [
            'success' => $success,
            'timestamp' => date('c'),
            'status' => $status
        ];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        header('Content-Type: application/json');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Create error response
     */
    public static function error($message, $status = 400, $details = null) {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('c'),
            'status' => $status
        ];
        
        if ($details) {
            $response['details'] = $details;
        }
        
        self::response(null, $message, $status, false);
    }
}
?>
