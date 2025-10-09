import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  User,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MessagingModal from "./MessagingModal";

interface Conversation {
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
  is_buyer: boolean;
  other_user: {
    id: number;
    username: string;
    name: string;
  };
  unread_count: number;
}

const ConversationList: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messagingModalOpen, setMessagingModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/messages.php?action=conversations&user_id=${user.id}`,
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

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessagingModalOpen(true);
  };

  const handleCloseMessaging = () => {
    setMessagingModalOpen(false);
    setSelectedConversation(null);
    // Refresh conversations to update unread counts
    fetchConversations();
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

  const totalUnreadCount = conversations.reduce(
    (sum, conv) => sum + conv.unread_count,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Messages</span>
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConversations}
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
        <CardContent>
          {loading && conversations.length === 0 ? (
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
              <Button onClick={fetchConversations}>Try Again</Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500">
                Start messaging when you win an auction or someone contacts you
                about your listings.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card
                    key={`${conversation.auction_id}-${conversation.other_user.id}`}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      conversation.unread_count > 0
                        ? "bg-blue-50/50 border-blue-200"
                        : ""
                    }`}
                    onClick={() => handleOpenConversation(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold truncate">
                                {conversation.other_user.name}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {conversation.unread_count > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTime(conversation.last_message_at)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-blue-600 mb-1 truncate">
                              {conversation.auction_title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {truncateMessage(conversation.last_message)}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {conversation.is_buyer
                                  ? "You are buyer"
                                  : "You are seller"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConversation(conversation);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
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

      {/* Messaging Modal */}
      {selectedConversation && (
        <MessagingModal
          isOpen={messagingModalOpen}
          onClose={handleCloseMessaging}
          auctionId={selectedConversation.auction_id}
          recipientId={selectedConversation.other_user.id}
          auctionTitle={selectedConversation.auction_title}
        />
      )}
    </>
  );
};

export default ConversationList;
