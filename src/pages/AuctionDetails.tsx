import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
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
  DollarSign,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import {
  useNotifications,
  NotificationContainer,
} from "@/components/notifications/BidNotification";

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
  description: string;
  images: string[];
  seller: {
    name: string;
    verified: boolean;
    rating: number;
    totalSales: number;
    avatar?: string; // Optional avatar property
  };
  starting_price: number;
  current_bid: number;
  reserve_price?: number;
  bid_increment: number;
  time_remaining: number;
  status: string;
  bid_history: BidHistoryItem[];
  isWatched: boolean;
  end_time: string;
  start_time: string;
  category_name: string;
  category_slug: string;
  seller_name: string;
  seller_email: string;
  featured: boolean;
  view_count: number;
  bid_count: number;
  auction_ended: boolean;
}

interface ApiResponse {
  success: boolean;
  data: AuctionItem;
  message?: string;
}

const AuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Safe auth hook usage with error handling
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user || null;
  } catch (error) {
    console.warn(
      "Auth context not available, continuing without authentication:",
      error
    );
    // Continue without user authentication - component will show login prompts
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    mode: "ended" as "live" | "upcoming" | "ended",
  });
  const [auction, setAuction] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notification system
  const {
    notifications,
    removeNotification,
    notifyOutbid,
    notifyWinning,
    notifyWon,
    notifyAuctionEnding,
  } = useNotifications();

  // Fetch auction data from API
  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!id) {
        setError("Auction ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:8000/auction-details.php?id=${id}`
        );
        const result: ApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch auction details");
        }

        // Transform API data to match component interface
        const auctionData: AuctionItem = {
          ...result.data,
          images: result.data.images.map((img: string) => {
            // Convert backend image paths to frontend-compatible paths
            if (img.startsWith("/src/assets/")) {
              return img; // Use as relative path for Vite
            } else if (img.startsWith("http")) {
              return img; // Already a full URL
            } else {
              return `http://localhost:8000${img}`; // Backend served images
            }
          }),
          seller: {
            name: result.data.seller_name,
            verified: true, // You can add verification logic later
            rating: 4.8, // Mock rating for now
            totalSales: 50, // Mock total sales for now
            avatar: undefined, // API doesn't provide avatar, so set to undefined
          },
          isWatched: false, // Will be updated below if user is logged in
        };

        setAuction(auctionData);
        // If the user is authenticated, check if this auction is on their watchlist
        try {
          if (user && user.id) {
            const wl = await apiService.getWatchlist(user?.id);
            if (wl.success && Array.isArray(wl.data)) {
              const found = (wl.data as any[]).some(
                (w) => Number(w.auction_id) === Number(id)
              );
              setAuction((prev) =>
                prev ? { ...prev, isWatched: found } : prev
              );
            }
          }
        } catch (err) {
          // Non-fatal - ignore watchlist check failures
          console.warn("Failed to check watchlist status:", err);
        }
      } catch (err) {
        console.error("Error fetching auction details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load auction details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [id]);

  // Countdown timer effect: compute from start_time and end_time
  useEffect(() => {
    if (!auction) return;

    const compute = () => {
      const now = new Date();
      const start = new Date(auction.start_time);
      const end = new Date(auction.end_time);

      if (now < start) {
        // Upcoming
        const totalSeconds = Math.max(
          0,
          Math.floor((start.getTime() - now.getTime()) / 1000)
        );
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          totalSeconds,
          mode: "upcoming",
        });
        return;
      }

      if (now >= end) {
        // Ended
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          mode: "ended",
        });
        setAuction((prev) =>
          prev ? { ...prev, auction_ended: true, status: "ended" } : prev
        );
        return;
      }

      // Live
      const totalSeconds = Math.max(
        0,
        Math.floor((end.getTime() - now.getTime()) / 1000)
      );
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        mode: "live",
      });
    };

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [auction?.start_time, auction?.end_time, auction?.id]);

  // Show ending notification when auction is about to end (based on computed totalSeconds)
  useEffect(() => {
    if (!auction) return;

    if (countdown.totalSeconds === 300 && countdown.mode === "live") {
      notifyAuctionEnding(auction.id, auction.title, "5 minutes");
    } else if (countdown.totalSeconds === 60 && countdown.mode === "live") {
      notifyAuctionEnding(auction.id, auction.title, "1 minute");
    }
  }, [
    countdown.totalSeconds,
    countdown.mode,
    auction?.id,
    auction?.title,
    notifyAuctionEnding,
  ]);

  const handlePrevImage = () => {
    if (!auction) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? auction.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!auction) return;
    setCurrentImageIndex((prev) =>
      prev === auction.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePlaceBid = async () => {
    if (!user || !user.id) {
      navigate("/login");
      return;
    }

    if (!auction) {
      setBidError("Auction data not available");
      return;
    }

    setBidError("");
    const bidValue = parseFloat(bidAmount);

    if (isNaN(bidValue) || bidValue <= 0) {
      setBidError("Please enter a valid bid amount");
      return;
    }

    const minBid = auction.current_bid + auction.bid_increment;

    if (bidValue < minBid) {
      setBidError(`Bid must be at least KES ${minBid.toLocaleString()}`);
      return;
    }

    if (auction.status !== "live") {
      setBidError("This auction is not currently accepting bids");
      return;
    }

    if (auction.auction_ended) {
      setBidError("This auction has already ended");
      return;
    }

    setIsPlacingBid(true);

    // Simulate API call
    setTimeout(() => {
      try {
        // Add new bid to history
        const newBid: BidHistoryItem = {
          id: auction.bid_history.length + 1,
          bidder:
            user.role === "buyer" ? `Buyer#${user.id}` : `Seller#${user.id}`,
          amount: bidValue,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCurrentUser: true,
        };

        setAuction((prev) =>
          prev
            ? {
                ...prev,
                current_bid: bidValue,
                bid_history: [newBid, ...prev.bid_history],
              }
            : null
        );

        setBidAmount("");
        setIsPlacingBid(false);
        setShowBidSuccess(true);

        // Show winning notification
        notifyWinning(auction.id, auction.title);

        setTimeout(() => setShowBidSuccess(false), 3000);
      } catch (error) {
        console.error("Error placing bid:", error);
        setBidError("Failed to place bid. Please try again.");
        setIsPlacingBid(false);
      }
    }, 1500);
  };

  const handleToggleWatch = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!auction) return;

    // Optimistic UI update
    const previous = auction.isWatched;
    setAuction((prev) =>
      prev ? { ...prev, isWatched: !prev.isWatched } : prev
    );

    try {
      if (!previous) {
        // Add to watchlist
        const res = await apiService.addToWatchlist(auction.id, user?.id);
        if (!res.success) {
          throw new Error(
            res.message || res.error || "Failed to add to watchlist"
          );
        }
      } else {
        // Remove from watchlist
        const res = await apiService.removeFromWatchlist(auction.id, user?.id);
        if (!res.success) {
          throw new Error(
            res.message || res.error || "Failed to remove from watchlist"
          );
        }
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      // Rollback optimistic update
      setAuction((prev) => (prev ? { ...prev, isWatched: previous } : prev));
    }
  };

  const getStatusBadge = () => {
    if (!auction) return null;

    switch (auction.status) {
      case "upcoming":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            🔜 Upcoming
          </Badge>
        );
      case "live":
        return (
          <Badge
            variant="destructive"
            className="bg-red-50 text-red-700 border-red-200"
          >
            🔴 Live
          </Badge>
        );
      case "ended":
        return (
          <Badge
            variant="default"
            className="bg-green-50 text-green-700 border-green-200"
          >
            ✅ Ended
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const canBid =
    user &&
    (user.role === "buyer" || user.role === "seller") &&
    auction &&
    auction.status === "live";

  if (loading) {
    return (
      <>
        {user ? <UserHeader /> : <Header />}
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Auction Details
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch the auction information...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        {user ? <UserHeader /> : <Header />}
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Auction
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate("/browse-auctions")}>
              Back to Auctions
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!auction) {
    return (
      <>
        {user ? <UserHeader /> : <Header />}
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Auction Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The auction you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/browse-auctions")}>
              Back to Auctions
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {user ? <UserHeader /> : <Header />}

      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onEmailAlert={(notification) =>
          console.log("Email alert for:", notification)
        }
        onSMSAlert={(notification) =>
          console.log("SMS alert for:", notification)
        }
      />

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/browse-auctions")}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Auctions
            </Button>
            <span>/</span>
            <span>{auction.category_name}</span>
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback to default image based on category
                        if (auction.category_name === "Cars") {
                          target.src = "/src/assets/category-cars.jpg";
                        } else if (auction.category_name === "Motorbikes") {
                          target.src = "/src/assets/category-motorbikes.jpg";
                        } else if (auction.category_name === "Electronics") {
                          target.src = "/src/assets/category-electronics.jpg";
                        } else {
                          target.src = "/placeholder.svg";
                        }
                      }}
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
                        <Heart
                          className={`w-4 h-4 ${
                            auction.isWatched ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                      >
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
                            index === currentImageIndex
                              ? "border-primary"
                              : "border-gray-200"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Fallback to default image based on category
                              if (auction.category_name === "Cars") {
                                target.src = "/src/assets/category-cars.jpg";
                              } else if (
                                auction.category_name === "Motorbikes"
                              ) {
                                target.src =
                                  "/src/assets/category-motorbikes.jpg";
                              } else if (
                                auction.category_name === "Electronics"
                              ) {
                                target.src =
                                  "/src/assets/category-electronics.jpg";
                              } else {
                                target.src = "/placeholder.svg";
                              }
                            }}
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
                        <Badge variant="outline">{auction.category_name}</Badge>
                        {getStatusBadge()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {auction.description}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Category
                      </Label>
                      <p className="text-gray-900">{auction.category_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <p className="text-gray-900">
                        {auction.status.charAt(0).toUpperCase() +
                          auction.status.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Seller Information
                    </h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {auction.seller.avatar ? (
                          <img
                            src={auction.seller.avatar}
                            alt="Seller avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML =
                                  '<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                              }
                            }}
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            Seller
                          </span>
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
                      <Label className="text-sm text-gray-600">
                        Starting Price
                      </Label>
                      <p className="text-lg font-semibold">
                        KES {auction.starting_price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Min. Increment
                      </Label>
                      <p className="text-lg font-semibold">
                        KES {auction.bid_increment.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm text-gray-600">
                      Current Highest Bid
                    </Label>
                    <p className="text-3xl font-bold text-green-600">
                      KES {auction.current_bid.toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm text-gray-600">
                      Time Remaining
                    </Label>
                    {countdown.mode === "live" ? (
                      <div className="text-2xl font-mono font-bold text-red-600">
                        {countdown.days}d{" "}
                        {String(countdown.hours).padStart(2, "0")}:
                        {String(countdown.minutes).padStart(2, "0")}
                      </div>
                    ) : countdown.mode === "upcoming" ? (
                      <div className="text-2xl font-mono font-bold text-blue-600">
                        {countdown.days}d{" "}
                        {String(countdown.hours).padStart(2, "0")}:
                        {String(countdown.minutes).padStart(2, "0")} (Starts in)
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-gray-500">
                        Auction Ended
                      </p>
                    )}
                  </div>

                  {auction.auction_ended && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        This auction has ended.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Demo Notification Buttons - Remove in production */}
                  <Separator />
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">
                      Test Notifications:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          notifyOutbid(
                            auction.id,
                            auction.title,
                            auction.current_bid + 5000
                          )
                        }
                      >
                        Test Outbid
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          notifyWon(
                            auction.id,
                            auction.title,
                            auction.current_bid
                          )
                        }
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
                        placeholder={`Minimum: ${(
                          auction.current_bid + auction.bid_increment
                        ).toLocaleString()}`}
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
                      disabled={
                        isPlacingBid || !bidAmount || auction.status !== "live"
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isPlacingBid ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Bid...
                        </>
                      ) : (
                        "Place Bid"
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
                      * By placing a bid, you agree to purchase this item if you
                      win
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Login Prompt for Guests */}
              {!user && (
                <Card>
                  <CardContent className="text-center py-6">
                    <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Want to bid?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Login to start bidding on this auction
                    </p>
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full"
                    >
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
                    {auction.bid_history.map((bid) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-3 rounded ${
                          bid.isCurrentUser
                            ? "bg-primary/5 border border-primary/20"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${
                                bid.isCurrentUser
                                  ? "text-primary"
                                  : "text-gray-900"
                              }`}
                            >
                              {bid.isCurrentUser ? "You" : bid.bidder}
                            </span>
                            {bid.isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                Your Bid
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {bid.timestamp}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              bid.isCurrentUser
                                ? "text-primary"
                                : "text-gray-900"
                            }`}
                          >
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
