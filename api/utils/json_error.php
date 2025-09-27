<?php
// Central JSON error/exception handler for API endpoints
// Use require_once from endpoints (paths relative to endpoint file)

// Don't display raw PHP errors to client
ini_set('display_errors', 0);
error_reporting(E_ALL);

function send_json_error_response($message, $code = 500, $details = null)
{
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }

    $payload = [
        'success' => false,
        'error' => $message
    ];

    if ($details) {
        $payload['details'] = $details;
    }

    // Always output minimal JSON for clients
    echo json_encode($payload);
    // Ensure script stops after sending JSON
    exit;
}

set_exception_handler(function ($ex) {
    error_log('Uncaught exception: ' . $ex->getMessage() . " in " . $ex->getFile() . ':' . $ex->getLine());
    send_json_error_response('Internal server error', 500, ['message' => $ex->getMessage()]);
});

set_error_handler(function ($severity, $message, $file, $line) {
    // Convert error to exception to be handled by exception handler
    $err = "PHP Error: [$severity] $message in $file:$line";
    error_log($err);
    send_json_error_response('Internal server error', 500, ['message' => $message]);
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && ($err['type'] & (E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR))) {
        error_log('Fatal error on shutdown: ' . json_encode($err));
        // Try to send JSON if possible
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode(['success' => false, 'error' => 'Fatal server error', 'details' => $err]);
        exit;
    }
});
