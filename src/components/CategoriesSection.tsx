import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Car,
  Bike,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Loader2,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Swiper as SwiperType } from "swiper";
import { apiService } from "@/services/api";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import custom styles
import "./CategoriesSection.css";

interface Auction {
  id: number;
  title: string;
  current_bid: number;
  reserve_price?: number;
  end_time: string;
  images: string[];
  seller_name: string;
  location?: string;
  bid_count: number;
  category_name: string;
  make?: string;
  model?: string;
  year?: number;
  electronics_brand?: string;
  electronics_model?: string;
  timeLeft?: string;
}

interface CategorySection {
  id: string;
  title: string;
  description: string;
  icon: any;
  apiCategory: string;
  route: string;
  bgGradient: string;
  iconColor: string;
}

const categoryConfigs: CategorySection[] = [
  {
    id: "cars",
    title: "Cars & Vehicles",
    description:
      "Sedans, SUVs, pickup trucks and commercial vehicles at competitive prices",
    icon: Car,
    apiCategory: "cars",
    route: "/cars",
    bgGradient: "from-blue-500 to-purple-600",
    iconColor: "text-blue-600",
  },
  {
    id: "motorbikes",
    title: "Motorbikes & Scooters",
    description:
      "Quality motorcycles, boda bodas, and scooters from verified lenders",
    icon: Bike,
    apiCategory: "motorcycles",
    route: "/motorbikes",
    bgGradient: "from-orange-500 to-red-600",
    iconColor: "text-orange-600",
  },
  {
    id: "electronics",
    title: "Electronics",
    description:
      "Laptops, smartphones, appliances and gadgets from repossession companies",
    icon: Smartphone,
    apiCategory: "electronics",
    route: "/electronics",
    bgGradient: "from-green-500 to-teal-600",
    iconColor: "text-green-600",
  },
];

const CategorySection = ({
  category,
  auctions,
  loading,
}: {
  category: CategorySection;
  auctions: Auction[];
  loading: boolean;
}) => {
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperType>();

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

  return (
    <div className="py-16 bg-background relative overflow-hidden">
      {/* Subtle Navy Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, hsl(218, 85%, 60%) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="p-4 bg-primary/20 backdrop-blur-sm rounded-2xl border border-primary/30">
              <category.icon className={`w-8 h-8 ${category.iconColor}`} />
            </div>
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {category.title}
              </h2>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            {category.description}
          </p>

          {/* Navigation & Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => swiperRef.current?.slidePrev()}
                className="bg-primary/20 border-primary/30 text-foreground hover:bg-primary/30 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => swiperRef.current?.slideNext()}
                className="bg-primary/20 border-primary/30 text-foreground hover:bg-primary/30 backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-6 text-foreground">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {loading ? "..." : auctions.length}
                </div>
                <div className="text-sm">Available</div>
              </div>
              <Button
                onClick={() => navigate(category.route)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Auctions Carousel */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Loading {category.title.toLowerCase()}...
              </p>
            </div>
          </div>
        ) : auctions.length > 0 ? (
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 },
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            modules={[Navigation, Autoplay]}
            className="pb-4"
          >
            {auctions.map((auction) => (
              <SwiperSlide key={auction.id}>
                <Card
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-card/95 backdrop-blur-sm border border-border overflow-hidden"
                  onClick={() => navigate(`/auction/${auction.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={auction.images[0] || "/placeholder.svg"}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/70 text-white border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {calculateTimeLeft(auction.end_time)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-card-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {auction.title}
                    </h3>

                    {/* Vehicle/Electronics Details */}
                    {(auction.make || auction.electronics_brand) && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {auction.make} {auction.model} {auction.year || ""}
                        {auction.electronics_brand}{" "}
                        {auction.electronics_model || ""}
                      </p>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-muted-foreground">
                        Current Bid
                      </span>
                      <span className="font-bold text-accent">
                        Ksh {auction.current_bid.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{auction.bid_count} bids</span>
                      </div>
                      <span>
                        {auction.location || "Location not specified"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="text-center py-20">
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-border/40">
              <category.icon
                className={`w-16 h-16 ${category.iconColor} mx-auto mb-4 opacity-60`}
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Auctions Available
              </h3>
              <p className="text-muted-foreground mb-4">
                Check back later for new {category.title.toLowerCase()}{" "}
                auctions.
              </p>
              <Button
                onClick={() => navigate(category.route)}
                variant="outline"
                className="bg-primary/20 border-primary/30 text-foreground hover:bg-primary/30"
              >
                Explore Category
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoriesSection = () => {
  const [carsAuctions, setCarsAuctions] = useState<Auction[]>([]);
  const [motorbikesAuctions, setMotorbikesAuctions] = useState<Auction[]>([]);
  const [electronicsAuctions, setElectronicsAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState({
    cars: true,
    motorbikes: true,
    electronics: true,
  });

  // Fetch auctions for each category
  useEffect(() => {
    const fetchCategoryAuctions = async (
      category: string,
      setter: any,
      loadingKey: string
    ) => {
      try {
        const response = await apiService.getAuctions({
          category,
          status: "live",
          limit: 8,
        });

        if (response.success && response.data && Array.isArray(response.data)) {
          setter(response.data);
        }
      } catch (error) {
        console.error(`Error fetching ${category} auctions:`, error);
      } finally {
        setLoading((prev) => ({ ...prev, [loadingKey]: false }));
      }
    };

    // Fetch all categories
    fetchCategoryAuctions("cars", setCarsAuctions, "cars");
    fetchCategoryAuctions("motorcycles", setMotorbikesAuctions, "motorbikes");
    fetchCategoryAuctions("electronics", setElectronicsAuctions, "electronics");
  }, []);

  return (
    <section className="bg-background">
      {/* Cars Section (Top) */}
      <CategorySection
        category={categoryConfigs[0]}
        auctions={carsAuctions}
        loading={loading.cars}
      />

      {/* Motorbikes Section (Middle) */}
      <CategorySection
        category={categoryConfigs[1]}
        auctions={motorbikesAuctions}
        loading={loading.motorbikes}
      />

      {/* Electronics Section (Bottom) */}
      <CategorySection
        category={categoryConfigs[2]}
        auctions={electronicsAuctions}
        loading={loading.electronics}
      />
    </section>
  );
};

export default CategoriesSection;
