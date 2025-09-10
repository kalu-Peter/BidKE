import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Bell,
  Mail,
  MessageSquare
} from 'lucide-react';

export interface NotificationData {
  id: string;
  type: 'outbid' | 'winning' | 'won' | 'lost' | 'starting' | 'ending';
  title: string;
  message: string;
  auctionId: number;
  auctionTitle: string;
  timestamp: Date;
  isRead: boolean;
}

interface BidNotificationProps {
  notification: NotificationData;
  onClose: () => void;
  onEmailAlert?: () => void;
  onSMSAlert?: () => void;
}

const BidNotification: React.FC<BidNotificationProps> = ({ 
  notification, 
  onClose, 
  onEmailAlert, 
  onSMSAlert 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 10 seconds for non-critical notifications
    if (notification.type !== 'outbid' && notification.type !== 'won') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow fade out animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification.type, onClose]);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'outbid':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'winning':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'won':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'lost':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'starting':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'ending':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'outbid':
        return 'border-red-200 bg-red-50';
      case 'winning':
        return 'border-green-200 bg-green-50';
      case 'won':
        return 'border-green-300 bg-green-100';
      case 'lost':
        return 'border-orange-200 bg-orange-50';
      case 'starting':
        return 'border-blue-200 bg-blue-50';
      case 'ending':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`fixed top-24 right-4 z-50 w-96 shadow-lg transition-all duration-300 ${getNotificationColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getNotificationIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Auction: {notification.auctionTitle}
            </p>
            
            {/* Action buttons for outbid and won notifications */}
            {(notification.type === 'outbid' || notification.type === 'won') && (
              <div className="flex space-x-2">
                {onEmailAlert && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEmailAlert}
                    className="text-xs h-7"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Email Alert
                  </Button>
                )}
                {onSMSAlert && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSMSAlert}
                    className="text-xs h-7"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    SMS Alert
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Notification Manager Hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Common notification creators
  const notifyOutbid = (auctionId: number, auctionTitle: string, currentBid: number) => {
    return addNotification({
      type: 'outbid',
      title: 'You have been outbid!',
      message: `Someone placed a higher bid of KES ${currentBid.toLocaleString()}. Place a new bid to stay in the game!`,
      auctionId,
      auctionTitle
    });
  };

  const notifyWinning = (auctionId: number, auctionTitle: string) => {
    return addNotification({
      type: 'winning',
      title: 'Congratulations!',
      message: "You're currently the highest bidder! Keep an eye on the auction.",
      auctionId,
      auctionTitle
    });
  };

  const notifyWon = (auctionId: number, auctionTitle: string, winningBid: number) => {
    return addNotification({
      type: 'won',
      title: 'Auction Won!',
      message: `Congratulations! You won this auction with a bid of KES ${winningBid.toLocaleString()}.`,
      auctionId,
      auctionTitle
    });
  };

  const notifyLost = (auctionId: number, auctionTitle: string, winningBid: number) => {
    return addNotification({
      type: 'lost',
      title: 'Auction Ended',
      message: `This auction ended with a winning bid of KES ${winningBid.toLocaleString()}. Better luck next time!`,
      auctionId,
      auctionTitle
    });
  };

  const notifyAuctionStarting = (auctionId: number, auctionTitle: string, startTime: string) => {
    return addNotification({
      type: 'starting',
      title: 'Auction Starting Soon',
      message: `The auction you're watching starts at ${startTime}. Get ready to bid!`,
      auctionId,
      auctionTitle
    });
  };

  const notifyAuctionEnding = (auctionId: number, auctionTitle: string, timeLeft: string) => {
    return addNotification({
      type: 'ending',
      title: 'Auction Ending Soon',
      message: `This auction ends in ${timeLeft}. Place your final bids now!`,
      auctionId,
      auctionTitle
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    // Helper methods
    notifyOutbid,
    notifyWinning,
    notifyWon,
    notifyLost,
    notifyAuctionStarting,
    notifyAuctionEnding
  };
};

// Notification Container Component
interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
  onEmailAlert?: (notification: NotificationData) => void;
  onSMSAlert?: (notification: NotificationData) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  onEmailAlert,
  onSMSAlert
}) => {
  return (
    <div className="fixed top-0 right-0 z-50 space-y-2">
      {notifications.slice(0, 3).map((notification) => (
        <BidNotification
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onEmailAlert={onEmailAlert ? () => onEmailAlert(notification) : undefined}
          onSMSAlert={onSMSAlert ? () => onSMSAlert(notification) : undefined}
        />
      ))}
    </div>
  );
};

export default BidNotification;
