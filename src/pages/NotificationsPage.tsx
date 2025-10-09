import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Eye,
  Loader2,
  X,
} from "lucide-react";

interface Notification {
  id: number;
  type:
    | "outbid"
    | "approval"
    | "rejection"
    | "won_auction"
    | "payment_received"
    | "general";
  title: string;
  message: string;
  auction_id?: number;
  auction_title?: string;
  amount?: number;
  created_at: string;
  read: boolean;
  data?: any;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const url = new URL(`http://localhost:8000/notifications.php`);
      url.searchParams.append("user_id", user.id.toString());
      url.searchParams.append("limit", "50");
      if (filter === "unread") {
        url.searchParams.append("is_read", "false");
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/notifications.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notification_id: notificationId,
          action: "mark_read",
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/notifications.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: user.id,
          action: "mark_all_read",
        }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "outbid":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "approval":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejection":
        return <X className="w-5 h-5 text-red-500" />;
      case "won_auction":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "payment_received":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to related auction if available
    if (notification.auction_id) {
      navigate(`/auction/${notification.auction_id}`);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, filter]);

  // Redirect if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  return (
    <>
      {user ? <UserHeader /> : <Header />}
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-6 h-6" />
                  <span>Notifications</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "unread" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("unread")}
                    >
                      Unread
                    </Button>
                  </div>
                  {filteredNotifications.some((n) => !n.read) && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                  <span>Loading notifications...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Error Loading Notifications
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchNotifications}>Try Again</Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No {filter === "unread" ? "unread " : ""}notifications
                  </h3>
                  <p className="text-gray-500">
                    {filter === "unread"
                      ? "You're all caught up!"
                      : "You'll see notifications here when they arrive."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          {notification.auction_title && (
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.auction_title}
                              </Badge>
                              {notification.amount && (
                                <Badge variant="secondary" className="text-xs">
                                  Ksh {notification.amount.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          )}
                          {notification.auction_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-xs text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/auction/${notification.auction_id}`);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Auction
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotificationsPage;
