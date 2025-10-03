<?php
// Run finalizeAuction for a given auction id (CLI)
if ($argc < 2) {
    echo "Usage: php run_finalize_once.php <auction_id>\n";
    exit(1);
}
$aid = (int)$argv[1];
ini_set('display_errors', '0');
error_reporting(0);
require_once __DIR__ . '/finalize_helper.php';
require_once __DIR__ . '/../config/connect.php';
$db = Database::getInstance()->getConnection();
$res = finalizeAuction($db, $aid);
print_r($res);
