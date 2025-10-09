import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";
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
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

interface CarAuction {
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

const CarsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allCars, setAllCars] = useState<CarAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch car auctions from API
  const fetchCarAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAuctions({
        category: "cars",
        status: "live",
        limit: 50,
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        const carsWithTimeLeft = response.data.map((auction: any) => ({
          ...auction,
          timeLeft: calculateTimeLeft(auction.end_time),
          isWatched: false, // Will be updated after watchlist check
        }));
        setAllCars(carsWithTimeLeft);

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
              setAllCars((prev) =>
                prev.map((car) => ({
                  ...car,
                  isWatched: watchedIds.includes(car.id),
                }))
              );
            }
          } catch (watchError) {
            console.warn("Failed to load watchlist:", watchError);
          }
        }
      } else {
        setError(response.error || "Failed to fetch car auctions");
      }
    } catch (err) {
      console.error("Error fetching car auctions:", err);
      setError("Failed to load car auctions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load auctions on component mount
  useEffect(() => {
    fetchCarAuctions();
  }, []);

  // Update watchlist status when user changes
  useEffect(() => {
    if (user && user.id && allCars.length > 0) {
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
            setAllCars((prev) =>
              prev.map((car) => ({
                ...car,
                isWatched: watchedIds.includes(car.id),
              }))
            );
          }
        } catch (err) {
          console.warn("Failed to update watchlist status:", err);
        }
      };
      updateWatchlistStatus();
    }
  }, [user?.id, allCars.length]);

  // Filter cars based on search criteria
  const filteredCars = allCars.filter((car) => {
    const matchesSearch =
      car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.category_name &&
        car.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.seller_name &&
        car.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.make && car.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      category === "all" ||
      (car.category_name &&
        car.category_name.toLowerCase() === category.toLowerCase());
    const matchesBrand =
      brand === "all" ||
      (car.make && car.make.toLowerCase() === brand.toLowerCase());
    const matchesTransmission = transmission === "all"; // Remove transmission filter for now since it's not in our data

    return (
      matchesSearch && matchesCategory && matchesBrand && matchesTransmission
    );
  });

  // Handler functions
  const handleToggleWatch = async (carId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const prev = allCars.map((c) => ({ ...c })); // shallow clone for rollback
    // Optimistic UI: flip watched state locally
    setAllCars((prevList) =>
      prevList.map((car) =>
        car.id === carId ? { ...car, isWatched: !car.isWatched } : car
      )
    );

    try {
      const res = await apiService.toggleWatch(carId, user?.id);
      if (!res.success) throw new Error(res.message || "Toggle failed");

      // If server returned explicit watched state, apply it to local state
      const watched = (res.data as any)?.watched;
      if (typeof watched === "boolean") {
        setAllCars((list) =>
          list.map((car) =>
            car.id === carId ? { ...car, isWatched: watched } : car
          )
        );
      }
      // apiService will dispatch watchlist:changed event for other components
    } catch (err) {
      console.error("Failed to toggle watch:", err);
      // rollback
      setAllCars(prev);
    }
  };

  const handlePlaceBid = (carId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/auction/${carId}`);
  };

  const handleViewDetails = (carId: number) => {
    navigate(`/auction/${carId}`);
  };

  return (
    <>
      {user ? <UserHeader /> : <Header />}
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                🚗 Car Auctions
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Find your perfect vehicle from sedans, SUVs, and pickup trucks
              </p>

              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search by make, model, year..."
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
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-muted-foreground">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="toyota">Toyota</SelectItem>
                      <SelectItem value="mazda">Mazda</SelectItem>
                      <SelectItem value="honda">Honda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{allCars.length}</div>
                  <div className="text-white/80">Cars</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {filteredCars.length}
                  </div>
                  <div className="text-white/80">Matching</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {allCars.filter((c) => c.featured).length}
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
                  <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Loading car auctions...
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
                      Error Loading Cars
                    </h3>
                    <p className="text-red-700 mt-1">{error}</p>
                    <Button
                      onClick={fetchCarAuctions}
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

        {/* Main Cars Section */}
        {!loading && !error && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-muted-foreground mb-2">
                    {searchTerm || category !== "all" || brand !== "all"
                      ? "Search Results"
                      : "All Cars"}
                  </h2>
                  <p className="text-muted-foreground">
                    Showing {filteredCars.length} of {allCars.length} cars
                    {user && (
                      <span className="ml-2">
                        • {filteredCars.filter((c) => c.isWatched).length}{" "}
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

              {/* Cars Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                    : "grid-cols-1"
                }`}
              >
                {filteredCars.map((car) => (
                  <Card
                    key={car.id}
                    className="group hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                      <img
                        src={car.images[0] || "/placeholder.svg"}
                        alt={car.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {car.featured && (
                        <Badge className="absolute top-3 right-3 bg-accent text-white">
                          Featured
                        </Badge>
                      )}
                      {user && (
                        <button
                          onClick={() => handleToggleWatch(car.id)}
                          className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                            car.isWatched
                              ? "bg-accent text-white"
                              : "bg-card/90 text-muted-foreground hover:text-accent hover:bg-card"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              car.isWatched ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {car.category_name}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span
                            className={
                              car.timeLeft.includes("h") &&
                              !car.timeLeft.includes("d")
                                ? "text-accent font-medium"
                                : ""
                            }
                          >
                            {car.timeLeft}
                          </span>
                        </div>
                      </div>
                      <h3
                        className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(car.id)}
                      >
                        {car.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        by {car.seller_name}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {car.make} {car.model} {car.year ? `• ${car.year}` : ""}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current</span>
                          <span className="font-semibold text-green-600">
                            Ksh {car.current_bid.toLocaleString()}
                          </span>
                        </div>
                        {car.reserve_price && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Reserve price</span>
                            <span className="text-gray-900">
                              Ksh {car.reserve_price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span></span>
                        <span
                          className={
                            car.timeLeft.includes("h") &&
                            !car.timeLeft.includes("d")
                              ? "text-accent font-medium"
                              : ""
                          }
                        >
                          Ending{" "}
                          {car.timeLeft.includes("h") &&
                          !car.timeLeft.includes("d")
                            ? "soon"
                            : "in " + car.timeLeft}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          className="flex-1"
                          onClick={() => handlePlaceBid(car.id)}
                        >
                          {user ? "Place Bid" : "Login to Bid"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(car.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredCars.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No cars found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or check back later for
                    new cars
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategory("all");
                      setBrand("all");
                      setTransmission("all");
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
    </>
  );
};

export default CarsPage;
