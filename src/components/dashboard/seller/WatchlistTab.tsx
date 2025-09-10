import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye } from "lucide-react";

const WatchlistTab: React.FC = () => {
  // Mock watchlist data
  const watchlistItems = [
    {
      id: 1,
      title: "BMW X3 2020",
      category: "Cars",
      currentBid: 2800000,
      bids: 15,
      timeLeft: "1d 14h",
      seller: "Premium Motors",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80",
      addedDate: "2 days ago"
    },
    {
      id: 2,
      title: "iPhone 15 Pro",
      category: "Electronics",
      currentBid: 125000,
      bids: 22,
      timeLeft: "8h 30m",
      seller: "Digital Hub",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
      addedDate: "1 day ago"
    },
    {
      id: 3,
      title: "Ducati Monster 821",
      category: "Motorbikes",
      currentBid: 950000,
      bids: 8,
      timeLeft: "3d 2h",
      seller: "Moto Elite",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=80",
      addedDate: "3 days ago"
    },
    {
      id: 4,
      title: "Dell XPS 15",
      category: "Electronics",
      currentBid: 85000,
      bids: 12,
      timeLeft: "2d 10h",
      seller: "Tech Solutions",
      image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=400&q=80",
      addedDate: "1 week ago"
    },
    {
      id: 5,
      title: "Audi Q5 2019",
      category: "Cars",
      currentBid: 3200000,
      bids: 28,
      timeLeft: "6h 45m",
      seller: "Luxury Autos",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=400&q=80",
      addedDate: "5 days ago"
    }
  ];

  const handleRemoveFromWatchlist = (itemId: number) => {
    console.log("Remove from watchlist:", itemId);
    // Handle remove from watchlist logic
  };

  const handlePlaceBid = (itemId: number) => {
    console.log("Place bid on item:", itemId);
    // Handle place bid logic
  };

  const handleViewDetails = (itemId: number) => {
    console.log("View details for item:", itemId);
    // Handle view details logic
  };

  const getTimeLeftColor = (timeLeft: string) => {
    if (timeLeft.includes('h') && !timeLeft.includes('d')) {
      const hours = parseInt(timeLeft.split('h')[0]);
      if (hours < 12) return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5" />
          <span>My Watchlist</span>
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Items you're watching and considering to bid on
          </p>
          <Badge variant="outline">
            {watchlistItems.length} Items Watched
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {watchlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlistItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    Active
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute top-2 left-2 bg-white/90 hover:bg-white"
                    onClick={() => handleRemoveFromWatchlist(item.id)}
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{item.category} • {item.seller}</span>
                      <span>Added {item.addedDate}</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-lg font-bold text-green-600">
                      Ksh {item.currentBid.toLocaleString()}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{item.bids} bids</span>
                      <span className={getTimeLeftColor(item.timeLeft)}>
                        {item.timeLeft} left
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePlaceBid(item.id)}
                    >
                      Place Bid
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in watchlist</h3>
            <p className="text-gray-600 mb-4">Start exploring auctions and add items to your watchlist</p>
            <Button>Browse Auctions</Button>
          </div>
        )}

        {/* Watchlist Stats */}
        {watchlistItems.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{watchlistItems.length}</div>
                <div className="text-sm text-gray-600">Items Watched</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {watchlistItems.filter(item => item.timeLeft.includes('h') && !item.timeLeft.includes('d')).length}
                </div>
                <div className="text-sm text-gray-600">Ending Soon</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  Ksh {Math.round(watchlistItems.reduce((sum, item) => sum + item.currentBid, 0) / 1000)}K
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </Card>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Watchlist Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Get notified when items you're watching are ending soon</li>
            <li>• Monitor price changes and bidding activity</li>
            <li>• Quick access to place bids on items you're interested in</li>
            <li>• Remove items from watchlist if you're no longer interested</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistTab;
