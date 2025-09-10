import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Clock,
  User,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Gavel,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, NotificationContainer } from "@/components/notifications/BidNotification";

interface BidHistoryItem {
  id: number;
  bidder: string;
  amount: number;
  timestamp: string;
  isCurrentUser?: boolean;
}

interface AuctionItem {
  id: number;
  title: string;
  category: string;
  description: string;
  images: string[];
  seller: {
    name: string;
    verified: boolean;
    rating: number;
    totalSales: number;
  };
  startingPrice: number;
  currentBid: number;
  minimumIncrement: number;
  timeRemaining: number; // in seconds
  status: 'upcoming' | 'live' | 'ended';
  bidHistory: BidHistoryItem[];
  isWatched: boolean;
  endTime: string;
  startTime: string;
  condition: string;
  location: string;
  repossessionNotes?: string;
  winner?: string;
}

const AuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  // Notification system
  const {
    notifications,
    removeNotification,
    notifyOutbid,
    notifyWinning,
    notifyWon,
    notifyAuctionEnding
  } = useNotifications();

  // Mock auction data - in real app, this would come from API
  const [auction, setAuction] = useState<AuctionItem>({
    id: 1,
    title: "2019 Honda Boda Boda",
    category: "Motorbikes",
    description: "Well-maintained Honda motorcycle in excellent condition. Recently serviced with new tires and brakes. Perfect for commercial use or personal transportation. This motorcycle was repossessed from a defaulted loan and is being sold to recover outstanding debt.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558618847-3f0c2cf36c38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558618847-3f0c2cf36c38?auto=format&fit=crop&w=800&q=80",
    ],
    seller: {
      name: "Moto Elite Ltd",
      verified: true,
      rating: 4.8,
      totalSales: 342
    },
    startingPrice: 50000,
    currentBid: 85000,
    minimumIncrement: 2000,
    timeRemaining: 5025, // 1h 23m 45s
    status: 'live',
    bidHistory: [
      { id: 1, bidder: "Buyer#1023", amount: 85000, timestamp: "12:31 PM", isCurrentUser: false },
      { id: 2, bidder: "Buyer#0987", amount: 83000, timestamp: "12:29 PM", isCurrentUser: false },
      { id: 3, bidder: "Buyer#0432", amount: 81000, timestamp: "12:26 PM", isCurrentUser: true },
      { id: 4, bidder: "Buyer#0234", amount: 79000, timestamp: "12:24 PM", isCurrentUser: false },
      { id: 5, bidder: "Buyer#0567", amount: 77000, timestamp: "12:22 PM", isCurrentUser: false },
      { id: 6, bidder: "Buyer#0789", amount: 75000, timestamp: "12:18 PM", isCurrentUser: false },
      { id: 7, bidder: "Buyer#0345", amount: 73000, timestamp: "12:15 PM", isCurrentUser: false },
      { id: 8, bidder: "Buyer#0123", amount: 71000, timestamp: "12:12 PM", isCurrentUser: false },
    ],
    isWatched: false,
    endTime: "2025-09-10T16:30:00",
    startTime: "2025-09-08T10:00:00",
    condition: "Good - Minor wear and tear, fully functional",
    location: "Nairobi, Kenya",
    repossessionNotes: "This asset was repossessed due to loan default. All necessary legal procedures have been followed."
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (auction.timeRemaining > 0) {
        const hours = Math.floor(auction.timeRemaining / 3600);
        const minutes = Math.floor((auction.timeRemaining % 3600) / 60);
        const seconds = auction.timeRemaining % 60;
        
        setTimeLeft({ hours, minutes, seconds });
        setAuction(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      } else {
        setAuction(prev => ({ ...prev, status: 'ended' }));
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.timeRemaining]);

  // Show ending notification when auction is about to end
  useEffect(() => {
    if (auction.timeRemaining === 300) { // 5 minutes left
      notifyAuctionEnding(auction.id, auction.title, "5 minutes");
    } else if (auction.timeRemaining === 60) { // 1 minute left
      notifyAuctionEnding(auction.id, auction.title, "1 minute");
    }
  }, [auction.timeRemaining, auction.id, auction.title, notifyAuctionEnding]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? auction.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === auction.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePlaceBid = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBidError("");
    const bidValue = parseFloat(bidAmount);
    const minBid = auction.currentBid + auction.minimumIncrement;

    if (isNaN(bidValue) || bidValue < minBid) {
      setBidError(`Bid must be at least KES ${minBid.toLocaleString()}`);
      return;
    }

    if (auction.status !== 'live') {
      setBidError("This auction is not currently accepting bids");
      return;
    }

    setIsPlacingBid(true);
    
    // Simulate API call
    setTimeout(() => {
      // Add new bid to history
      const newBid: BidHistoryItem = {
        id: auction.bidHistory.length + 1,
        bidder: user.role === 'buyer' ? `Buyer#${user.id}` : `Seller#${user.id}`,
        amount: bidValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrentUser: true
      };

      setAuction(prev => ({
        ...prev,
        currentBid: bidValue,
        bidHistory: [newBid, ...prev.bidHistory]
      }));

      setBidAmount("");
      setIsPlacingBid(false);
      setShowBidSuccess(true);
      
      // Show winning notification
      notifyWinning(auction.id, auction.title);
      
      setTimeout(() => setShowBidSuccess(false), 3000);
    }, 1500);
  };

  const handleToggleWatch = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAuction(prev => ({ ...prev, isWatched: !prev.isWatched }));
  };

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">🔜 Upcoming</Badge>;
      case 'live':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">🔴 Live</Badge>;
      case 'ended':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">✅ Ended</Badge>;
    }
  };

  const canBid = user && (user.role === 'buyer' || user.role === 'seller') && auction.status === 'live';

  return (
    <>
      <Header />
      
      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onEmailAlert={(notification) => console.log('Email alert for:', notification)}
        onSMSAlert={(notification) => console.log('SMS alert for:', notification)}
      />
      
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/browse-auctions')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Auctions
            </Button>
            <span>/</span>
            <span>{auction.category}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">{auction.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Carousel */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={auction.images[currentImageIndex]}
                      alt={`${auction.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {auction.images.length}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                        onClick={handleToggleWatch}
                      >
                        <Heart className={`w-4 h-4 ${auction.isWatched ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="p-4">
                    <div className="flex space-x-2 overflow-x-auto">
                      {auction.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                            index === currentImageIndex ? 'border-primary' : 'border-gray-200'
                          }`}
                        >
                          <img 
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {auction.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{auction.category}</Badge>
                        {getStatusBadge()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{auction.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Condition</Label>
                      <p className="text-gray-900">{auction.condition}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Location</Label>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900">{auction.location}</span>
                      </div>
                    </div>
                  </div>

                  {auction.repossessionNotes && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <Label className="text-sm font-medium text-orange-700">Repossession Notice</Label>
                        </div>
                        <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded border border-orange-200">
                          {auction.repossessionNotes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Seller Info */}
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{auction.seller.name}</span>
                          {auction.seller.verified && (
                            <Shield className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>⭐ {auction.seller.rating}/5</span>
                          <span>{auction.seller.totalSales} sales</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled>
                          <Phone className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Contact information will be shared with winning bidder
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Bidding and Status */}
            <div className="space-y-6">
              {/* Auction Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gavel className="w-5 h-5 text-primary" />
                    <span>Auction Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Starting Price</Label>
                      <p className="text-lg font-semibold">KES {auction.startingPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Min. Increment</Label>
                      <p className="text-lg font-semibold">KES {auction.minimumIncrement.toLocaleString()}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm text-gray-600">Current Highest Bid</Label>
                    <p className="text-3xl font-bold text-green-600">
                      KES {auction.currentBid.toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm text-gray-600">Time Remaining</Label>
                    {auction.status === 'live' ? (
                      <div className="text-2xl font-mono font-bold text-red-600">
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                    ) : auction.status === 'ended' ? (
                      <p className="text-lg font-semibold text-gray-500">Auction Ended</p>
                    ) : (
                      <p className="text-lg font-semibold text-blue-600">Starts Soon</p>
                    )}
                  </div>

                  {auction.status === 'ended' && auction.winner && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Won by {auction.winner}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Demo Notification Buttons - Remove in production */}
                  <Separator />
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">Test Notifications:</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => notifyOutbid(auction.id, auction.title, auction.currentBid + 5000)}
                      >
                        Test Outbid
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => notifyWon(auction.id, auction.title, auction.currentBid)}
                      >
                        Test Won
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bidding Section */}
              {canBid && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span>Place Your Bid</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="bidAmount">Bid Amount (KES)</Label>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder={`Minimum: ${(auction.currentBid + auction.minimumIncrement).toLocaleString()}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="text-lg"
                      />
                      {bidError && (
                        <p className="text-sm text-red-600 mt-1">{bidError}</p>
                      )}
                    </div>

                    <Button 
                      onClick={handlePlaceBid}
                      disabled={isPlacingBid || !bidAmount || auction.status !== 'live'}
                      className="w-full"
                      size="lg"
                    >
                      {isPlacingBid ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Bid...
                        </>
                      ) : (
                        'Place Bid'
                      )}
                    </Button>

                    {showBidSuccess && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Congratulations! You're now the highest bidder!
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs text-gray-500">
                      * By placing a bid, you agree to purchase this item if you win
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Login Prompt for Guests */}
              {!user && (
                <Card>
                  <CardContent className="text-center py-6">
                    <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Want to bid?</h3>
                    <p className="text-gray-600 mb-4">Login to start bidding on this auction</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                      Login to Bid
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Bid History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <span>Bid History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {auction.bidHistory.map((bid) => (
                      <div 
                        key={bid.id}
                        className={`flex items-center justify-between p-3 rounded ${
                          bid.isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${bid.isCurrentUser ? 'text-primary' : 'text-gray-900'}`}>
                              {bid.isCurrentUser ? 'You' : bid.bidder}
                            </span>
                            {bid.isCurrentUser && (
                              <Badge variant="outline" className="text-xs">Your Bid</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{bid.timestamp}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${bid.isCurrentUser ? 'text-primary' : 'text-gray-900'}`}>
                            KES {bid.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AuctionDetails;
