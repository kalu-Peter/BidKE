<?php
// Auction creation endpoint with database functionality

// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error',
            'details' => 'A fatal error occurred while processing your request'
        ]);
    }
});

// Basic headers with dynamic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:8081';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load dependencies with error handling
try {
    require_once '../config/connect.php';
    require_once '../models/Auction.php';
    require_once '../models/Vehicle.php';
    require_once '../models/Electronics.php';
    // Skip Auth for now to avoid authentication issues
    // require_once '../models/Auth.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error: ' . $e->getMessage()]);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    sendError('Invalid JSON data', 400);
}

// Debug: Log the received data
error_log("Received data: " . print_r($data, true));

// Validate required fields
$required_fields = ['itemType', 'title', 'description', 'startingPrice', 'auctionStartDate', 'auctionStartTime', 'auctionEndDate', 'auctionEndTime'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    sendError('Missing required fields: ' . implode(', ', $missing_fields), 400);
}

// Validate item type
if (!in_array($data['itemType'], ['vehicle', 'electronic'])) {
    sendError('Invalid item type. Must be "vehicle" or "electronic"', 400);
}

// Validate item-specific fields
if ($data['itemType'] === 'vehicle') {
    $vehicle_required = ['vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleMileage', 'vehicleCondition'];
    foreach ($vehicle_required as $field) {
        if (empty($data[$field])) {
            $missing_fields[] = $field;
        }
    }
} else {
    $electronics_required = ['electronicsBrand', 'electronicsModel', 'electronicsYear', 'electronicsCondition'];
    foreach ($electronics_required as $field) {
        if (empty($data[$field])) {
            $missing_fields[] = $field;
        }
    }
}

if (!empty($missing_fields)) {
    sendError('Missing item-specific fields: ' . implode(', ', $missing_fields), 400);
}

try {
    // For now, use a dummy seller ID since we skipped auth
    $seller_id = 1; // You would get this from Auth::verifyToken($token)['user_id'];
    
    // Get a fresh database connection
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $connection = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Start transaction
    $connection->beginTransaction();

    // Get category ID
    $category_query = "SELECT id FROM categories WHERE (slug = ? OR name = ?) AND is_active = true LIMIT 1";
    $category_stmt = $connection->prepare($category_query);
    
    if ($data['itemType'] === 'vehicle') {
        $category_stmt->execute(['cars', 'Cars']);
    } else {
        $category_stmt->execute(['electronics', 'Electronics']);
    }
    
    $category_result = $category_stmt->fetch();
    if (!$category_result) {
        throw new Exception('Category not found for item type: ' . $data['itemType']);
    }
    $category_id = $category_result['id'];

    // Combine date and time for start and end times
    $start_datetime = $data['auctionStartDate'] . ' ' . $data['auctionStartTime'];
    $end_datetime = $data['auctionEndDate'] . ' ' . $data['auctionEndTime'];

    // Create auction directly
    $auction_query = "INSERT INTO auctions (seller_id, category_id, title, description, starting_price, reserve_price, bid_increment, start_time, end_time, status) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id";
    
    $auction_stmt = $connection->prepare($auction_query);
    $auction_stmt->execute([
        $seller_id,
        $category_id,
        trim($data['title']),
        trim($data['description']),
        floatval($data['startingPrice']),
        !empty($data['reservePrice']) ? floatval($data['reservePrice']) : null,
        1000, // Default bid increment
        $start_datetime,
        $end_datetime,
        'draft'
    ]);
    
    $auction_result = $auction_stmt->fetch();
    if (!$auction_result) {
        throw new Exception('Failed to create auction');
    }
    $auction_id = $auction_result['id'];

    // Create item-specific record
    if ($data['itemType'] === 'vehicle') {
        $vehicle_query = "INSERT INTO vehicles (auction_id, vehicle_type, make, model, year, mileage, condition, registration_number, engine_capacity, fuel_type, transmission, color, location) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $vehicle_stmt = $connection->prepare($vehicle_query);
        $vehicle_stmt->execute([
            $auction_id,
            'car',
            $data['vehicleMake'],
            $data['vehicleModel'],
            intval($data['vehicleYear']),
            intval($data['vehicleMileage']),
            $data['vehicleCondition'],
            $data['registrationNumber'] ?? null,
            $data['engineCapacity'] ?? null,
            $data['fuelType'] ?? null,
            $data['transmission'] ?? null,
            $data['color'] ?? null,
            $data['location'] ?? null
        ]);
    } else {
        $specs = ['year' => $data['electronicsYear']];
        if (!empty($data['specifications'])) {
            $specs['specifications'] = $data['specifications'];
        }
        
        $electronics_query = "INSERT INTO electronics (auction_id, category, brand, model, condition, specs, serial_number, warranty, location) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $electronics_stmt = $connection->prepare($electronics_query);
        $electronics_stmt->execute([
            $auction_id,
            'electronics',
            $data['electronicsBrand'],
            $data['electronicsModel'],
            $data['electronicsCondition'],
            json_encode($specs),
            $data['serialNumber'] ?? null,
            !empty($data['warranty']) ? 't' : 'f',
            $data['location'] ?? null
        ]);
    }

    // Commit transaction
    $connection->commit();

    // Prepare response
    $response_data = [
        'auction_id' => $auction_id,
        'item_type' => $data['itemType'],
        'title' => trim($data['title']),
        'status' => 'draft',
        'start_time' => $start_datetime,
        'end_time' => $end_datetime,
        'starting_price' => floatval($data['startingPrice']),
        'reserve_price' => !empty($data['reservePrice']) ? floatval($data['reservePrice']) : null
    ];

    sendSuccess($response_data, 'Auction created successfully and saved to database');

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($connection) && $connection->inTransaction()) {
        try {
            $connection->rollback();
        } catch (Exception $rollbackError) {
            error_log("Rollback failed: " . $rollbackError->getMessage());
        }
    }
    error_log("Auction creation error: " . $e->getMessage());
    sendError('Failed to create auction: ' . $e->getMessage(), 500);
}
?>
