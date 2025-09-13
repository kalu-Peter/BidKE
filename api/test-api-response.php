<?php
// Test the auctions API directly
$response = file_get_contents('http://localhost:8000/auctions.php?page=1&limit=10');
$data = json_decode($response, true);

echo "API Response:\n";
echo "=============\n";
echo "Success: " . ($data['success'] ? 'YES' : 'NO') . "\n";
echo "Total auctions returned: " . count($data['data']) . "\n";

if (isset($data['pagination'])) {
    echo "Total auctions in DB: " . $data['pagination']['total'] . "\n";
    echo "Total pages: " . $data['pagination']['pages'] . "\n";
}

echo "\nAuctions returned:\n";
foreach ($data['data'] as $auction) {
    echo "- ID {$auction['id']}: {$auction['title']} (Status: {$auction['status']})\n";
}
?>