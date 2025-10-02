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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

interface MotorbikeAuction {
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
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  vehicle_condition?: string;
  isWatched?: boolean;
  timeLeft?: string; // Calculated field
}

export default function Motorbikes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [allBikes, setAllBikes] = useState<MotorbikeAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brands = ["Honda", "Yamaha", "TVS", "Bajaj"];

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

  // Fetch motorbike auctions from API
  const fetchMotorbikeAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAuctions({
        category: "motorcycles",
        status: "live",
        limit: 50,
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        const bikesWithTimeLeft = response.data.map((auction: any) => ({
          ...auction,
          timeLeft: calculateTimeLeft(auction.end_time),
          isWatched: false, // Will be updated after watchlist check
        }));
        setAllBikes(bikesWithTimeLeft);

        // Check watchlist status if user is logged in
        if (user && user.id) {
          try {
            const watchlistResponse = await apiService.getWatchlist(user.id);
            if (
              watchlistResponse.success &&
              Array.isArray(watchlistResponse.data)
            ) {
              const watchedIds = watchlistResponse.data.map((item: any) =>
                Number(item.auction_id)
              );
              setAllBikes((prev) =>
                prev.map((bike) => ({
                  ...bike,
                  isWatched: watchedIds.includes(bike.id),
                }))
              );
            }
          } catch (watchError) {
            console.warn("Failed to load watchlist:", watchError);
          }
        }
      } else {
        setError(response.error || "Failed to fetch motorbike auctions");
      }
    } catch (err) {
      console.error("Error fetching motorbike auctions:", err);
      setError("Failed to load motorbike auctions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load auctions on component mount
  useEffect(() => {
    fetchMotorbikeAuctions();
  }, []);

  // Update watchlist status when user changes
  useEffect(() => {
    if (user && user.id && allBikes.length > 0) {
      const updateWatchlistStatus = async () => {
        try {
          const watchlistResponse = await apiService.getWatchlist(user.id);
          if (
            watchlistResponse.success &&
            Array.isArray(watchlistResponse.data)
          ) {
            const watchedIds = watchlistResponse.data.map((item: any) =>
              Number(item.auction_id)
            );
            setAllBikes((prev) =>
              prev.map((bike) => ({
                ...bike,
                isWatched: watchedIds.includes(bike.id),
              }))
            );
          }
        } catch (err) {
          console.warn("Failed to update watchlist status:", err);
        }
      };
      updateWatchlistStatus();
    }
  }, [user?.id, allBikes.length]);

  const handleToggleWatch = async (bikeId: number) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const bike = allBikes.find((b) => b.id === bikeId);
    if (!bike) return;

    // Optimistic update
    setAllBikes((prev) =>
      prev.map((b) => (b.id === bikeId ? { ...b, isWatched: !b.isWatched } : b))
    );

    try {
      if (bike.isWatched) {
        // Remove from watchlist
        await apiService.removeFromWatchlist(user.id, bikeId);
      } else {
        // Add to watchlist
        await apiService.addToWatchlist(user.id, bikeId);
      }
    } catch (err) {
      console.error("Watchlist toggle failed:", err);
      // Revert optimistic update
      setAllBikes((prev) =>
        prev.map((b) =>
          b.id === bikeId ? { ...b, isWatched: !b.isWatched } : b
        )
      );
    }
  };

  const filteredBikes = allBikes.filter((bike) => {
    const matchesSearch =
      bike.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bike.make && bike.make.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBrand =
      selectedBrand === "all" ||
      (bike.make && bike.make.toLowerCase() === selectedBrand.toLowerCase());
    return matchesSearch && matchesBrand;
  });

  return (
    <>
      {user ? <UserHeader /> : <Header />}
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary via-primary to-secondary text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Motorbikes
              </h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Find your next ride from sport bikes to reliable boda bodas
              </p>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search motorbikes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Loading motorbike auctions...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto">
              <Alert className="border-destructive bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <h3 className="text-red-800 font-semibold">
                    Error Loading Motorbikes
                  </h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <Button
                    onClick={fetchMotorbikeAuctions}
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
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">
                {filteredBikes.length} Motorbikes Available
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredBikes.map((bike) => (
                <Card
                  key={bike.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/auction/${bike.id}`)}
                >
                  <div className="relative">
                    <img
                      src={bike.images[0] || "/placeholder.svg"}
                      alt={bike.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {bike.featured && (
                      <Badge className="absolute top-2 left-2 bg-accent text-white">
                        Featured
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-full ${
                          bike.isWatched
                            ? "bg-accent text-white"
                            : "bg-card/90 text-muted-foreground hover:bg-card"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatch(bike.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            bike.isWatched ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        variant="secondary"
                        className="bg-black/70 text-white"
                      >
                        {bike.timeLeft}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {bike.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {bike.category_name}
                      </Badge>
                      {bike.vehicle_condition && (
                        <Badge variant="secondary" className="text-xs">
                          {bike.vehicle_condition}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {bike.make} {bike.model}{" "}
                      {bike.year ? `• ${bike.year}` : ""}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Current
                        </span>
                        <span className="font-semibold text-primary">
                          KSh {bike.current_bid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Bids
                        </span>
                        <span className="text-sm font-medium">
                          {bike.bid_count}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/auction/${bike.id}`);
                        }}
                      >
                        View Details
                      </Button>
                      {user && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle bid placement
                          }}
                        >
                          Place Bid
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBikes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No motorbikes found matching your criteria
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
