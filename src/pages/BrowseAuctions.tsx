import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Car, 
  Bike, 
  Smartphone, 
  Home, 
  ShirtIcon as Shirt, 
  Watch,
  Laptop,
  Camera,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Heart,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BrowseAuctions = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const categories = [
    {
      id: 'cars',
      title: 'Cars & Vehicles',
      icon: Car,
      count: 234,
      description: 'Sedans, SUVs, pickup trucks, and commercial vehicles',
      color: 'bg-blue-500',
      featured: true
    },
    {
      id: 'motorbikes',
      title: 'Motorbikes & Scooters',
      icon: Bike,
      count: 156,
      description: 'Motorcycles, scooters, and two-wheelers',
      color: 'bg-green-500',
      featured: true
    },
    {
      id: 'electronics',
      title: 'Electronics',
      icon: Smartphone,
      count: 423,
      description: 'Phones, laptops, TVs, and gadgets',
      color: 'bg-purple-500',
      featured: true
    },
    {
      id: 'real-estate',
      title: 'Real Estate',
      icon: Home,
      count: 89,
      description: 'Properties, land, and commercial spaces',
      color: 'bg-orange-500',
      featured: false
    },
    {
      id: 'fashion',
      title: 'Fashion & Accessories',
      icon: Shirt,
      count: 312,
      description: 'Clothing, shoes, bags, and accessories',
      color: 'bg-pink-500',
      featured: false
    },
    {
      id: 'watches',
      title: 'Watches & Jewelry',
      icon: Watch,
      count: 78,
      description: 'Luxury watches, jewelry, and accessories',
      color: 'bg-yellow-500',
      featured: false
    },
    {
      id: 'computers',
      title: 'Computers & IT',
      icon: Laptop,
      count: 167,
      description: 'Laptops, desktops, servers, and IT equipment',
      color: 'bg-indigo-500',
      featured: false
    },
    {
      id: 'cameras',
      title: 'Cameras & Photography',
      icon: Camera,
      count: 45,
      description: 'DSLR cameras, lenses, and photography equipment',
      color: 'bg-teal-500',
      featured: false
    }
  ];

  const [allAuctions, setAllAuctions] = useState([
    {
      id: 1,
      title: "Toyota Land Cruiser V8",
      category: "Cars",
      currentBid: 2800000,
      reservePrice: 3200000,
      timeLeft: "2d 14h",
      bids: 23,
      seller: "Auto Plaza Ltd",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=500&q=80",
      featured: true,
      isWatched: false
    },
    {
      id: 2,
      title: "Honda CBR 1000RR",
      category: "Motorbikes",
      currentBid: 850000,
      reservePrice: 1200000,
      timeLeft: "1d 8h",
      bids: 15,
      seller: "Moto Elite",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80",
      featured: true,
      isWatched: false
    },
    {
      id: 3,
      title: "iPhone 14 Pro Max",
      category: "Electronics",
      currentBid: 95000,
      reservePrice: 120000,
      timeLeft: "18h 45m",
      bids: 31,
      seller: "TechHub Kenya",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80",
      featured: true,
      isWatched: true
    },
    {
      id: 4,
      title: "MacBook Pro M2",
      category: "Electronics",
      currentBid: 185000,
      reservePrice: 250000,
      timeLeft: "3d 2h",
      bids: 18,
      seller: "Digital Solutions",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
      featured: true,
      isWatched: false
    },
    {
      id: 5,
      title: "Mazda Demio 2018",
      category: "Cars",
      currentBid: 800000,
      reservePrice: 950000,
      timeLeft: "2d 12h",
      bids: 15,
      seller: "Auto Dealers Ltd",
      image: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=400&q=80",
      featured: false,
      isWatched: false
    },
    {
      id: 6,
      title: "Samsung 55'' 4K TV",
      category: "Electronics",
      currentBid: 45000,
      reservePrice: 65000,
      timeLeft: "1h 30m",
      bids: 8,
      seller: "TechHub Kenya",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
      featured: false,
      isWatched: true
    },
    {
      id: 7,
      title: "TVS HLX 125 2021",
      category: "Motorbikes",
      currentBid: 54000,
      reservePrice: 75000,
      timeLeft: "5h 20m",
      bids: 12,
      seller: "Bike World",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80",
      featured: false,
      isWatched: false
    },
    {
      id: 8,
      title: "Honda Civic 2019",
      category: "Cars",
      currentBid: 1200000,
      reservePrice: 1450000,
      timeLeft: "1d 14h",
      bids: 28,
      seller: "Premium Motors",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
      featured: false,
      isWatched: false
    },
    {
      id: 9,
      title: "Yamaha R15 V3",
      category: "Motorbikes",
      currentBid: 85000,
      reservePrice: 110000,
      timeLeft: "4h 45m",
      bids: 18,
      seller: "Moto Elite",
      image: "https://images.unsplash.com/photo-1558618847-3f0c2cf36c38?auto=format&fit=crop&w=400&q=80",
      featured: false,
      isWatched: false
    }
  ]);

  // Filter auctions based on search criteria
  const filteredAuctions = allAuctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || auction.category.toLowerCase() === category.toLowerCase();
    const matchesPriceRange = priceRange === "all" || 
      (priceRange === "0-50000" && auction.currentBid < 50000) ||
      (priceRange === "50000-200000" && auction.currentBid >= 50000 && auction.currentBid < 200000) ||
      (priceRange === "200000-500000" && auction.currentBid >= 200000 && auction.currentBid < 500000) ||
      (priceRange === "500000+" && auction.currentBid >= 500000);
    
    return matchesSearch && matchesCategory && matchesPriceRange;
  });

  // Handler functions
  const handleToggleWatch = (auctionId: number) => {
    if (!user) return;
    setAllAuctions(prev => prev.map(auction => 
      auction.id === auctionId 
        ? { ...auction, isWatched: !auction.isWatched }
        : auction
    ));
  };

  const handlePlaceBid = (auctionId: number) => {
    if (!user) {
      // Redirect to login or show login modal
      console.log("Please login to place a bid");
      return;
    }
    // Navigate to auction detail page or show bid modal
    console.log(`Placing bid on auction ${auctionId}`);
  };

  const handleViewDetails = (auctionId: number) => {
    // Navigate to auction detail page
    console.log(`Viewing details for auction ${auctionId}`);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Browse Live Auctions
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Discover amazing deals from verified sellers across Kenya
              </p>
              
              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search for items..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-gray-900"
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-gray-900">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="cars">Cars</SelectItem>
                      <SelectItem value="motorbikes">Motorbikes</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-gray-900">
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

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{allAuctions.length}</div>
                  <div className="text-white/80">Live Auctions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{filteredAuctions.length}</div>
                  <div className="text-white/80">Matching Results</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">12,450</div>
                  <div className="text-white/80">Registered Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-white/80">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Auctions Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchTerm || category !== "all" || priceRange !== "all" ? "Search Results" : "All Auctions"}
                </h2>
                <p className="text-gray-600">
                  Showing {filteredAuctions.length} of {allAuctions.length} auctions
                  {user && (
                    <span className="ml-2">
                      • {filteredAuctions.filter(a => a.isWatched).length} Watched
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

            {/* Auction Grid */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {filteredAuctions.map((auction) => (
                <Card key={auction.id} className="group hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                    <img 
                      src={auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            ? 'bg-accent text-white' 
                            : 'bg-white/90 text-gray-400 hover:text-accent hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${auction.isWatched ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {auction.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className={auction.timeLeft.includes('h') && !auction.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                          {auction.timeLeft}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {auction.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">by {auction.seller}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current bid</span>
                        <span className="font-semibold text-green-600">Ksh {auction.currentBid.toLocaleString()}</span>
                      </div>
                      {auction.reservePrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reserve price</span>
                          <span className="text-gray-900">Ksh {auction.reservePrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{auction.bids} bids</span>
                      </div>
                      <span className={auction.timeLeft.includes('h') && !auction.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                        Ending {auction.timeLeft.includes('h') && !auction.timeLeft.includes('d') ? 'soon' : 'in ' + auction.timeLeft}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => handlePlaceBid(auction.id)}
                      >
                        {user ? 'Place Bid' : 'Login to Bid'}
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
              ))}
            </div>

            {/* Empty State */}
            {filteredAuctions.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No auctions found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or check back later for new auctions
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setCategory("all");
                  setPriceRange("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Bidding Tips */}
            <div className="mt-12 p-6 bg-primary/5 rounded-lg">
              <h4 className="font-medium text-primary mb-3">💡 Bidding Tips:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <ul className="space-y-2">
                  <li>• Set a maximum budget before bidding to avoid overspending</li>
                  <li>• Watch items to get notifications about price changes</li>
                </ul>
                <ul className="space-y-2">
                  <li>• Bid strategically - consider placing bids closer to auction end</li>
                  <li>• Check seller ratings and item descriptions carefully</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default BrowseAuctions;
