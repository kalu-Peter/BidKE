<?php
// Endpoint: api/endpoints/reset-password.php
// Accepts { token, password } and resets the user's password if token is valid

header('Content-Type: application/json');

try {
    // connect.php lives in api/config/connect.php
    require_once __DIR__ . '/../config/connect.php';
    require_once __DIR__ . '/../models/User.php';
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
$token = isset($input['token']) ? trim($input['token']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($token) || empty($password) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid token or password']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();

    // Find token record (schema-aware)
    $colStmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'password_resets'");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    if (in_array('reset_token', $cols)) {
        $tokenCol = 'reset_token';
    } elseif (in_array('token', $cols)) {
        $tokenCol = 'token';
    } else {
        // no token column
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit();
    }

    $stmt = $db->prepare("SELECT * FROM password_resets WHERE " . $tokenCol . " = ? LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
        exit();
    }

    // Check expiry
    $expires = new DateTime($row['expires_at']);
    $now = new DateTime();
    if ($now > $expires) {
        // remove token
        $del = $db->prepare("DELETE FROM password_resets WHERE id = ?");
        $del->execute([$row['id']]);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token expired']);
        exit();
    }

    // Determine associated user
    if (isset($row['user_id']) && $row['user_id']) {
        $userId = $row['user_id'];
    } elseif (isset($row['email']) && $row['email']) {
        $email = $row['email'];
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $userStmt->execute([$email]);
        $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
        $userId = $userRow['id'] ?? null;
    } else {
        $userId = null;
    }

    if (!$userId) {
        // For security, still delete token (by id) and return success
        $del = $db->prepare("DELETE FROM password_resets WHERE id = ?");
        $del->execute([$row['id']]);
        echo json_encode(['success' => true, 'message' => 'Password updated if account exists']);
        exit();
    }

    // Hash password and update user
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $upd = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
    $upd->execute([$hashed, $userId]);

    // Delete token
    $del = $db->prepare("DELETE FROM password_resets WHERE id = ?");
    $del->execute([$row['id']]);

    echo json_encode(['success' => true, 'message' => 'Password updated']);
} catch (Exception $e) {
    error_log("Reset password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to reset password']);
}
