<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/config.php';
require_once 'utils/cors.php';

try {
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $pdo = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGetMessages($pdo);
            break;
        case 'POST':
            handleSendMessage($pdo);
            break;
        case 'PUT':
            handleMarkAsRead($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'details' => ['message' => $e->getMessage()]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'details' => ['message' => $e->getMessage()]
    ]);
}

/**
 * Get messages for a specific auction conversation
 */
function handleGetMessages($pdo)
{
    $auctionId = $_GET['auction_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;
    $action = $_GET['action'] ?? 'conversation';

    if (!$auctionId || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing auction_id or user_id']);
        return;
    }

    if ($action === 'conversations') {
        // Get all conversations for a user
        getConversations($pdo, $userId);
        return;
    }

    // Get messages for specific auction conversation
    $stmt = $pdo->prepare("
        SELECT 
            m.id,
            m.auction_id,
            m.sender_id,
            m.recipient_id,
            m.message,
            m.is_read,
            m.created_at,
            u_sender.username as sender_username,
            u_sender.full_name as sender_name,
            u_recipient.username as recipient_username,
            u_recipient.full_name as recipient_name,
            a.title as auction_title
        FROM messages m
        JOIN users u_sender ON m.sender_id = u_sender.id
        JOIN users u_recipient ON m.recipient_id = u_recipient.id
        JOIN auctions a ON m.auction_id = a.id
        WHERE m.auction_id = :auction_id 
        AND (m.sender_id = :user_id OR m.recipient_id = :user_id)
        ORDER BY m.created_at ASC
    ");

    $stmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId
    ]);

    $messages = $stmt->fetchAll();

    // Get conversation info
    $conversationStmt = $pdo->prepare("
        SELECT 
            cp.auction_id,
            cp.buyer_id,
            cp.seller_id,
            cp.last_message_at,
            cp.buyer_unread_count,
            cp.seller_unread_count,
            u_buyer.username as buyer_username,
            u_buyer.full_name as buyer_name,
            u_seller.username as seller_username,
            u_seller.full_name as seller_name,
            a.title as auction_title
        FROM conversation_participants cp
        JOIN users u_buyer ON cp.buyer_id = u_buyer.id
        JOIN users u_seller ON cp.seller_id = u_seller.id
        JOIN auctions a ON cp.auction_id = a.id
        WHERE cp.auction_id = :auction_id 
        AND (cp.buyer_id = :user_id OR cp.seller_id = :user_id)
    ");

    $conversationStmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId
    ]);

    $conversation = $conversationStmt->fetch();

    // Determine unread count for current user
    $unreadCount = 0;
    if ($conversation) {
        $unreadCount = ($conversation['buyer_id'] == $userId)
            ? $conversation['buyer_unread_count']
            : $conversation['seller_unread_count'];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'messages' => $messages,
            'conversation' => $conversation,
            'unread_count' => $unreadCount
        ]
    ]);
}

/**
 * Get all conversations for a user
 */
