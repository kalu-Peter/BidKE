import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Image as ImageIcon,
  X,
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
  primary_image?: string;
  seller: {
    name: string;
    verified: boolean;
    rating: number;
    totalSales: number;
    avatar?: string;
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
  item_type?: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  vehicle_condition?: string;
  brand?: string;
}

interface ApiResponse {
  success: boolean;
  data: AuctionItem;
  message?: string;
}

interface AuctionDetailsModalProps {
  auctionId: number;
  isOpen: boolean;
  onClose: () => void;
}

const AuctionDetailsModal: React.FC<AuctionDetailsModalProps> = ({
  auctionId,
  isOpen,
  onClose,
}) => {
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
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);
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
  const fetchAuctionDetails = async () => {
    if (!auctionId) {
      setError("Auction ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/auction-details.php?id=${auctionId}`
      );
      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch auction details");
      }

      // Transform API data to match component interface
      // Use exact same image URL normalization as admin ListingsControlTab
      const auctionData: AuctionItem = {
        ...result.data,
        primary_image: result.data.primary_image
          ? result.data.primary_image.startsWith("http") ||
            result.data.primary_image.startsWith("/")
            ? result.data.primary_image
            : `http://localhost:8000/${result.data.primary_image}`
          : undefined,
        images: Array.isArray(result.data.images)
          ? result.data.images.map((img: any) => {
              const imgUrl =
                typeof img === "string"
                  ? img
                  : img?.image_url || img?.file_path || img?.url || "";
              return imgUrl.startsWith("http") || imgUrl.startsWith("/")
                ? imgUrl
                : `http://localhost:8000/${imgUrl}`;
            })
          : [],
        seller: {
          name: result.data.seller_name,
          verified: true,
          rating: 4.8,
          totalSales: 50,
          avatar: undefined,
        },
        isWatched: false,
      };

      setAuction(auctionData);
      setCurrentImageIndex(0); // Reset to first image when loading new auction

      // If the user is authenticated, check if this auction is on their watchlist
      try {
        if (user && user.id) {
          const wl = await apiService.getWatchlist(user?.id);
          if (wl.success && Array.isArray(wl.data)) {
            const found = (wl.data as any[]).some(
              (w) => Number(w.auction_id) === Number(auctionId)
            );
            setAuction((prev) => (prev ? { ...prev, isWatched: found } : prev));
          }
        }
      } catch (err) {
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

  useEffect(() => {
    if (isOpen && auctionId) {
      fetchAuctionDetails();
    }
  }, [isOpen, auctionId]);

  // Countdown timer effect
  useEffect(() => {
    if (!auction) return;

    const compute = () => {
      const now = new Date();
      const start = new Date(auction.start_time);
      const end = new Date(auction.end_time);

      if (now < start) {
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

    const currentBid =
      typeof auction.current_bid === "number"
        ? auction.current_bid
        : auction.starting_price;
    const minBid = currentBid + (auction.bid_increment || 1000);

    if (bidValue < minBid) {
      setBidError(`Bid must be at least KES ${minBid.toLocaleString()}`);
      return;
    }

    if (!["live", "approved", "active"].includes(auction.status)) {
      setBidError("This auction is not currently accepting bids");
      return;
    }

    if (auction.auction_ended) {
      setBidError("This auction has already ended");
      return;
    }

    setIsPlacingBid(true);

    try {
      const res = await apiService.placeBid(auction.id, bidValue);
      if (!res || !res.success) {
        const msg =
          (res && (res.message || res.error)) || "Failed to place bid";
        setBidError(msg as string);
        setIsPlacingBid(false);
        return;
      }

      await fetchAuctionDetails();
      setShowPlaceBidModal(false);
      setBidAmount("");
      setShowBidSuccess(true);
      notifyWinning(auction.id, auction.title);

      setTimeout(() => setShowBidSuccess(false), 3000);
    } catch (err: any) {
      console.error("Place bid error:", err);
      setBidError(err?.message || "Failed to place bid. Please try again.");
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleToggleWatch = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!auction) return;

    const previous = auction.isWatched;
    setAuction((prev) =>
      prev ? { ...prev, isWatched: !prev.isWatched } : prev
    );

    try {
      if (!previous) {
        const res = await apiService.addToWatchlist(auction.id, user?.id);
        if (!res.success) {
          throw new Error(
            res.message || res.error || "Failed to add to watchlist"
          );
        }
      } else {
        const res = await apiService.removeFromWatchlist(auction.id, user?.id);
        if (!res.success) {
          throw new Error(
            res.message || res.error || "Failed to remove from watchlist"
          );
        }
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      setAuction((prev) => (prev ? { ...prev, isWatched: previous } : prev));
    }
  };

  const canBid =
    user &&
    (user.role === "buyer" || user.role === "seller") &&
    auction &&
    ["live", "approved", "active"].includes(auction.status);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto border border-gray-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? "Loading..." : auction?.title || "Auction Details"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
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

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Loading Auction Details
                </h3>
                <p className="text-muted-foreground">
                  Please wait while we fetch the auction information...
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Error Loading Auction
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            )}

            {!loading && !error && auction && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Images and Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Image Carousel */}
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        {(auction.images && auction.images.length > 0) ||
                        auction.primary_image ? (
                          <img
                            src={
                              auction.images && auction.images.length > 0
                                ? auction.images[currentImageIndex]?.startsWith(
                                    "http"
                                  ) ||
                                  auction.images[currentImageIndex]?.startsWith(
                                    "/"
                                  )
                                  ? auction.images[currentImageIndex]
                                  : `http://localhost:8000/${auction.images[currentImageIndex]}`
                                : auction.primary_image?.startsWith("http") ||
                                  auction.primary_image?.startsWith("/")
                                ? auction.primary_image
                                : `http://localhost:8000/${auction.primary_image}`
                            }
                            alt={auction.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
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
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        {/* Navigation Arrows - only show if there are multiple images */}
                        {auction.images && auction.images.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-card/90 hover:bg-card"
                              onClick={handlePrevImage}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-card/90 hover:bg-card"
                              onClick={handleNextImage}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {/* Image Counter - only show if there are multiple images */}
                        {auction.images && auction.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                            {currentImageIndex + 1} / {auction.images.length}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-card/90 hover:bg-card"
                            onClick={handleToggleWatch}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                auction.isWatched
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-card/90 hover:bg-card"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Thumbnail Strip - only show if there are multiple images */}
                      {auction.images && auction.images.length > 1 && (
                        <div className="p-4">
                          <div className="flex space-x-2 overflow-x-auto">
                            {auction.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="w-16 h-16 rounded border-2 overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer"
                                onClick={() => setCurrentImageIndex(idx)}
                              >
                                <img
                                  src={
                                    img.startsWith("http") ||
                                    img.startsWith("/")
                                      ? img
                                      : `http://localhost:8000/${img}`
                                  }
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (auction.category_name === "Cars") {
                                      target.src =
                                        "/src/assets/category-cars.jpg";
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Item Details */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold text-muted-foreground mb-2">
                            {auction.title}
                          </CardTitle>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">
                              {auction.category_name}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center space-x-1"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>
                                {(auction as any).location ||
                                  "Location not specified"}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-muted-foreground mb-2">
                          Description
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {auction.description}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Category
                          </Label>
                          <p className="text-muted-foreground">
                            {auction.category_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Status
                          </Label>
                          <p className="text-gray-900">
                            {auction.status.charAt(0).toUpperCase() +
                              auction.status.slice(1)}
                          </p>
                        </div>
                      </div>

                      {/* Vehicle/Electronics specific info */}
                      {auction.item_type === "vehicle" && (
                        <div>
                          <Separator />
                          <h4 className="font-semibold text-muted-foreground">
                            Vehicle Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Type
                              </Label>
                              <p className="text-muted-foreground">
                                {auction.vehicle_type}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Make / Model
                              </Label>
                              <p className="text-muted-foreground">
                                {(auction.make ? auction.make : "") +
                                  (auction.model ? " " + auction.model : "")}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Year
                              </Label>
                              <p className="text-muted-foreground">
                                {auction.year ?? "—"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Condition
                              </Label>
                              <p className="text-muted-foreground">
                                {auction.vehicle_condition ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {auction.item_type === "electronics" && (
                        <div>
                          <Separator />
                          <h4 className="font-semibold text-muted-foreground">
                            Electronics
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Brand
                              </Label>
                              <p className="text-muted-foreground">
                                {auction.brand ?? "—"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Model
                              </Label>
                              <p className="text-gray-900">
                                {auction.model ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                          <Label className="text-sm text-muted-foreground">
                            Starting Price
                          </Label>
                          <p className="text-lg font-semibold">
                            KES {auction.starting_price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Min. Increment
                          </Label>
                          <p className="text-lg font-semibold">
                            KES {auction.bid_increment.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Current Highest Bid
                        </Label>
                        <p className="text-3xl font-bold text-green-600">
                          KES {auction.current_bid.toLocaleString()}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm text-muted-foreground">
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
                            {String(countdown.minutes).padStart(2, "0")} (Starts
                            in)
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
                            <p className="text-sm text-red-600 mt-1">
                              {bidError}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={handlePlaceBid}
                          disabled={
                            isPlacingBid ||
                            !bidAmount ||
                            !["live", "approved", "active"].includes(
                              auction.status
                            )
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
                          * By placing a bid, you agree to purchase this item if
                          you win
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
                        <p className="text-muted-foreground mb-4">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionDetailsModal;
