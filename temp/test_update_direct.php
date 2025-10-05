<?php
// Simple test by including the update file directly and simulating POST request

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:8080';

// Create a temporary file to simulate php://input
$temp_input = '{"payout_id":4}';

// Mock the file_get_contents('php://input') function
function mockFileGetContents()
{
    return '{"payout_id":4}';
}

// Override file_get_contents for php://input
if (!function_exists('file_get_contents_original')) {
    function file_get_contents_original($filename, $flags = 0, $context = null, $offset = 0, $maxlen = null)
    {
        if ($filename === 'php://input') {
            return '{"payout_id":4}';
        }
        return \file_get_contents($filename, $flags, $context, $offset, $maxlen);
    }
}

echo "Testing update_payout_status.php directly...\n";

// Capture output
ob_start();

// Include the endpoint file
include '../api/payments/admin/update_payout_status.php';

$output = ob_get_clean();

echo "Output: $output\n";

// Check if payout status was actually updated
require_once '../api/config/connect.php';
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT status FROM payouts WHERE payout_id = 4");
$stmt->execute();
$status = $stmt->fetchColumn();

echo "Current status of payout ID 4: $status\n";
