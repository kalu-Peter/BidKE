import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Clock, AlertCircle, Trash2 } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPageProps {
  userId: number;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async (filter = 'all') => {
    try {
      setLoading(true);
      let url = `http://localhost:8000/notifications.php?user_id=${userId}&limit=50`;
      
      if (filter === 'unread') {
        url += '&unread_only=true';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    try {
      const response = await fetch('http://localhost:8000/notifications.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          notification_ids: notificationIds
        })
      });

      if (response.ok) {
        await fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8000/notifications.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          mark_all: true
        })
      });

      if (response.ok) {
        await fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch('http://localhost:8000/notifications.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          notification_id: notificationId
        })
      });

      if (response.ok) {
        await fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [userId, activeTab]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'auction_approved':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'auction_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'auction_live':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'auction_info_requested':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'auction_approved':
        return 'bg-green-100 text-green-800';
      case 'auction_rejected':
        return 'bg-red-100 text-red-800';
      case 'auction_live':
        return 'bg-blue-100 text-blue-800';
      case 'auction_info_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadNotifications.length > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NotificationsList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            formatDateTime={formatDateTime}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NotificationsList
            notifications={unreadNotifications}
            loading={loading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            formatDateTime={formatDateTime}
          />
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          <NotificationsList
            notifications={readNotifications}
            loading={loading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            formatDateTime={formatDateTime}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (ids: number[]) => void;
  onDelete: (id: number) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getNotificationColor: (type: string) => string;
  formatDateTime: (date: string) => string;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationColor,
  formatDateTime
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notifications found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-colors ${
            notification.is_read 
              ? 'bg-white border-gray-200' 
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {notification.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getNotificationColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                    {!notification.is_read && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">
                  {notification.message}
                </p>

                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="bg-gray-100 p-3 rounded-lg mb-3">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Additional Details:</h4>
                    <div className="text-sm text-gray-600">
                      {notification.data.auction_title && (
                        <p><strong>Auction:</strong> {notification.data.auction_title}</p>
                      )}
                      {notification.data.admin_name && (
                        <p><strong>Reviewed by:</strong> {notification.data.admin_name}</p>
                      )}
                      {notification.data.reason && (
                        <p><strong>Reason:</strong> {notification.data.reason}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {formatDateTime(notification.created_at)}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    {!notification.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkAsRead([notification.id])}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark as read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsPage;
