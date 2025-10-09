import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  User,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminConversation {
  auction_id: number;
  buyer_id: number;
  seller_id: number;
  last_message_at: string;
  buyer_unread_count: number;
  seller_unread_count: number;
  buyer_username: string;
  buyer_name: string;
  seller_username: string;
  seller_name: string;
  auction_title: string;
  last_message: string;
  total_messages: number;
}

interface AdminMessage {
  id: number;
  auction_id: number;
  sender_id: number;
  recipient_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  sender_name: string;
  recipient_username: string;
  recipient_name: string;
}

const AdminMessagingMonitor: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAllConversations();
  }, []);

  const fetchAllConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/admin/messages-monitor.php`,
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
        setConversations(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load conversations"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (
    auctionId: number,
    buyerId: number,
    sellerId: number
  ) => {
    try {
      setLoadingMessages(true);

      const response = await fetch(
        `http://localhost:8000/admin/messages-monitor.php?action=messages&auction_id=${auctionId}&buyer_id=${buyerId}&seller_id=${sellerId}`,
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
        setMessages(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewConversation = (conversation: AdminConversation) => {
    setSelectedConversation(conversation);
    setModalOpen(true);
    fetchConversationMessages(
      conversation.auction_id,
      conversation.buyer_id,
      conversation.seller_id
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (!message) return "";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.auction_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.buyer_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.seller_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalConversations = conversations.length;
  const activeConversations = conversations.filter((conv) => {
    const lastMessage = new Date(conv.last_message_at);
    const daysSince = Math.floor(
      (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince <= 7;
  }).length;
  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.buyer_unread_count + conv.seller_unread_count,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Messaging Monitor</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllConversations}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalConversations}
              </div>
              <div className="text-sm text-blue-600">Total Conversations</div>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {activeConversations}
              </div>
              <div className="text-sm text-green-600">Active (7 days)</div>
            </div>
            <div className="bg-orange-500/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {totalUnread}
              </div>
              <div className="text-sm text-orange-600">Unread Messages</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations by auction, buyer, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
              <span>Loading conversations...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Error Loading Conversations
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchAllConversations}>Try Again</Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm
                  ? "No matching conversations"
                  : "No conversations yet"}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Conversations will appear here when buyers and sellers start messaging."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={`${conversation.auction_id}-${conversation.buyer_id}-${conversation.seller_id}`}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleViewConversation(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold truncate">
                              {conversation.auction_title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {conversation.buyer_unread_count +
                                conversation.seller_unread_count >
                                0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {conversation.buyer_unread_count +
                                    conversation.seller_unread_count}{" "}
                                  unread
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(conversation.last_message_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600">
                                Buyer:
                              </span>
                              <span className="text-xs font-medium">
                                {conversation.buyer_name}
                              </span>
                              {conversation.buyer_unread_count > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs h-4"
                                >
                                  {conversation.buyer_unread_count}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">
                                Seller:
                              </span>
                              <span className="text-xs font-medium">
                                {conversation.seller_name}
                              </span>
                              {conversation.seller_unread_count > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs h-4"
                                >
                                  {conversation.seller_unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 truncate mb-2">
                            {truncateMessage(conversation.last_message)}
                          </p>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {conversation.total_messages} messages
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewConversation(conversation);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Monitor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Conversation Monitor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <span>Monitoring Conversation</span>
                {selectedConversation && (
                  <div className="text-sm font-normal text-muted-foreground">
                    {selectedConversation.auction_title}
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation && (
              <div className="bg-muted/50 p-3 rounded mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-600">Buyer:</span>{" "}
                    {selectedConversation.buyer_name} (@
                    {selectedConversation.buyer_username})
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Seller:</span>{" "}
                    {selectedConversation.seller_name} (@
                    {selectedConversation.seller_username})
                  </div>
                </div>
              </div>
            )}

            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                <span>Loading messages...</span>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No messages in this conversation.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="border rounded-lg p-3 bg-background"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">
                              {message.sender_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {message.sender_id ===
                              selectedConversation?.buyer_id
                                ? "Buyer"
                                : "Seller"}
                            </Badge>
                            {!message.is_read && (
                              <Badge variant="destructive" className="text-xs">
                                Unread
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMessagingMonitor;
