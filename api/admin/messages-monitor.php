<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/config.php';
require_once '../utils/cors.php';

try {
    $dsn = "pgsql:host=localhost;port=5054;dbname=bidlode";
    $pdo = new PDO($dsn, 'postgres', 'webwiz', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'conversations';

        if ($action === 'messages') {
            handleGetMessages($pdo);
        } else {
            handleGetAllConversations($pdo);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
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
 * Get all conversations for admin monitoring
 */
function handleGetAllConversations($pdo)
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
             ORDER BY m.created_at DESC LIMIT 1) as last_message,
            (SELECT COUNT(*) 
             FROM messages m 
             WHERE m.auction_id = cp.auction_id) as total_messages
        FROM conversation_participants cp
        JOIN users u_buyer ON cp.buyer_id = u_buyer.id
        JOIN users u_seller ON cp.seller_id = u_seller.id
        JOIN auctions a ON cp.auction_id = a.id
        ORDER BY cp.last_message_at DESC
    ");

    $stmt->execute();
    $conversations = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $conversations
    ]);
}

/**
 * Get messages for a specific conversation (admin view)
 */
function handleGetMessages($pdo)
{
    $auctionId = $_GET['auction_id'] ?? null;
    $buyerId = $_GET['buyer_id'] ?? null;
    $sellerId = $_GET['seller_id'] ?? null;

    if (!$auctionId || !$buyerId || !$sellerId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing auction_id, buyer_id, or seller_id']);
        return;
    }

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
            u_recipient.full_name as recipient_name
        FROM messages m
        JOIN users u_sender ON m.sender_id = u_sender.id
        JOIN users u_recipient ON m.recipient_id = u_recipient.id
        WHERE m.auction_id = :auction_id 
        AND ((m.sender_id = :buyer_id AND m.recipient_id = :seller_id) 
             OR (m.sender_id = :seller_id AND m.recipient_id = :buyer_id))
        ORDER BY m.created_at ASC
    ");

    $stmt->execute([
        'auction_id' => $auctionId,
        'buyer_id' => $buyerId,
        'seller_id' => $sellerId
    ]);

    $messages = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $messages
    ]);
}
