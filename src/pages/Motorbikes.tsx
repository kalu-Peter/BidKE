import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const mockBikes = [
  {
    id: 1,
    title: "Honda CBR 1000RR",
    category: "Sports Bikes",
    currentBid: 850000,
    reservePrice: 1200000,
    timeLeft: "1d 8h",
    bids: 15,
    seller: "Moto Elite",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80",
    featured: true,
    isWatched: false,
    brand: "Honda",
    year: "2020",
    condition: "Used"
  },
  {
    id: 2,
    title: "TVS HLX 125 2021",
    category: "Boda Boda",
    currentBid: 54000,
    reservePrice: 75000,
    timeLeft: "5h 20m",
    bids: 12,
    seller: "Bike World",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "TVS",
    year: "2021",
    condition: "Like New"
  },
  {
    id: 3,
    title: "Yamaha R15 V3",
    category: "Sports Bikes",
    currentBid: 85000,
    reservePrice: 110000,
    timeLeft: "4h 45m",
    bids: 18,
    seller: "Moto Elite",
    image: "https://images.unsplash.com/photo-1558618847-3f0c2cf36c38?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "Yamaha",
    year: "2020",
    condition: "Used"
  },
  {
    id: 4,
    title: "Bajaj Boxer 150cc 2022",
    category: "Boda Boda",
    currentBid: 68000,
    reservePrice: 85000,
    timeLeft: "2d 10h",
    bids: 9,
    seller: "City Bikes",
    image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: true,
    brand: "Bajaj",
    year: "2022",
    condition: "Excellent"
  }
];

export default function Motorbikes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const brands = ["Honda", "Yamaha", "TVS", "Bajaj"];

  const filteredBikes = mockBikes.filter((bike) => {
    return (
      bike.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedBrand === "all" || bike.brand === selectedBrand)
    );
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary via-primary to-secondary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Motorbikes</h1>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            {filteredBikes.length} Motorbikes Available
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBikes.map((bike) => (
            <Card key={bike.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => navigate(`/auction/${bike.id}`)}>
              <div className="relative">
                <img
                  src={bike.image}
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
                    className={`h-8 w-8 p-0 rounded-full ${bike.isWatched ? 'bg-accent text-white' : 'bg-white/90 text-muted-foreground hover:bg-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle watchlist toggle
                    }}
                  >
                    <Heart className={`h-4 w-4 ${bike.isWatched ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/70 text-white">
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
                    {bike.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {bike.condition}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Bid</span>
                    <span className="font-semibold text-primary">
                      KSh {bike.currentBid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bids</span>
                    <span className="text-sm font-medium">{bike.bids}</span>
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
            <p className="text-muted-foreground text-lg">No motorbikes found matching your criteria</p>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  );
}
