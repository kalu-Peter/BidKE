import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Grid3X3,
  List,
  Eye,
  Heart,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useNotifications } from "@/components/notifications/BidNotification";

interface Auction {
  id: number;
  title: string;
  description: string;
  starting_price: number;
  current_bid: number;
  reserve_price?: number;
  start_time: string;
  end_time: string;
  status: string;
  category_name: string;
  category_slug: string;
  seller_name: string;
  seller_email: string;
  featured: boolean;
  view_count: number;
  bid_count: number;
  images: string[];
  item_type: string;
  make_brand?: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  item_condition: string;
  location?: string;
  isWatched?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Auction[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

const BrowseAuctionsContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuctions, setTotalAuctions] = useState(0);

  // Fetch auctions from API
  const fetchAuctions = async (
    page = 1,
    search = "",
    categoryFilter = "all",
    priceFilter = "all"
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        status: "live", // Only fetch live auctions
        search: search,
      });

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      if (priceFilter !== "all") {
        const [min, max] = priceFilter.split("-");
        if (min) params.append("min_price", min);
        if (max && max !== "+") params.append("max_price", max);
      }

      const response = await fetch(
        `http://localhost:8000/auctions.php?${params}`,
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

      const data: ApiResponse = await response.json();

      if (data.success) {
        const list = data.data || [];
        // Dev-time sanity check: warn if any auction ids are missing or duplicated
        try {
          const ids = list.map((a: any) => a.id);
          const missing = ids.filter(
            (id: any) => id === null || id === undefined
          );
          if (missing.length > 0) {
            console.warn(
              "fetchAuctions: some auctions are missing id fields",
              missing
            );
          }
          const dup = ids.filter(
            (id: any, idx: number) => ids.indexOf(id) !== idx
          );
          if (dup.length > 0) {
            console.warn("fetchAuctions: duplicate auction ids detected", dup);
          }
        } catch (e) {
          // ignore
        }

        setAuctions(list);
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.pages);
          setTotalAuctions(data.pagination.total);
        }
      } else {
        setError(data.message || "Failed to fetch auctions");
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError("Failed to load auctions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate time left for auction
  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const timeLeft = end - now;

    if (timeLeft <= 0) return "Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get auction image
  const getAuctionImage = (auction: Auction) => {
    // images may be an array of strings or objects, or the API may provide image_path/image_url
    const firstImage = (auction as any).images?.[0];
    if (firstImage) {
      // If API returned a plain string
      if (typeof firstImage === "string") {
        if (
          firstImage.startsWith("http://") ||
          firstImage.startsWith("https://")
        ) {
          return firstImage;
        }
        if (firstImage.startsWith("/"))
          return `http://localhost:8000${firstImage}`;
        return `http://localhost:8000/${firstImage}`;
      }

      // If API returned an object with various possible fields
      if (typeof firstImage === "object") {
        const path =
          firstImage.image_url || firstImage.file_path || firstImage.image_path;
        if (path) {
          if (path.startsWith("http://") || path.startsWith("https://"))
            return path;
          if (path.startsWith("/")) return `http://localhost:8000${path}`;
          return `http://localhost:8000/${path}`;
        }
        return "/placeholder.svg";
      }
    }
    // Fallbacks if backend returns single image fields
    const imgPath =
      (auction as any).image_path ||
      (auction as any).image_url ||
      (auction as any).file_path;
    if (imgPath) {
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://"))
        return imgPath;
      if (imgPath.startsWith("/")) return `http://localhost:8000${imgPath}`;
      return `http://localhost:8000/${imgPath}`;
    }
    // Default image based on category
    switch (auction.category_slug) {
      case "cars":
        return "/src/assets/category-cars.jpg";
      case "motorbikes":
        return "/src/assets/category-motorbikes.jpg";
      case "electronics":
        return "/src/assets/category-electronics.jpg";
      default:
        return "/placeholder.svg";
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Fetch when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchAuctions(1, searchTerm, category, priceRange);
      },
      searchTerm ? 500 : 0
    ); // Debounce search input

    return () => clearTimeout(timeoutId);
  }, [searchTerm, category, priceRange]);

  // Handler functions
  const { notifyWinning } = useNotifications();

  const handleToggleWatch = async (auctionId: number) => {
    if (!user) return;

    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction) return;

    // Optimistic update
    const prev = auctions.map((a) => ({ ...a }));
    setAuctions((prevList) =>
      prevList.map((a) =>
        a.id === auctionId ? { ...a, isWatched: !a.isWatched } : a
      )
    );

    try {
      const res = await apiService.toggleWatch(auctionId, user?.id);
      if (!res.success) {
        throw new Error(res.message || "Watch toggle failed");
      }

      // Apply server-provided watched flag when available
      const watched = (res.data as any)?.watched;
      if (typeof watched === "boolean") {
        setAuctions((list) =>
          list.map((a) =>
            a.id === auctionId ? { ...a, isWatched: watched } : a
          )
        );
      }

      // Optionally show a small notification (reuse notifyWinning for demo)
      if (watched) {
        notifyWinning(auctionId, auction.title);
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      // rollback
      setAuctions(prev);
    }
  };

  const handlePlaceBid = (auctionId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/auction/${auctionId}#place-bid`);
  };

  const handleViewDetails = (auctionId: number) => {
    navigate(`/auction/${auctionId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAuctions(page, searchTerm, category, priceRange);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Browse Live Auctions
          </h2>
          <p className="text-gray-600">
            Discover amazing deals from verified sellers
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
              disabled={loading}
            />
          </div>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={loading}
          >
            <SelectTrigger className="w-full lg:w-48 h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cars">Cars</SelectItem>
              <SelectItem value="motorbikes">Motorbikes</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priceRange}
            onValueChange={setPriceRange}
            disabled={loading}
          >
            <SelectTrigger className="w-full lg:w-48 h-12">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-50000">Below 50K</SelectItem>
              <SelectItem value="50000-200000">50K - 200K</SelectItem>
              <SelectItem value="200000-500000">200K - 500K</SelectItem>
              <SelectItem value="500000+">Above 500K</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
          <span className="text-gray-600">Loading auctions...</span>
        </div>
      )}

      {/* Results Header */}
      {!loading && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {searchTerm || category !== "all" || priceRange !== "all"
                ? "Search Results"
                : "All Auctions"}
            </h3>
            <p className="text-gray-600 text-sm">
              Showing {auctions.length} of {totalAuctions} auctions
              {user && (
                <span className="ml-2">
                  • {auctions.filter((a) => a.isWatched).length} Watched
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              disabled={loading}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              disabled={loading}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Auction Grid */}
      {!loading && (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {auctions.map((auction) => {
            const timeLeft = calculateTimeLeft(auction.end_time);
            const isEndingSoon =
              timeLeft.includes("h") &&
              !timeLeft.includes("d") &&
              timeLeft !== "Ended";

            return (
              <Card
                key={auction.id ?? Math.random()}
                data-auction-id={auction.id}
                data-auction-title={auction.title}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                  <img
                    src={getAuctionImage(auction)}
                    alt={auction.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  {auction.featured && (
                    <Badge className="absolute top-3 right-3 bg-accent text-white">
                      Featured
                    </Badge>
                  )}
                  {user && (
                    <button
                      onClick={() => handleToggleWatch(auction.id)}
                      className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                        auction.isWatched
                          ? "bg-accent text-white"
                          : "bg-white/90 text-gray-400 hover:text-accent hover:bg-white"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          auction.isWatched ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {auction.category_name}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span
                        className={
                          isEndingSoon ? "text-accent font-medium" : ""
                        }
                      >
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                    onClick={() => handleViewDetails(auction.id)}
                  >
                    {auction.title}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {/* Show vehicle make/model/year if available */}
                    {auction.item_type === "vehicle" &&
                      (auction.make || auction.model || auction.year) && (
                        <div className="text-sm text-gray-600">
                          {auction.make ? `${auction.make}` : ""}
                          {auction.model ? ` ${auction.model}` : ""}
                          {auction.year ? ` • ${auction.year}` : ""}
                        </div>
                      )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current</span>
                      <span className="font-semibold text-green-600">
                        Ksh{" "}
                        {Number(
                          auction.current_bid ??
                            (auction as any).current_price ??
                            0
                        ).toLocaleString()}
                      </span>
                    </div>
                    {auction.reserve_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reserve price</span>
                        <span className="text-gray-900">
                          Ksh {auction.reserve_price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{auction.bid_count} bids</span>
                    </div>
                    <span
                      className={isEndingSoon ? "text-accent font-medium" : ""}
                    >
                      {timeLeft === "Ended"
                        ? "Auction ended"
                        : isEndingSoon
                        ? "Ending soon"
                        : `Ending in ${timeLeft}`}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => handlePlaceBid(auction.id)}
                      disabled={timeLeft === "Ended"}
                    >
                      {timeLeft === "Ended"
                        ? "Auction Ended"
                        : user
                        ? "Place Bid"
                        : "Login to Bid"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(auction.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && auctions.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No auctions found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or check back later for new
            auctions
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setCategory("all");
              setPriceRange("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Bidding Tips */}
      <div className="mt-8 p-6 bg-primary/5 rounded-lg">
        <h4 className="font-medium text-primary mb-3">💡 Bidding Tips:</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <ul className="space-y-2">
            <li>• Set a maximum budget before bidding to avoid overspending</li>
            <li>• Watch items to get notifications about price changes</li>
          </ul>
          <ul className="space-y-2">
            <li>
              • Bid strategically - consider placing bids closer to auction end
            </li>
            <li>• Check seller ratings and item descriptions carefully</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BrowseAuctionsContent;
