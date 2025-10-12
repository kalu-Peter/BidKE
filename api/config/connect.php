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

// Database configuration
// Use environment variables if available, fallback to local for dev
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '5432');
define('DB_NAME', getenv('DB_NAME') ?: 'bidlode');
define('DB_USER', getenv('DB_USER') ?: 'postgres');
define('DB_PASS', getenv('DB_PASS') ?: 'webwiz');
define('DB_SSLMODE', getenv('DB_SSLMODE') ?: 'require');


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

// Apply a safe development-friendly CORS policy by mirroring Origin and
// allowing credentials. Endpoints may still override or tighten these rules.
// This mirrors the requesting Origin (not '*') and sets Vary: Origin so
// caches don't serve the same response to different origins.
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD'])) {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Mirror the origin back, don't allow wildcard when credentials are used
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Vary: Origin');
    } else {
        // Fallback - no origin present (server-to-server), allow localhost for dev
        header('Access-Control-Allow-Origin: http://localhost:8080');
    }

    // Allow cookies/authorization headers in cross-site requests
    header('Access-Control-Allow-Credentials: true');

    // CORS preflight response settings
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

    // Respond to OPTIONS (preflight) and exit early
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        // short-circuit for preflight
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
