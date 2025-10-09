import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  MessageCircle,
  X,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: number;
  auction_id: number;
  sender_id: number;
  recipient_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  sender_name: string;
}

interface Conversation {
  auction_id: number;
  buyer_id: number;
  seller_id: number;
  buyer_username: string;
  buyer_name: string;
  seller_username: string;
  seller_name: string;
  auction_title: string;
}

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: number;
  recipientId: number;
  auctionTitle?: string;
}

const MessagingModal: React.FC<MessagingModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  recipientId,
  auctionTitle,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when modal opens
  useEffect(() => {
    if (isOpen && user?.id && auctionId) {
      fetchMessages();
      // Mark messages as read when opening
      markAsRead();
    }
  }, [isOpen, user?.id, auctionId]);

  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/messages.php?auction_id=${auctionId}&user_id=${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
        setConversation(data.data.conversation);
      } else {
        throw new Error(data.error || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch("http://localhost:8000/messages.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          auction_id: auctionId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Add new message to the list
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (!user?.id) return;

    try {
      await fetch("http://localhost:8000/messages.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          auction_id: auctionId,
          user_id: user.id,
        }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return (
        "Yesterday " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else {
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user?.id) return null;

    if (conversation.buyer_id === user.id) {
      return {
        id: conversation.seller_id,
        name: conversation.seller_name,
        username: conversation.seller_username,
        role: "Seller",
      };
    } else {
      return {
        id: conversation.buyer_id,
        name: conversation.buyer_name,
        username: conversation.buyer_username,
        role: "Buyer",
      };
    }
  };

  const otherParticipant = getOtherParticipant();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <div>
              <span>
                {otherParticipant
                  ? `Message ${otherParticipant.role}: ${otherParticipant.name}`
                  : "Messages"}
              </span>
              {auctionTitle && (
                <div className="text-sm font-normal text-muted-foreground">
                  {auctionTitle}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
              <span>Loading messages...</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">Error loading messages</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <Button onClick={fetchMessages} size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {!isOwnMessage && (
                              <User className="w-4 h-4 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              {!isOwnMessage && (
                                <p className="text-xs font-medium mb-1">
                                  {message.sender_name}
                                </p>
                              )}
                              <p className="text-sm">{message.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
