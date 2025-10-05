<?php
// Usage: php api/dev/post_dev_confirm_cli.php txn_6127eb66e3be226a
$tx = $argv[1] ?? null;
if (!$tx) {
    echo "Usage: php api/dev/post_dev_confirm_cli.php <transaction_ref>\n";
    exit(1);
}

$url = 'http://localhost:8000/payments/dev_confirm.php';
$data = json_encode(['transaction_ref' => $tx]);
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $data,
        'ignore_errors' => true,
    ]
];

$ctx = stream_context_create($opts);
$res = @file_get_contents($url, false, $ctx);
if ($res === false) {
    echo "Request failed.\n";
}

echo "--- HTTP response headers ---\n";
if (!empty($http_response_header)) {
    foreach ($http_response_header as $h) echo $h . "\n";
} else {
    echo "(no headers)\n";
}

echo "--- Response body ---\n";
echo ($res === false ? '(no body)' : $res) . "\n";

exit(0);
