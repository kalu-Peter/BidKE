<?php
/**
 * API Configuration
 * BidKE Auction Platform
 */

// Include database connection
require_once 'connect.php';

// API Base URL (adjust as needed)
define('API_BASE_URL', 'http://localhost/bidke/api/');

// JWT Secret (change this in production)
define('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');

// Upload directories
define('UPLOAD_DIR', '../public/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Auction settings
define('DEFAULT_AUCTION_DURATION', 7); // days
define('MIN_BID_INCREMENT', 1000); // KSh 1,000

// Email settings (configure for production)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

?>
