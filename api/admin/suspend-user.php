<?php
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../../api/models/Auth.php';

try {
    $admin = Auth::requireAuth();
    if (!Auth::hasRole('admin', $admin)) {
        Auth::error('Insufficient permissions', 403);
    }

    $db = Database::getInstance()->getConnection();

    // Read JSON input
    $raw = file_get_contents('php://input');
    $input = $raw ? json_decode($raw, true) : [];
    $userId = $input['user_id'] ?? null;
    $reason = $input['reason'] ?? null;

    if (!$userId) {
        Auth::error('Missing user_id', 400);
    }

    // Update user status to suspended and record optional suspension reason
    $updateSql = "UPDATE users SET status = 'suspended', updated_at = NOW()";
    if ($reason) {
        $updateSql .= ", suspension_reason = :reason";
    }
    $updateSql .= " WHERE id = :user_id";

    $stmt = $db->prepare($updateSql);
    $params = [':user_id' => $userId];
    if ($reason) $params[':reason'] = $reason;
    $stmt->execute($params);

    Auth::response(['success' => true, 'user_id' => (int)$userId], 'User suspended', 200);
} catch (Exception $e) {
    error_log('admin/suspend-user.php error: ' . $e->getMessage());
    Auth::error('Failed to suspend user', 500);
}
