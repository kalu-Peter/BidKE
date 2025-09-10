<?php
/**
 * PostgreSQL Database Connection
 * BidKE Auction Platform
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '5054');
define('DB_NAME', 'bidlode');
define('DB_USER', 'postgres');
define('DB_PASS', 'webwiz');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    private $connection;
    private static $instance = null;
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            
            // Set timezone
            $this->connection->exec("SET timezone = 'UTC'");
            
        } catch (PDOException $e) {
            $this->handleConnectionError($e);
        }
    }
    
    private function handleConnectionError($e) {
        $error = [
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage(),
            'code' => $e->getCode()
        ];
        
        // Log error (in production, use proper logging)
        error_log("Database Connection Error: " . $e->getMessage());
        
        // Return error response
        http_response_code(500);
        echo json_encode($error);
        exit();
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function testConnection() {
        try {
            $stmt = $this->connection->query("SELECT version()");
            $result = $stmt->fetch();
            return [
                'success' => true,
                'message' => 'Database connection successful',
                'version' => $result['version']
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Connection test failed',
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
    
    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }
    
    public function query($sql) {
        return $this->connection->query($sql);
    }
    
    public function lastInsertId($name = null) {
        return $this->connection->lastInsertId($name);
    }
}

// Utility functions
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 400, $details = null) {
    $error = [
        'success' => false,
        'error' => $message
    ];
    
    if ($details) {
        $error['details'] = $details;
    }
    
    sendResponse($error, $status);
}

function sendSuccess($data, $message = 'Success') {
    $response = [
        'success' => true,
        'message' => $message,
        'data' => $data
    ];
    
    sendResponse($response);
}

// Test connection if this file is accessed directly
if (basename($_SERVER['PHP_SELF']) === 'connect.php') {
    $db = Database::getInstance();
    $test = $db->testConnection();
    sendResponse($test);
}

?>
