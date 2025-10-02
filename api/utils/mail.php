<?php

/**
 * Lightweight mail helper
 * - Uses SMTP settings from api/config/config.php (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD)
 * - If SMTP_HOST is empty, falls back to PHP mail()
 */

function send_email($to, $subject, $body, $headers = [])
{
    // Load config if not already
    if (!defined('SMTP_HOST')) {
        $cfgPath = __DIR__ . '/../config/config.php';
        if (file_exists($cfgPath)) {
            require_once $cfgPath;
        }
    }

    // Compose headers
    $hdrs = '';
    $defaultHeaders = [
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8',
        'From' => (defined('SMTP_USERNAME') && SMTP_USERNAME) ? SMTP_USERNAME : 'noreply@localhost'
    ];

    $headers = array_merge($defaultHeaders, $headers);
    foreach ($headers as $k => $v) {
        $hdrs .= "$k: $v\r\n";
    }

    // Use SMTP if configured
    if (defined('SMTP_HOST') && SMTP_HOST) {
        // Basic SMTP via fsockopen with STARTTLS if port suggests it
        $host = SMTP_HOST;
        $port = defined('SMTP_PORT') && SMTP_PORT ? SMTP_PORT : 25;
        $username = defined('SMTP_USERNAME') ? SMTP_USERNAME : '';
        $password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : '';

        $errno = 0;
        $errstr = '';
        $timeout = 30;

        $sock = fsockopen($host, $port, $errno, $errstr, $timeout);
        if (!$sock) {
            error_log("SMTP connect failed: $errno $errstr");
            return false;
        }

        $res = fgets($sock, 512);

        fwrite($sock, "EHLO localhost\r\n");
        $res = fgets($sock, 512);
        // Attempt STARTTLS if available and port is 587 or response contains STARTTLS
        // This is a simple attempt and may not handle all server responses; good for dev/test
        fwrite($sock, "STARTTLS\r\n");
        $res = fgets($sock, 512);
        if (strpos($res, '220') !== false) {
            // enable crypto
            stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            // EHLO again
            fwrite($sock, "EHLO localhost\r\n");
            $res = fgets($sock, 512);
        }

        if ($username) {
            fwrite($sock, "AUTH LOGIN\r\n");
            fgets($sock, 512);
            fwrite($sock, base64_encode($username) . "\r\n");
            fgets($sock, 512);
            fwrite($sock, base64_encode($password) . "\r\n");
            fgets($sock, 512);
        }

        fwrite($sock, "MAIL FROM:<" . $headers['From'] . ">\r\n");
        fgets($sock, 512);
        fwrite($sock, "RCPT TO:<$to>\r\n");
        fgets($sock, 512);
        fwrite($sock, "DATA\r\n");
        fgets($sock, 512);

        $msg = "Subject: $subject\r\n" . $hdrs . "\r\n" . $body . "\r\n.\r\n";
        fwrite($sock, $msg);
        $res = fgets($sock, 512);

        fwrite($sock, "QUIT\r\n");
        fclose($sock);
        return true;
    }

    // Fallback to PHP mail
    return mail($to, $subject, $body, $hdrs);
}
