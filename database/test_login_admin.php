<?php
$data = json_encode(['username' => 'peteradmin', 'password' => 'peter123']);
$opts = ['http' => ['method' => 'POST','header' => "Content-Type: application/json\r\n", 'content' => $data, 'timeout' => 15]];
$context = stream_context_create($opts);
$result = @file_get_contents('http://localhost:8000/auth/login.php', false, $context);
if ($result === false) {
    $err = error_get_last();
    echo 'ERROR: ' . $err['message'];
} else {
    echo $result;
}

?>