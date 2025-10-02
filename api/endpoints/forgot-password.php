<?php
// Endpoint: api/endpoints/forgot-password.php
// Accepts { email } and generates a password reset token, storing it in password_resets table.

header('Content-Type: application/json');

try {
    // connect.php lives in api/config/connect.php
    require_once __DIR__ . '/../config/connect.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();

    // Ensure password_resets table exists (simple migration)
    $db->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Generate a secure token
    $token = bin2hex(random_bytes(20));
    $expires = (new DateTime())->modify('+1 hour')->format('Y-m-d H:i:s');

    // Store token. The project may have different password_resets schema
    // Detect columns to insert appropriately
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'password_resets'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    $didInsert = false;
    if (in_array('email', $cols) && in_array('token', $cols)) {
        $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $token, $expires]);
        $didInsert = true;
    } else {
        // Newer schema uses user_id and reset_token; try to map
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $userStmt->execute([$email]);
        $u = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            $userId = $u['id'];
            // Determine reset token column name
            $tokenCol = in_array('reset_token', $cols) ? 'reset_token' : (in_array('token', $cols) ? 'token' : 'reset_token');
            $expiresCol = in_array('expires_at', $cols) ? 'expires_at' : 'expires_at';
            $insSql = "INSERT INTO password_resets (user_id, {$tokenCol}, {$expiresCol}) VALUES (?, ?, ?)";
            $stmt = $db->prepare($insSql);
            $stmt->execute([$userId, $token, $expires]);
            $didInsert = true;
        } else {
            // No user found - to avoid enumeration, still return success but do not insert
        }
    }

    // If we inserted a token, try to email the reset link. Keep behavior opaque to caller.
    if ($didInsert) {
        // Require mail helper
        $mailHelper = __DIR__ . '/../utils/mail.php';
        if (file_exists($mailHelper)) {
            require_once $mailHelper;
            // Ensure API_BASE_URL is available
            if (!defined('API_BASE_URL')) {
                $cfgPath = __DIR__ . '/../config/config.php';
                if (file_exists($cfgPath)) require_once $cfgPath;
            }

            $base = defined('API_BASE_URL') ? rtrim(API_BASE_URL, '/') : '';
            // Construct reset URL (use front-end route)
            $resetUrl = ($base ? $base : '') . '/reset-password?token=' . urlencode($token);
            $subject = 'Reset your password';
            $body = "<p>We received a request to reset your password. Click the link below to set a new password (valid for 1 hour):</p>";
            $body .= "<p><a href=\"{$resetUrl}\">Reset password</a></p>";
            $body .= "<p>If you didn't request this, you can safely ignore this email.</p>";

            $sent = @send_email($email, $subject, $body);
            if (!$sent) {
                error_log("Failed to send password reset email to {$email}");
            } else {
                error_log("Sent password reset email to {$email}");
            }
        } else {
            error_log('Mail helper not found; token generated but email not sent.');
        }
    } else {
        // No insert (either user not found or older schema); still attempt a best-effort to avoid enumeration
        error_log("Password reset requested for {$email} but no token stored (user missing or schema mismatch)");
    }

    echo json_encode(['success' => true, 'message' => 'If the email exists, a reset link will be sent']);
} catch (Exception $e) {
    // Log to server error log only (do not write debug files into the workspace)
    error_log("Forgot password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to process request']);
}
