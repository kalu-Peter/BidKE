import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Heart } from "lucide-react";

const BrowseAuctionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");

  // Mock data for available auctions
  const auctions = [
    {
      id: 1,
      title: "Honda CR-V 2017",
      category: "Cars",
      currentBid: 1250000,
      bids: 8,
      timeLeft: "3h 45m",
      seller: "Premier Motors Ltd",
      image: "https://images.unsplash.com/photo-1493238792000-8113dad705c5?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 2,
      title: "iPhone 14 Pro Max",
      category: "Electronics",
      currentBid: 95000,
      bids: 12,
      timeLeft: "1d 2h",
      seller: "TechHub Kenya",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
      isWatched: true
    },
    {
      id: 3,
      title: "Kawasaki Ninja 300",
      category: "Motorbikes",
      currentBid: 180000,
      bids: 5,
      timeLeft: "2d 8h",
      seller: "Bike World",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 4,
      title: "MacBook Air M2",
      category: "Electronics",
      currentBid: 125000,
      bids: 15,
      timeLeft: "5h 20m",
      seller: "Digital Solutions",
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    },
    {
      id: 5,
      title: "Nissan X-Trail 2019",
      category: "Cars",
      currentBid: 1800000,
      bids: 22,
      timeLeft: "6h 15m",
      seller: "Auto Dealers Ltd",
      image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80",
      isWatched: true
    },
    {
      id: 6,
      title: "Yamaha MT-07",
      category: "Motorbikes",
      currentBid: 320000,
      bids: 7,
      timeLeft: "1d 12h",
      seller: "Moto Express",
      image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=400&q=80",
      isWatched: false
    }
  ];

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || auction.category.toLowerCase() === selectedCategory;
    const matchesPriceRange = selectedPriceRange === "all" || 
      (selectedPriceRange === "0-50000" && auction.currentBid < 50000) ||
      (selectedPriceRange === "50000-200000" && auction.currentBid >= 50000 && auction.currentBid < 200000) ||
      (selectedPriceRange === "200000-500000" && auction.currentBid >= 200000 && auction.currentBid < 500000) ||
      (selectedPriceRange === "500000+" && auction.currentBid >= 500000);
    
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
          <Eye className="w-5 h-5" />
          <span>Browse Available Auctions</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Explore auction items from other sellers. As a verified seller, you can also bid on items.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
          <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
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
            Showing {filteredAuctions.length} of {auctions.length} auctions
          </p>
          <Badge variant="outline">
            {filteredAuctions.filter(a => a.isWatched).length} Watched
          </Badge>
        </div>

        {/* Auction Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <Card key={auction.id} className="group hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                <img 
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <Badge className="absolute top-2 right-2 bg-green-500">
                  Active
                </Badge>
                <Button
                  size="sm"
                  variant={auction.isWatched ? "default" : "outline"}
                  className={`absolute top-2 left-2 ${
                    auction.isWatched 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-white/90 hover:bg-white"
                  }`}
                  onClick={() => handleToggleWatch(auction.id)}
                >
                  <Heart className={`w-4 h-4 ${
                    auction.isWatched ? "text-white fill-current" : "text-red-500"
                  }`} />
                </Button>
              </div>
              <CardContent className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-lg">{auction.title}</h3>
                  <p className="text-sm text-gray-500">by {auction.seller}</p>
                </div>
                <div className="mb-3">
                  <p className="text-lg font-bold text-green-600">
                    Ksh {auction.currentBid.toLocaleString()}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{auction.bids} bids</span>
                    <span>{auction.timeLeft} left</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePlaceBid(auction.id)}
                  >
                    Place Bid
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
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
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or check back later for new auctions
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSelectedPriceRange("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrowseAuctionsTab;