function getConversations($pdo, $userId)
{
    $stmt = $pdo->prepare("
        SELECT 
            cp.auction_id,
            cp.buyer_id,
            cp.seller_id,
            cp.last_message_at,
            cp.buyer_unread_count,
            cp.seller_unread_count,
            u_buyer.username as buyer_username,
            u_buyer.full_name as buyer_name,
            u_seller.username as seller_username,
            u_seller.full_name as seller_name,
            a.title as auction_title,
            (SELECT m.message 
             FROM messages m 
             WHERE m.auction_id = cp.auction_id 
             ORDER BY m.created_at DESC LIMIT 1) as last_message
        FROM conversation_participants cp
        JOIN users u_buyer ON cp.buyer_id = u_buyer.id
        JOIN users u_seller ON cp.seller_id = u_seller.id
        JOIN auctions a ON cp.auction_id = a.id
        WHERE cp.buyer_id = :user_id OR cp.seller_id = :user_id
        ORDER BY cp.last_message_at DESC
    ");

    $stmt->execute(['user_id' => $userId]);
    $conversations = $stmt->fetchAll();

    // Add formatted data for each conversation
    foreach ($conversations as &$conversation) {
        $conversation['is_buyer'] = $conversation['buyer_id'] == $userId;
        $conversation['other_user'] = $conversation['is_buyer']
            ? [
                'id' => $conversation['seller_id'],
                'username' => $conversation['seller_username'],
                'name' => $conversation['seller_name']
            ]
            : [
                'id' => $conversation['buyer_id'],
                'username' => $conversation['buyer_username'],
                'name' => $conversation['buyer_name']
            ];
        $conversation['unread_count'] = $conversation['is_buyer']
            ? $conversation['buyer_unread_count']
            : $conversation['seller_unread_count'];
    }

    echo json_encode([
        'success' => true,
        'data' => $conversations
    ]);
}

/**
 * Send a new message
 */
function handleSendMessage($pdo)
{
    $input = json_decode(file_get_contents('php://input'), true);

    $auctionId = $input['auction_id'] ?? null;
    $senderId = $input['sender_id'] ?? null;
    $recipientId = $input['recipient_id'] ?? null;
    $message = trim($input['message'] ?? '');

    if (!$auctionId || !$senderId || !$recipientId || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }

    // Validate that auction exists and users are involved
    $auctionStmt = $pdo->prepare("
        SELECT id, seller_id, winner_id 
        FROM auctions 
        WHERE id = :auction_id
    ");
    $auctionStmt->execute(['auction_id' => $auctionId]);
    $auction = $auctionStmt->fetch();

    if (!$auction) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Auction not found']);
        return;
    }

    // Validate that sender and recipient are related to this auction
    $validParticipants = [$auction['seller_id']];
    if ($auction['winner_id']) {
        $validParticipants[] = $auction['winner_id'];
    }

    if (!in_array($senderId, $validParticipants) || !in_array($recipientId, $validParticipants)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Unauthorized to message in this auction']);
        return;
    }

    // Insert the message
    $stmt = $pdo->prepare("
        INSERT INTO messages (auction_id, sender_id, recipient_id, message) 
        VALUES (:auction_id, :sender_id, :recipient_id, :message)
        RETURNING id, created_at
    ");

    $stmt->execute([
        'auction_id' => $auctionId,
        'sender_id' => $senderId,
        'recipient_id' => $recipientId,
        'message' => $message
    ]);

    $result = $stmt->fetch();

    // Get the complete message data to return
    $messageStmt = $pdo->prepare("
        SELECT 
            m.id,
            m.auction_id,
            m.sender_id,
            m.recipient_id,
            m.message,
            m.is_read,
            m.created_at,
            u_sender.username as sender_username,
            u_sender.full_name as sender_name
        FROM messages m
        JOIN users u_sender ON m.sender_id = u_sender.id
        WHERE m.id = :message_id
    ");

    $messageStmt->execute(['message_id' => $result['id']]);
    $messageData = $messageStmt->fetch();

    echo json_encode([
        'success' => true,
        'data' => $messageData
    ]);
}

/**
 * Mark messages as read
 */
function handleMarkAsRead($pdo)
{
    $input = json_decode(file_get_contents('php://input'), true);

    $auctionId = $input['auction_id'] ?? null;
    $userId = $input['user_id'] ?? null;

    if (!$auctionId || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing auction_id or user_id']);
        return;
    }

    // Mark all messages as read for this user in this conversation
    $stmt = $pdo->prepare("
        UPDATE messages 
        SET is_read = TRUE 
        WHERE auction_id = :auction_id 
        AND recipient_id = :user_id 
        AND is_read = FALSE
    ");

    $stmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId
    ]);

    // Update conversation participants unread count
    $updateStmt = $pdo->prepare("
        UPDATE conversation_participants 
        SET 
            buyer_unread_count = CASE WHEN buyer_id = :user_id THEN 0 ELSE buyer_unread_count END,
            seller_unread_count = CASE WHEN seller_id = :user_id THEN 0 ELSE seller_unread_count END
        WHERE auction_id = :auction_id 
        AND (buyer_id = :user_id OR seller_id = :user_id)
    ");

    $updateStmt->execute([
        'auction_id' => $auctionId,
        'user_id' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'data' => ['messages_marked' => $stmt->rowCount()]
    ]);
}
