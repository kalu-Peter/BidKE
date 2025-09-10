import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Clock, Eye, X, Bell, Search } from "lucide-react";

const WatchlistTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for watchlist items
  const watchlistItems = [
    {
      id: 1,
      title: "MacBook Pro 2020",
      seller: "Digital Solutions",
      currentBid: 97000,
      timeLeft: "3d 8h",
      category: "Electronics",
      bidsCount: 22,
      addedDate: "2024-01-20",
      priceWhenAdded: 85000,
      priceChange: 12000,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
      notifications: true,
      endingSoon: false
    },
    {
      id: 2,
      title: "Samsung 55'' 4K TV",
      seller: "TechHub Kenya",
      currentBid: 47000,
      timeLeft: "1h 15m",
      category: "Electronics",
      bidsCount: 9,
      addedDate: "2024-01-22",
      priceWhenAdded: 40000,
      priceChange: 7000,
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
      notifications: true,
      endingSoon: true
    },
    {
      id: 3,
      title: "iPhone 13 Pro Max",
      seller: "Mobile World",
      currentBid: 72000,
      timeLeft: "2d 6h",
      category: "Electronics",
      bidsCount: 15,
      addedDate: "2024-01-18",
      priceWhenAdded: 65000,
      priceChange: 7000,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
      notifications: false,
      endingSoon: false
    },
    {
      id: 4,
      title: "Honda CB300F",
      seller: "Moto Elite",
      currentBid: 125000,
      timeLeft: "4d 12h",
      category: "Motorbikes",
      bidsCount: 8,
      addedDate: "2024-01-21",
      priceWhenAdded: 120000,
      priceChange: 5000,
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80",
      notifications: true,
      endingSoon: false
    },
    {
      id: 5,
      title: "Subaru Impreza 2020",
      seller: "Auto Dealers Ltd",
      currentBid: 1450000,
      timeLeft: "6h 30m",
      category: "Cars",
      bidsCount: 31,
      addedDate: "2024-01-19",
      priceWhenAdded: 1300000,
      priceChange: 150000,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
      notifications: true,
      endingSoon: true
    }
  ];

  const filteredWatchlist = watchlistItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.seller.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveFromWatchlist = (itemId: number) => {
    console.log("Remove from watchlist:", itemId);
    // Handle removal logic
  };

  const handleToggleNotifications = (itemId: number) => {
    console.log("Toggle notifications for:", itemId);
    // Handle notification toggle logic
  };

  const handlePlaceBid = (itemId: number) => {
    console.log("Place bid on:", itemId);
    // Handle bid placement logic
  };

  const handleViewDetails = (itemId: number) => {
    console.log("View details for:", itemId);
    // Handle view details logic
  };

  const getPriceChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <span className="text-red-600 text-sm font-medium">
          +Ksh {change.toLocaleString()}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-green-600 text-sm font-medium">
          -Ksh {Math.abs(change).toLocaleString()}
        </span>
      );
    }
    return <span className="text-gray-500 text-sm">No change</span>;
  };

  // Statistics
  const totalItems = watchlistItems.length;
  const endingSoonCount = watchlistItems.filter(item => item.endingSoon).length;
  const avgPriceIncrease = watchlistItems.reduce((sum, item) => sum + item.priceChange, 0) / totalItems;
  const notificationsEnabled = watchlistItems.filter(item => item.notifications).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5" />
          <span>My Watchlist</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Keep track of interesting auctions and get notified about price changes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Watchlist Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Watched Items</p>
                <p className="text-2xl font-bold text-purple-800">{totalItems}</p>
              </div>
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Ending Soon</p>
                <p className="text-2xl font-bold text-red-800">{endingSoonCount}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Notifications On</p>
                <p className="text-2xl font-bold text-blue-800">{notificationsEnabled}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Avg. Price Change</p>
                <p className="text-lg font-bold text-green-800">
                  {avgPriceIncrease >= 0 ? '+' : ''}Ksh {avgPriceIncrease.toLocaleString()}
                </p>
              </div>
              <Search className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-red-50"
            onClick={() => setSearchTerm("ending soon")}
          >
            Ending Soon ({endingSoonCount})
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-blue-50"
            onClick={() => setSearchTerm("electronics")}
          >
            Electronics
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-green-50"
            onClick={() => setSearchTerm("cars")}
          >
            Cars
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-purple-50"
            onClick={() => setSearchTerm("motorbikes")}
          >
            Motorbikes
          </Badge>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-4">
          {filteredWatchlist.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                <div className="w-full lg:w-32 h-24 flex-shrink-0 relative">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover rounded"
                  />
                  {item.endingSoon && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                      Ending Soon!
                    </Badge>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-500">by {item.seller}</p>
                      <Badge variant="outline" className="mt-1 w-fit">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.timeLeft}
                      </div>
                    </div>
                  </div>

                  {/* Price Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="font-bold text-green-600">
                        Ksh {item.currentBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">When Added</p>
                      <p className="font-medium text-gray-700">
                        Ksh {item.priceWhenAdded.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price Change</p>
                      {getPriceChangeIndicator(item.priceChange)}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                    <span>{item.bidsCount} bids</span>
                    <span>Added on {new Date(item.addedDate).toLocaleDateString()}</span>
                    <div className="flex items-center">
                      <Bell className={`w-4 h-4 mr-1 ${item.notifications ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span>{item.notifications ? 'Notifications On' : 'Notifications Off'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handlePlaceBid(item.id)}>
                      Place Bid
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(item.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleNotifications(item.id)}
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      {item.notifications ? 'Disable' : 'Enable'} Alerts
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRemoveFromWatchlist(item.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  {/* Ending Soon Alert */}
                  {item.endingSoon && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-red-600 mr-2" />
                        <p className="text-sm text-red-800">
                          This auction is ending soon! Only {item.timeLeft} remaining.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price Increase Alert */}
                  {item.priceChange > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <Search className="w-4 h-4 text-amber-600 mr-2" />
                        <p className="text-sm text-amber-800">
                          Price has increased by Ksh {item.priceChange.toLocaleString()} since you added it to watchlist.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWatchlist.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in watchlist</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "No items match your search criteria" : "Start watching auctions to track their progress"}
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              {searchTerm ? "Clear Search" : "Browse Auctions"}
            </Button>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Watchlist Tips:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Enable notifications to get alerts when prices change</li>
            <li>• Items ending soon are highlighted for quick action</li>
            <li>• Track price changes since you added items to your watchlist</li>
            <li>• You can watch up to 50 items at once</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistTab;
