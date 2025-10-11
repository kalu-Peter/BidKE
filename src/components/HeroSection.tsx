import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowRight,
  Shield,
  Gavel,
  TrendingUp,
  Clock,
  MapPin,
  Star,
} from "lucide-react";
import { apiService, type Auction } from "@/services/api";
import Autoplay from "embla-carousel-autoplay";
import heroImage from "@/assets/hero-auction.jpg";

interface HeroSectionProps {
  onViewAuction: (auctionId: number) => void;
  onViewAllAuctions: () => void;
}

const HeroSection = ({
  onViewAuction,
  onViewAllAuctions,
}: HeroSectionProps) => {
  const [featuredAuctions, setFeaturedAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      try {
        const response = await apiService.getAuctions({
          limit: 6,
          status: "active",
        });

        if (response.success && response.data) {
          // Handle different API response formats
          const auctions = Array.isArray(response.data)
            ? response.data
            : response.data.auctions || [];

          // First try to get featured auctions
          let featured = auctions.filter(
            (auction) => auction.is_featured || auction.featured
          );

          // If no featured auctions exist, use the first 3 regular active auctions
          if (featured.length === 0) {
            featured = auctions.slice(0, 3);
          }

          setFeaturedAuctions(featured);
        }
      } catch (error) {
        console.error("Error fetching featured auctions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedAuctions();
  }, []);

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleViewAuction = (auctionId: number) => {
    onViewAuction(auctionId);
  };

  return (
    <section className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center min-h-screen">
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-2 px-4 py-2"
          >
            <Shield className="w-4 h-4" />
            Trusted Auction Platform
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
            Kenya's Premier
            <span className="text-accent block">Repossession Auction</span>
            Platform
          </h1>

          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            Connect verified businesses with serious buyers. Transparent
            bidding, secure transactions, and quality repossessed vehicles &
            electronics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button variant="accent" size="lg" className="group">
              Start Bidding
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="premium" size="lg">
              List Your Items
            </Button>
          </div>

          <div className="flex items-center gap-8 justify-center lg:justify-start text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-accent" />
              <span>Live Auctions</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span>Best Prices</span>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 mt-12 lg:mt-0">
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center h-96 bg-card/10 rounded-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : featuredAuctions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-primary-foreground">
                    {featuredAuctions.some(
                      (auction) => auction.is_featured || auction.featured
                    )
                      ? "Featured Auctions"
                      : "Live Auctions"}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-accent/20 text-accent border-accent/30"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Live Now
                  </Badge>
                </div>

                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 5000,
                    }),
                  ]}
                  className="w-full max-w-lg mx-auto"
                >
                  <CarouselContent>
                    {featuredAuctions.map((auction) => (
                      <CarouselItem key={auction.id}>
                        <div className="p-1">
                          <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-elegant overflow-hidden border border-border/20">
                            <div className="relative">
                              <img
                                src={
                                  auction.primary_image ||
                                  auction.image_url ||
                                  (auction.images && auction.images.length > 0
                                    ? typeof auction.images[0] === "string"
                                      ? auction.images[0]
                                      : auction.images[0]?.image_url
                                    : "/placeholder.svg") ||
                                  "/placeholder.svg"
                                }
                                alt={auction.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                              {(auction.is_featured || auction.featured) && (
                                <div className="absolute top-3 left-3">
                                  <Badge className="bg-accent text-accent-foreground">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                <Badge
                                  variant="secondary"
                                  className="bg-background/90 text-foreground"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeRemaining(auction.end_date)}
                                </Badge>
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-semibold text-lg text-foreground truncate">
                                  {auction.title}
                                </h4>
                                <p className="text-sm text-muted-foreground flex items-center mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {auction.category_name || "Unknown Category"}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Current Bid
                                  </span>
                                  <span className="font-bold text-accent text-lg">
                                    {formatPrice(
                                      auction.current_bid ||
                                        auction.starting_price
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{auction.bid_count} bids</span>
                                  <span>{auction.watcher_count} watching</span>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleViewAuction(auction.id)}
                                className="w-full"
                                size="sm"
                              >
                                View Auction
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10" />
                  <CarouselNext className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10" />
                </Carousel>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={onViewAllAuctions}
                    className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    View All Auctions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Professional auction platform showcase"
                  className="rounded-2xl shadow-elegant w-full h-auto max-w-lg mx-auto"
                />
                <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-xl shadow-card">
                  <div className="text-sm text-muted-foreground">
                    Active Auctions
                  </div>
                  <div className="text-2xl font-bold text-primary">247</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
