import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Gavel, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-auction.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center min-h-screen">
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2">
            <Shield className="w-4 h-4" />
            Trusted Auction Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
            Kenya's Premier
            <span className="text-accent block">
              Repossession Auction
            </span>
            Platform
          </h1>
          
          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            Connect verified businesses with serious buyers. Transparent bidding, 
            secure transactions, and quality repossessed vehicles & electronics.
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
            <img 
              src={heroImage} 
              alt="Professional auction platform showcase"
              className="rounded-2xl shadow-elegant w-full h-auto max-w-lg mx-auto"
            />
            <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-xl shadow-card">
              <div className="text-sm text-muted-foreground">Active Auctions</div>
              <div className="text-2xl font-bold text-primary">247</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;