<?php

/**
 * PostgreSQL Database Connection
 * BidKE Auction Platform
 * define('DB_HOST', 'localhost');
 * define('DB_PORT', '5054');
 *define('DB_NAME', 'bidlode');
 *define('DB_USER', 'postgres');
 *define('DB_PASS', 'webwiz');
 */

// Database configuration - Multi-environment support
// Detect environment based on host or environment variables
$isProduction = (
    isset($_SERVER['HTTP_HOST']) &&
    (strpos($_SERVER['HTTP_HOST'], 'onrender.com') !== false ||
        strpos($_SERVER['HTTP_HOST'], 'herokuapp.com') !== false)
) || getenv('ENVIRONMENT') === 'production';

if ($isProduction) {
    // Production environment (Render)
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_PORT', getenv('DB_PORT') ?: '5432');
    define('DB_NAME', getenv('DB_NAME') ?: 'bidlode');
    define('DB_USER', getenv('DB_USER') ?: 'postgres');
    define('DB_PASS', getenv('DB_PASS') ?: '');
    define('DB_SSLMODE', getenv('DB_SSLMODE') ?: 'require');
} else {
    // Development environment (Local)
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_PORT', getenv('DB_PORT') ?: '5054');
    define('DB_NAME', getenv('DB_NAME') ?: 'bidlode');
    define('DB_USER', getenv('DB_USER') ?: 'postgres');
    define('DB_PASS', getenv('DB_PASS') ?: 'webwiz');
    define('DB_SSLMODE', getenv('DB_SSLMODE') ?: 'disable');
}

// Log environment for debugging (remove in production)
if (!$isProduction) {
    error_log("Database Config - Environment: " . ($isProduction ? 'Production' : 'Development') .
        ", Host: " . DB_HOST . ":" . DB_PORT . ", Database: " . DB_NAME);
}


// Error reporting
error_reporting(E_ALL);
// Do not display PHP errors as HTML; use centralized JSON error handler
ini_set('display_errors', 0);

// Load central JSON error handler so uncaught errors/exceptions are returned as JSON
// Path assumes endpoints require this config via '../config/connect.php'
$jsonErrorPath = __DIR__ . '/../utils/json_error.php';
if (file_exists($jsonErrorPath)) {
    require_once $jsonErrorPath;
}

// Note: CORS headers are set per endpoint for better control
// This allows each endpoint to set specific CORS policies

// Enhanced CORS policy for multi-environment support
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD'])) {
    $allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:8082',
        'https://localhost:8080',
        'https://localhost:8082',
        'https://bidke.onrender.com', // Add your frontend production URL here
        'https://your-frontend-domain.com' // Replace with your actual frontend domain
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (
        in_array($origin, $allowedOrigins) ||
        // Allow any localhost origin in development
        (!$isProduction && (strpos($origin, 'http://localhost:') === 0 || strpos($origin, 'http://127.0.0.1:') === 0))
    ) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        // Fallback for development
        if (!$isProduction) {
            header('Access-Control-Allow-Origin: http://localhost:8082');
        }
    }

    // Allow cookies/authorization headers in cross-site requests
    header('Access-Control-Allow-Credentials: true');

    // CORS preflight response settings
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

    // Respond to OPTIONS (preflight) and exit early
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

class Database
{
    private $connection;
    private static $instance = null;

    private function __construct()
    {
        $this->connect();
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    private function connect()
    {
        try {
            $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=" . DB_SSLMODE;
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

    private function handleConnectionError($e)
    {
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

    public function getConnection()
    {
        return $this->connection;
    }

    public function testConnection()
    {
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

    public function beginTransaction()
    {
        return $this->connection->beginTransaction();
    }

    public function commit()
    {
        return $this->connection->commit();
    }

    public function rollback()
    {
        return $this->connection->rollback();
    }

    public function prepare($sql)
    {
        return $this->connection->prepare($sql);
    }

    public function query($sql)
    {
        return $this->connection->query($sql);
    }

    public function lastInsertId($name = null)
    {
        return $this->connection->lastInsertId($name);
    }
}

// Utility functions
function sendResponse($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 400, $details = null)
{
    $error = [
        'success' => false,
        'error' => $message
    ];

    if ($details) {
        $error['details'] = $details;
    }

    sendResponse($error, $status);
}

function sendSuccess($data, $message = 'Success')
{
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
