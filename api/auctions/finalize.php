<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/finalize_helper.php';
require_once __DIR__ . '/../models/Auth.php';

// This endpoint is designed to be called from CLI or a cron job.
// If called by a web user, require admin role to avoid abuse.
try {
    $db = Database::getInstance()->getConnection();

    // Find auctions that should be finalized: end_time <= NOW() and status = 'active' or 'live'
    $sql = "SELECT id FROM auctions WHERE (status = 'active' OR status = 'live') AND end_time <= NOW()";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $finalized = [];
    // detect bidder column name in bids table
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'bids'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
    $bidderCol = in_array('bidder_id', $cols) ? 'bidder_id' : (in_array('user_id', $cols) ? 'user_id' : 'bidder_id');

    foreach ($rows as $auctionId) {
        $res = finalizeAuction($db, (int)$auctionId);
        $finalized[] = $res;
    }

    echo json_encode(['success' => true, 'finalized' => $finalized]);
} catch (Exception $e) {
    error_log('auctions/finalize.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
