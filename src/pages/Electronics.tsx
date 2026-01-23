import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import AuctionDetailsModal from "@/components/modals/AuctionDetailsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

interface ElectronicsAuction {
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
  seller_name: string;
  featured: boolean;
  view_count: number;
  bid_count: number;
  images: string[];
  item_type: string;
  electronics_brand?: string;
  electronics_model?: string;
  electronics_condition?: string;
  isWatched?: boolean;
  timeLeft?: string; // Calculated field
}

const categories = [
  { label: "All", value: "" },
  { label: "Phones", value: "Phones" },
  { label: "TVs", value: "TVs" },
  { label: "Laptops", value: "Laptops" },
];
const brands = [
  { label: "All", value: "" },
  { label: "HP", value: "HP" },
  { label: "Apple", value: "Apple" },
  { label: "Samsung", value: "Samsung" },
];
const conditions = [
  { label: "All", value: "" },
  { label: "Used", value: "Used" },
  { label: "New Repo", value: "New Repo" },
];
const sortOptions = [
  { label: "Ending soon", value: "ending" },
  { label: "Highest bid", value: "highest" },
  { label: "Lowest price", value: "lowest" },
];

const ElectronicsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [condition, setCondition] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allElectronics, setAllElectronics] = useState<ElectronicsAuction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate time left for auction
  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const timeLeft = end - now;

    if (timeLeft <= 0) return "Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Fetch electronics auctions from API
  const fetchElectronicsAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAuctions({
        category: "electronics",
        status: "live",
        limit: 50,
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        const electronicsWithTimeLeft = response.data.map((auction: any) => ({
          ...auction,
          timeLeft: calculateTimeLeft(auction.end_time),
          isWatched: false, // Will be updated after watchlist check
        }));
        setAllElectronics(electronicsWithTimeLeft);

        // Check watchlist status if user is logged in
        if (user && user.id) {
          try {
            const watchlistResponse = await apiService.getWatchlist(user.id);
            if (
              watchlistResponse.success &&
              Array.isArray(watchlistResponse.data)
            ) {
              const watchedIds = watchlistResponse.data.map((item: any) =>
                Number(item.auction_id),
              );
              setAllElectronics((prev) =>
                prev.map((electronics) => ({
                  ...electronics,
                  isWatched: watchedIds.includes(electronics.id),
                })),
              );
            }
          } catch (watchError) {
            console.warn("Failed to load watchlist:", watchError);
          }
        }
      } else {
        setError(response.error || "Failed to fetch electronics auctions");
      }
    } catch (err) {
      console.error("Error fetching electronics auctions:", err);
      setError("Failed to load electronics auctions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load auctions on component mount
  useEffect(() => {
    fetchElectronicsAuctions();
  }, []);

  // Update watchlist status when user changes
  useEffect(() => {
    if (user && user.id && allElectronics.length > 0) {
      const updateWatchlistStatus = async () => {
        try {
          const watchlistResponse = await apiService.getWatchlist(user.id);
          if (
            watchlistResponse.success &&
            Array.isArray(watchlistResponse.data)
          ) {
            const watchedIds = watchlistResponse.data.map((item: any) =>
              Number(item.auction_id),
            );
            setAllElectronics((prev) =>
              prev.map((electronics) => ({
                ...electronics,
                isWatched: watchedIds.includes(electronics.id),
              })),
            );
          }
        } catch (err) {
          console.warn("Failed to update watchlist status:", err);
        }
      };
      updateWatchlistStatus();
    }
  }, [user?.id, allElectronics.length]);

  // Filter electronics based on search criteria
  const filteredElectronics = allElectronics.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.electronics_brand &&
        item.electronics_brand
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesCategory =
      category === "all" ||
      item.category_name.toLowerCase() === category.toLowerCase();
    const matchesBrand =
      brand === "all" ||
      (item.electronics_brand &&
        item.electronics_brand.toLowerCase() === brand.toLowerCase());
    const matchesCondition =
      condition === "all" ||
      (item.electronics_condition &&
        item.electronics_condition.toLowerCase() === condition.toLowerCase());

    return matchesSearch && matchesCategory && matchesBrand && matchesCondition;
  });

  // Handler functions
  const handleToggleWatch = async (itemId: number) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const item = allElectronics.find((e) => e.id === itemId);
    if (!item) return;

    // Optimistic update
    setAllElectronics((prev) =>
      prev.map((e) =>
        e.id === itemId ? { ...e, isWatched: !e.isWatched } : e,
      ),
    );

    try {
      if (item.isWatched) {
        // Remove from watchlist
        await apiService.removeFromWatchlist(user.id, itemId);
      } else {
        // Add to watchlist
        await apiService.addToWatchlist(user.id, itemId);
      }
    } catch (err) {
      console.error("Watchlist toggle failed:", err);
      // Revert optimistic update
      setAllElectronics((prev) =>
        prev.map((e) =>
          e.id === itemId ? { ...e, isWatched: !e.isWatched } : e,
        ),
      );
    }
  };

  const handlePlaceBid = (itemId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedAuctionId(itemId);
    setIsModalOpen(true);
  };

  const handleViewDetails = (itemId: number) => {
    setSelectedAuctionId(itemId);
    setIsModalOpen(true);
  };

  return (
    <>
      {user ? <UserHeader /> : <Header />}
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section
          className="bg-cover bg-center bg-no-repeat relative text-white py-24"
          style={{
            backgroundImage: "url(/uploads/electronics.jpg)",
          }}
        >
          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/40"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                📱 Electronics Auctions
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Discover amazing deals on phones, laptops, TVs and gadgets
              </p>

              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="Search electronics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-muted-foreground"
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-muted-foreground">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="phones">Phones</SelectItem>
                      <SelectItem value="laptops">Laptops</SelectItem>
                      <SelectItem value="tvs">TVs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-muted-foreground">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="samsung">Samsung</SelectItem>
                      <SelectItem value="hp">HP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">
                    {allElectronics.length}
                  </div>
                  <div className="text-white/80">Electronics</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {filteredElectronics.length}
                  </div>
                  <div className="text-white/80">Matching</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {allElectronics.filter((e) => e.featured).length}
                  </div>
                  <div className="text-white/80">Featured</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-white/80">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Loading electronics auctions...
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-md mx-auto">
                <Alert className="border-destructive bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div className="ml-2">
                    <h3 className="text-red-800 font-semibold">
                      Error Loading Electronics
                    </h3>
                    <p className="text-red-700 mt-1">{error}</p>
                    <Button
                      onClick={fetchElectronicsAuctions}
                      variant="outline"
                      size="sm"
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Try Again
                    </Button>
                  </div>
                </Alert>
              </div>
            </div>
          </section>
        )}

        {/* Main Electronics Section */}
        {!loading && !error && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-muted-foreground mb-2">
                    {searchTerm || category !== "all" || brand !== "all"
                      ? "Search Results"
                      : "All Electronics"}
                  </h2>
                  <p className="text-muted-foreground">
                    Showing {filteredElectronics.length} of{" "}
                    {allElectronics.length} electronics
                    {user && (
                      <span className="ml-2">
                        •{" "}
                        {filteredElectronics.filter((e) => e.isWatched).length}{" "}
                        Watched
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>

              {/* Electronics Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                    : "grid-cols-1"
                }`}
              >
                {filteredElectronics.map((item) => (
                  <Card
                    key={item.id}
                    className="group hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                      <img
                        src={item.images[0] || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.featured && (
                        <Badge className="absolute top-3 right-3 bg-accent text-white">
                          Featured
                        </Badge>
                      )}
                      {user && (
                        <button
                          onClick={() => handleToggleWatch(item.id)}
                          className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                            item.isWatched
                              ? "bg-accent text-white"
                              : "bg-card/90 text-muted-foreground hover:text-accent hover:bg-card"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              item.isWatched ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category_name}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span
                            className={
                              item.timeLeft &&
                              item.timeLeft.includes("h") &&
                              !item.timeLeft.includes("d")
                                ? "text-accent font-medium"
                                : ""
                            }
                          >
                            {item.timeLeft}
                          </span>
                        </div>
                      </div>
                      <h3
                        className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        by {item.seller_name}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {item.electronics_brand} {item.electronics_model}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current</span>
                          <span className="font-semibold text-green-600">
                            Ksh {item.current_bid.toLocaleString()}
                          </span>
                        </div>
                        {item.reserve_price && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Reserve price</span>
                            <span className="text-gray-900">
                              Ksh {item.reserve_price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span></span>
                        <span
                          className={
                            item.timeLeft &&
                            item.timeLeft.includes("h") &&
                            !item.timeLeft.includes("d")
                              ? "text-accent font-medium"
                              : ""
                          }
                        >
                          Ending{" "}
                          {item.timeLeft &&
                          item.timeLeft.includes("h") &&
                          !item.timeLeft.includes("d")
                            ? "soon"
                            : "in " + (item.timeLeft || "N/A")}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          className="flex-1"
                          onClick={() => handlePlaceBid(item.id)}
                        >
                          {user ? "Place Bid" : "Login to Bid"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredElectronics.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No electronics found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or check back later for
                    new electronics
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategory("all");
                      setBrand("all");
                      setCondition("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <Footer />

      {/* Auction Details Modal */}
      {selectedAuctionId && (
        <AuctionDetailsModal
          auctionId={selectedAuctionId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAuctionId(null);
          }}
        />
      )}
    </>
  );
};

export default ElectronicsPage;
