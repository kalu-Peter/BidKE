<?php
/**
 * Database Connection Class
 * BidKE Auction Platform
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '5054');
define('DB_NAME', 'bidlode');
define('DB_USER', 'postgres');
define('DB_PASS', 'webwiz');

class Database {
    private $connection;
    
    public function getConnection() {
        if ($this->connection === null) {
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
                error_log("Database Connection Error: " . $e->getMessage());
                throw new Exception("Database connection failed: " . $e->getMessage());
            }
        }
        
        return $this->connection;
    }
}
?>