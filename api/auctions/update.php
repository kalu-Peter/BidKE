<?php
// Auction update endpoint (seller-side) - supports updating drafts and submitting for review

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../utils/cors.php';

header("Content-Type: application/json");

// Set CORS headers
setCORSHeaders();
handlePreflight();

// Debug logging for CORS
error_log("CORS Debug - Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'none'));
error_log("CORS Debug - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("CORS Debug - Headers sent: " . json_encode(headers_list()));

require_once '../config/connect.php';
require_once '../models/Auth.php';

// Helper function for handling image uploads
function handleImageUpload($uploadedFiles, $index, $auctionId, $db, $uploadedBy)
{
    try {
        // Get file info based on whether it's an array or single file
        if ($index !== null) {
            $fileName = $uploadedFiles['name'][$index];
            $fileTmp = $uploadedFiles['tmp_name'][$index];
            $fileSize = $uploadedFiles['size'][$index];
            $fileType = $uploadedFiles['type'][$index];
            $fileError = $uploadedFiles['error'][$index];
        } else {
            $fileName = $uploadedFiles['name'];
            $fileTmp = $uploadedFiles['tmp_name'];
            $fileSize = $uploadedFiles['size'];
            $fileType = $uploadedFiles['type'];
            $fileError = $uploadedFiles['error'];
        }

        // Validate file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        $maxSize = 8 * 1024 * 1024; // 8MB

        if (!in_array($fileType, $allowedTypes)) {
            return ['success' => false, 'message' => 'Invalid file type'];
        }

        if ($fileSize > $maxSize) {
            return ['success' => false, 'message' => 'File too large'];
        }

        // Generate unique filename
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $newFileName = uniqid() . '_' . time() . '.' . $extension;
        $uploadPath = '/uploads/' . $newFileName;
        $fullPath = __DIR__ . '/../uploads/' . $newFileName;

        // Create uploads directory if it doesn't exist
        $uploadsDir = dirname($fullPath);
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Move uploaded file
        if (!move_uploaded_file($fileTmp, $fullPath)) {
            error_log("Failed to move uploaded file from '$fileTmp' to '$fullPath'");
            error_log("Upload directory exists: " . (is_dir($uploadsDir) ? 'YES' : 'NO'));
            error_log("Upload directory writable: " . (is_writable($uploadsDir) ? 'YES' : 'NO'));
            return ['success' => false, 'message' => 'Failed to save file'];
        }

        // Verify file was saved successfully
        if (!file_exists($fullPath)) {
            error_log("File was moved but doesn't exist at '$fullPath'");
            return ['success' => false, 'message' => 'File save verification failed'];
        }

        // Check if this auction has any images yet (to determine if this should be primary)
        $existingImagesStmt = $db->prepare("SELECT COUNT(*) FROM auction_images WHERE auction_id = :auction_id AND is_active = TRUE");
        $existingImagesStmt->execute([':auction_id' => $auctionId]);
        $existingImageCount = $existingImagesStmt->fetchColumn();

        // If this is the first image, make it primary
        $isPrimary = ($existingImageCount == 0);

        // Get next sort order
        $sortOrderStmt = $db->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM auction_images WHERE auction_id = :auction_id");
        $sortOrderStmt->execute([':auction_id' => $auctionId]);
        $nextSortOrder = $sortOrderStmt->fetchColumn();

        // Insert into auction_images table
        $imageSql = "INSERT INTO auction_images (auction_id, image_url, alt_text, is_primary, sort_order, file_name, file_size, mime_type, uploaded_by) 
                     VALUES (:auction_id, :image_url, :alt_text, :is_primary, :sort_order, :file_name, :file_size, :mime_type, :uploaded_by)";
        $imageStmt = $db->prepare($imageSql);
        $imageStmt->execute([
            ':auction_id' => $auctionId,
            ':image_url' => $uploadPath,
            ':alt_text' => pathinfo($fileName, PATHINFO_FILENAME),
            ':is_primary' => $isPrimary ? 'TRUE' : 'FALSE',
            ':sort_order' => $nextSortOrder,
            ':file_name' => $newFileName,
            ':file_size' => $fileSize,
            ':mime_type' => $fileType,
            ':uploaded_by' => $uploadedBy
        ]);

        return ['success' => true, 'file_path' => $uploadPath, 'is_primary' => $isPrimary];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Support both PUT (JSON) and POST (FormData with files)
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = [];
$auctionId = null;

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Handle JSON input for regular updates
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
        exit();
    }
    $auctionId = $input['auction_id'] ?? null;
} else {
    // Handle FormData for file uploads
    $input = $_POST;
    $auctionId = $input['auction_id'] ?? null;
}

if (!$auctionId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing auction_id']);
    exit();
}

try {
    // Debug: log incoming request context (development only)
    error_log('--- update.php request start ---');
    error_log('Request URI: ' . ($_SERVER['REQUEST_URI'] ?? ''));
    error_log('Request Method: ' . ($_SERVER['REQUEST_METHOD'] ?? ''));
    error_log('Request Headers: ' . json_encode(getallheaders()));
    error_log('Request Body: ' . json_encode($input));

    // Require authentication and ensure user is seller or admin
    $user = Auth::requireAuth();
    error_log('Authenticated user payload: ' . json_encode($user));

    // Also write development debug info to a project-local log file for easier inspection
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/update_debug.log';
    $logEntry = date('[Y-m-d H:i:s] ') . "REQUEST: " . ($_SERVER['REQUEST_METHOD'] ?? '') . " " . ($_SERVER['REQUEST_URI'] ?? '') . "\n";
    $logEntry .= "HEADERS: " . json_encode(getallheaders()) . "\n";
    $logEntry .= "BODY: " . json_encode($input) . "\n";
    $logEntry .= "USER: " . json_encode($user) . "\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    // Verify auction ownership unless admin
    try {
        $ownerStmt = $db->prepare("SELECT seller_id FROM auctions WHERE id = :id");
        $ownerStmt->execute([':id' => $auctionId]);
        $ownerRow = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        if (!$ownerRow) {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Auction not found']);
            exit();
        }

        $sellerId = (int)$ownerRow['seller_id'];
        $userId = isset($user['user_id']) ? (int)$user['user_id'] : null;
        $userRole = $user['login_role'] ?? null;

        // Allow admins to update any auction; sellers only their own
        if ($userRole !== 'admin' && $userId !== $sellerId) {
            $db->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden: you do not own this auction']);
            exit();
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) $db->rollBack();
        error_log('Ownership check error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error during ownership check']);
        exit();
    }

    // For demo, proceed to perform update
    $fields = [];
    $params = [];

    // Allowed updatable fields
    $allowed = ['title', 'description', 'startingPrice', 'reservePrice', 'start_time', 'end_time', 'status', 'auctionStartDate', 'auctionStartTime', 'auctionEndDate', 'auctionEndTime'];

    // Status mappings/validation to avoid DB constraint violations
    $allowedStatuses = ['draft', 'pending', 'active', 'ended', 'cancelled', 'sold'];
    if (isset($input['status'])) {
        // Normalize status values coming from the client
        $rawStatus = trim($input['status']);
        $statusMap = [
            'pending_review' => 'pending',
            'submitted' => 'pending',
            // add other mappings if the UI uses different identifiers
        ];

        $mappedStatus = $statusMap[$rawStatus] ?? $rawStatus;

        if (!in_array($mappedStatus, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status value']);
            exit();
        }

        // Ensure we update the DB with the mapped status
        $input['status'] = $mappedStatus;
    }

    foreach ($allowed as $f) {
        if (isset($input[$f])) {
            // Map camelCase to DB columns
            $col = $f;
            switch ($f) {
                case 'startingPrice':
                    $col = 'starting_price';
                    break;
                case 'reservePrice':
                    $col = 'reserve_price';
                    break;
                case 'start_time':
                    $col = 'start_time';
                    break;
                case 'end_time':
                    $col = 'end_time';
                    break;
            }
            $fields[] = "$col = :$col";
            $params[$col] = $input[$f];
        }
    }

    // Allow updates with no fields if we're only handling images
    if (empty($fields) && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No updatable fields provided']);
        exit();
    }

    // Only update database if there are fields to update
    if (!empty($fields)) {
        $params['id'] = $auctionId;
        $updateSql = "UPDATE auctions SET " . implode(', ', $fields) . ", updated_at = :updated_at WHERE id = :id";
        $params['updated_at'] = date('Y-m-d H:i:s');

        $stmt = $db->prepare($updateSql);
        if (!$stmt->execute($params)) {
            $err = $stmt->errorInfo();
            $db->rollBack();
            error_log('Auction update failed: ' . json_encode($err));
            // Append DB error to project log for easier debugging
            $logDir = __DIR__ . '/../logs';
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0755, true);
            }
            $logFile = $logDir . '/update_debug.log';
            $entry = date('[Y-m-d H:i:s] ') . "DB ERROR: " . json_encode($err) . "\n";
            @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update auction', 'details' => $err]);
            exit();
        }
    }

    // Handle image operations for POST requests (FormData)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Debug: Log what we received
        error_log('POST request - $_POST: ' . json_encode($_POST));
        error_log('POST request - $_FILES: ' . json_encode($_FILES));

        // Handle image removal
        if (isset($input['remove_images']) && is_array($input['remove_images']) && count($input['remove_images']) > 0) {
            error_log('Removing ' . count($input['remove_images']) . ' images: ' . json_encode($input['remove_images']));
            foreach ($input['remove_images'] as $imageToRemove) {
                // Clean up the image URL for comparison
                $cleanImageUrl = $imageToRemove;
                if (strpos($cleanImageUrl, 'http://localhost:8000') === 0) {
                    $cleanImageUrl = str_replace('http://localhost:8000', '', $cleanImageUrl);
                }

                // Find and remove from database (auction_images table)
                $removeStmt = $db->prepare("DELETE FROM auction_images WHERE auction_id = :auction_id AND image_url = :image_url");
                $result = $removeStmt->execute([
                    ':auction_id' => $auctionId,
                    ':image_url' => $cleanImageUrl
                ]);

                if ($result && $removeStmt->rowCount() > 0) {
                    error_log('Successfully removed image from database: ' . $cleanImageUrl);

                    // Remove physical file if it exists
                    $filePath = __DIR__ . '/../../' . ltrim($cleanImageUrl, '/');
                    if (file_exists($filePath)) {
                        if (unlink($filePath)) {
                            error_log('Successfully removed physical file: ' . $filePath);
                        } else {
                            error_log('Failed to remove physical file: ' . $filePath);
                        }
                    } else {
                        error_log('Physical file not found: ' . $filePath);
                    }
                } else {
                    error_log('Failed to remove image from database: ' . $cleanImageUrl);
                }
            }

            // After removing images, check if we need to set a new primary image
            $primaryCheckStmt = $db->prepare("SELECT COUNT(*) FROM auction_images WHERE auction_id = :auction_id AND is_primary = TRUE AND is_active = TRUE");
            $primaryCheckStmt->execute([':auction_id' => $auctionId]);
            $primaryCount = $primaryCheckStmt->fetchColumn();

            // If no primary image exists, make the first remaining image primary
            if ($primaryCount == 0) {
                $newPrimaryStmt = $db->prepare("UPDATE auction_images SET is_primary = TRUE WHERE auction_id = :auction_id AND is_active = TRUE ORDER BY sort_order ASC LIMIT 1");
                $newPrimaryStmt->execute([':auction_id' => $auctionId]);
                if ($newPrimaryStmt->rowCount() > 0) {
                    error_log('Set new primary image for auction: ' . $auctionId);
                }
            }
        }

        // Handle new image uploads
        if (isset($_FILES['new_images'])) {
            $uploadedFiles = $_FILES['new_images'];

            // Handle multiple files
            if (is_array($uploadedFiles['name'])) {
                $fileCount = count($uploadedFiles['name']);
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
                        $result = handleImageUpload($uploadedFiles, $i, $auctionId, $db, $userId);
                        if (!$result['success']) {
                            error_log('Image upload failed: ' . $result['message']);
                        } else {
                            error_log('Image uploaded successfully: ' . $result['file_path'] . ($result['is_primary'] ? ' (PRIMARY)' : ''));
                        }
                    }
                }
            } else {
                // Single file
                if ($uploadedFiles['error'] === UPLOAD_ERR_OK) {
                    $result = handleImageUpload($uploadedFiles, null, $auctionId, $db, $userId);
                    if (!$result['success']) {
                        error_log('Image upload failed: ' . $result['message']);
                    } else {
                        error_log('Image uploaded successfully: ' . $result['file_path'] . ($result['is_primary'] ? ' (PRIMARY)' : ''));
                    }
                }
            }
        }
    }

    // If images provided in JSON format (legacy), insert into auction_files
    if (!empty($input['images']) && is_array($input['images'])) {
        foreach ($input['images'] as $img) {
            $fileSql = "INSERT INTO auction_files (auction_id, file_type, original_name, file_name, file_path, file_size, mime_type) VALUES (:auction_id, 'image', :original_name, :file_name, :file_path, :file_size, :mime_type)";
            $fileStmt = $db->prepare($fileSql);
            $fileStmt->execute([
                ':auction_id' => $auctionId,
                ':original_name' => $img['alt_text'] ?? basename($img['url'] ?? ''),
                ':file_name' => basename($img['url'] ?? ''),
                ':file_path' => $img['url'] ?? '',
                ':file_size' => null,
                ':mime_type' => null
            ]);
        }
    }

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Auction updated', 'data' => ['auction_id' => $auctionId]]);
} catch (Exception $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    error_log('Auction update error: ' . $e->getMessage());
    // Also write exception trace to project log
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/update_debug.log';
    $entry = date('[Y-m-d H:i:s] ') . "EXCEPTION: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
    @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error during update']);
}
