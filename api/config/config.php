<?php

/**
 * API Configuration
 * BidKE Auction Platform
 */

// Include database connection
require_once 'connect.php';

// Development mode flag (set to true for local dev only)
// WARNING: Do not enable in production.
define('DEV_MODE', true);

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

// Payment gateway settings (configure in production)
define('PAYMENT_PROVIDER_URL', 'https://example-payment-gateway.local/checkout');
// Shared secret used to verify webhook signatures (HMAC SHA256)
// In development leave empty to allow local mock checkouts. Set a strong secret in production.
define('PAYMENT_WEBHOOK_SECRET', '');
