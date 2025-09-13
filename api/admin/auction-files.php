<?php
header('Content-Type: application/json');

// Allow development ports
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
function getDBConnection() {
    try {
        $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
        $connection = new PDO($dsn, 'postgres', 'webwiz', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        return $connection;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit();
    }
}

// Create auction_files table if it doesn't exist
function createAuctionFilesTable() {
    try {
        $pdo = getDBConnection();
        $sql = "
            CREATE TABLE IF NOT EXISTS auction_files (
                id SERIAL PRIMARY KEY,
                auction_id INTEGER NOT NULL,
                file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'document')),
                original_name VARCHAR(255) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
            )
        ";
        $pdo->exec($sql);
        
        // Create index for faster queries
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auction_files_auction_id ON auction_files(auction_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auction_files_type ON auction_files(file_type)");
        
    } catch (Exception $e) {
        error_log("Failed to create auction_files table: " . $e->getMessage());
    }
}

// Initialize table
createAuctionFilesTable();

// Get files for auction
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $auctionId = $_GET['auction_id'] ?? null;
        $fileType = $_GET['type'] ?? 'all'; // 'image', 'document', or 'all'
        
        if (!$auctionId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Auction ID is required']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        $query = "SELECT * FROM auction_files WHERE auction_id = :auction_id";
        $params = ['auction_id' => $auctionId];
        
        if ($fileType !== 'all') {
            $query .= " AND file_type = :file_type";
            $params['file_type'] = $fileType;
        }
        
        $query .= " ORDER BY uploaded_at ASC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $files = $stmt->fetchAll();
        
        // Format file URLs
        foreach ($files as &$file) {
            $file['url'] = 'http://localhost:8000/' . $file['file_path'];
            $file['file_size'] = (int)$file['file_size'];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $files
        ]);
        
    } catch (Exception $e) {
        error_log("Get auction files error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch files']);
    }
}
// Upload files for auction
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $auctionId = $_POST['auction_id'] ?? null;
        $fileType = $_POST['file_type'] ?? 'image'; // 'image' or 'document'
        
        if (!$auctionId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Auction ID is required']);
            exit();
        }
        
        if (empty($_FILES['files'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No files uploaded']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        // Verify auction exists
        $stmt = $pdo->prepare("SELECT id FROM auctions WHERE id = :id");
        $stmt->execute(['id' => $auctionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Auction not found']);
            exit();
        }
        
        $uploadDir = __DIR__ . '/uploads/auctions/' . $auctionId . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $uploadedFiles = [];
        $files = $_FILES['files'];
        
        // Handle multiple files
        if (is_array($files['name'])) {
            $fileCount = count($files['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $uploadedFiles[] = [
                        'name' => $files['name'][$i],
                        'tmp_name' => $files['tmp_name'][$i],
                        'size' => $files['size'][$i],
                        'type' => $files['type'][$i],
                        'error' => $files['error'][$i]
                    ];
                }
            }
        } else {
            if ($files['error'] === UPLOAD_ERR_OK) {
                $uploadedFiles[] = $files;
            }
        }
        
        $savedFiles = [];
        $maxFileSize = 10 * 1024 * 1024; // 10MB
        
        $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        foreach ($uploadedFiles as $file) {
            // Validate file size
            if ($file['size'] > $maxFileSize) {
                continue; // Skip large files
            }
            
            // Validate file type
            if ($fileType === 'image' && !in_array($file['type'], $allowedImageTypes)) {
                continue;
            }
            if ($fileType === 'document' && !in_array($file['type'], $allowedDocTypes)) {
                continue;
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $uploadDir . $fileName;
            $relativeePath = 'uploads/auctions/' . $auctionId . '/' . $fileName;
            
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Save to database
                $stmt = $pdo->prepare("
                    INSERT INTO auction_files (auction_id, file_type, original_name, file_name, file_path, file_size, mime_type)
                    VALUES (:auction_id, :file_type, :original_name, :file_name, :file_path, :file_size, :mime_type)
                    RETURNING id
                ");
                
                $stmt->execute([
                    'auction_id' => $auctionId,
                    'file_type' => $fileType,
                    'original_name' => $file['name'],
                    'file_name' => $fileName,
                    'file_path' => $relativeePath,
                    'file_size' => $file['size'],
                    'mime_type' => $file['type']
                ]);
                
                $fileId = $stmt->fetchColumn();
                
                $savedFiles[] = [
                    'id' => $fileId,
                    'original_name' => $file['name'],
                    'file_name' => $fileName,
                    'url' => 'http://localhost:8000/' . $relativeePath,
                    'file_size' => $file['size'],
                    'mime_type' => $file['type'],
                    'file_type' => $fileType
                ];
            }
        }
        
        if (empty($savedFiles)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No valid files were uploaded']);
            exit();
        }
        
        echo json_encode([
            'success' => true,
            'message' => count($savedFiles) . ' files uploaded successfully',
            'data' => $savedFiles
        ]);
        
    } catch (Exception $e) {
        error_log("Upload files error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to upload files']);
    }
}
// Delete file
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $fileId = $input['file_id'] ?? null;
        
        if (!$fileId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File ID is required']);
            exit();
        }
        
        $pdo = getDBConnection();
        
        // Get file info
        $stmt = $pdo->prepare("SELECT * FROM auction_files WHERE id = :id");
        $stmt->execute(['id' => $fileId]);
        $file = $stmt->fetch();
        
        if (!$file) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'File not found']);
            exit();
        }
        
        // Delete physical file
        $fullPath = __DIR__ . '/' . $file['file_path'];
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM auction_files WHERE id = :id");
        $stmt->execute(['id' => $fileId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'File deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete file error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete file']);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
