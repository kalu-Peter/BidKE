import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, Clock, Eye } from "lucide-react";

const BrowseAuctionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // Mock data for featured auctions
  const featuredAuctions = [
    {
      id: 4,
      title: "Mazda Demio 2018",
      currentBid: 800000,
      timeLeft: "2d 12h",
      category: "Cars",
      bids: 15,
      seller: "Auto Dealers Ltd",
      image: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 5,
      title: "Samsung 55'' 4K TV",
      currentBid: 45000,
      timeLeft: "1h 30m",
      category: "Electronics", 
      bids: 8,
      seller: "TechHub Kenya",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
      isWatched: true
    },
    {
      id: 6,
      title: "TVS HLX 125 2021",
      currentBid: 54000,
      timeLeft: "5h 20m",
      category: "Motorbikes",
      bids: 12,
      seller: "Bike World",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 7,
      title: "MacBook Pro 2020",
      currentBid: 95000,
      timeLeft: "3d 8h",
      category: "Electronics",
      bids: 22,
      seller: "Digital Solutions",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
      isWatched: true
    },
    {
      id: 8,
      title: "Honda Civic 2019",
      currentBid: 1200000,
      timeLeft: "1d 14h",
      category: "Cars",
      bids: 28,
      seller: "Premium Motors",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 9,
      title: "Yamaha R15 V3",
      currentBid: 85000,
      timeLeft: "4h 45m",
      category: "Motorbikes",
      bids: 18,
      seller: "Moto Elite",
      image: "https://images.unsplash.com/photo-1558618847-3f0c2cf36c38?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    }
  ];

  const filteredAuctions = featuredAuctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || auction.category.toLowerCase() === category;
    const matchesPriceRange = priceRange === "all" || 
      (priceRange === "0-50000" && auction.currentBid < 50000) ||
      (priceRange === "50000-200000" && auction.currentBid >= 50000 && auction.currentBid < 200000) ||
      (priceRange === "200000-500000" && auction.currentBid >= 200000 && auction.currentBid < 500000) ||
      (priceRange === "500000+" && auction.currentBid >= 500000);
    
    return matchesSearch && matchesCategory && matchesPriceRange;
  });

  const handlePlaceBid = (auctionId: number) => {
    console.log("Place bid on auction:", auctionId);
    // Handle bid placement logic
  };

  const handleToggleWatch = (auctionId: number) => {
    console.log("Toggle watch for auction:", auctionId);
    // Handle watchlist toggle logic
  };

  const handleViewDetails = (auctionId: number) => {
    console.log("View details for auction:", auctionId);
    // Handle view details logic
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Browse Auctions</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Discover and bid on items from verified sellers across Kenya
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cars">Cars</SelectItem>
              <SelectItem value="motorbikes">Motorbikes</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Price Range" />
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

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredAuctions.length} of {featuredAuctions.length} auctions
          </p>
          <Badge variant="outline">
            {filteredAuctions.filter(a => a.isWatched).length} Watched
          </Badge>
        </div>

        {/* Auction Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <div key={auction.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative">
                <img 
                  src={auction.image} 
                  alt={auction.title} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <button 
                  onClick={() => handleToggleWatch(auction.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                    auction.isWatched 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${auction.isWatched ? 'fill-current' : ''}`} />
                </button>
                <Badge className="absolute bottom-3 left-3 bg-white text-gray-800">
                  {auction.category}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{auction.title}</h3>
                <p className="text-sm text-gray-500 mb-3">by {auction.seller}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-green-600">
                    Ksh {auction.currentBid.toLocaleString()}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {auction.timeLeft}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>{auction.bids} bids</span>
                  <span className={
                    auction.timeLeft.includes('h') && !auction.timeLeft.includes('d') 
                      ? 'text-red-600 font-medium' 
                      : ''
                  }>
                    Ending {auction.timeLeft.includes('h') && !auction.timeLeft.includes('d') ? 'soon' : 'in ' + auction.timeLeft}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handlePlaceBid(auction.id)}
                  >
                    Place Bid
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(auction.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
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

        {/* Browse Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Bidding Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Set a maximum budget before bidding to avoid overspending</li>
            <li>• Watch items to get notifications about price changes</li>
            <li>• Bid strategically - consider placing bids closer to auction end</li>
            <li>• Check seller ratings and item descriptions carefully</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrowseAuctionsTab;
