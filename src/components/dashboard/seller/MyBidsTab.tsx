import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

const MyBidsTab: React.FC = () => {
  // Mock bidding statistics
  const biddingStats = {
    activeBids: 3,
    wonAuctions: 2,
    outbid: 1,
    totalBids: 8
  };

  // Mock active bids data
  const activeBids = [
    {
      id: 1,
      item: "Honda Civic 2018",
      category: "Cars",
      myBid: 850000,
      currentHighest: 870000,
      status: "outbid",
      timeLeft: "2h 15m",
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=60&q=80",
      seller: "Auto Plaza Ltd"
    },
    {
      id: 2,
      item: "MacBook Pro 2020",
      category: "Electronics",
      myBid: 95000,
      currentHighest: 95000,
      status: "leading",
      timeLeft: "1d 8h",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=60&q=80",
      seller: "TechHub Kenya"
    },
    {
      id: 3,
      item: "Yamaha R15 V3",
      category: "Motorbikes",
      myBid: 75000,
      currentHighest: 78000,
      status: "outbid",
      timeLeft: "3d 5h",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=60&q=80",
      seller: "Bike World"
    }
  ];

  // Mock bid history
  const bidHistory = [
    {
      id: 1,
      item: "Toyota Camry 2019",
      finalBid: 1200000,
      winningBid: 1250000,
      status: "lost",
      date: "3 days ago"
    },
    {
      id: 2,
      item: "Samsung Galaxy S22",
      finalBid: 45000,
      winningBid: 45000,
      status: "won",
      date: "1 week ago"
    },
    {
      id: 3,
      item: "HP Pavilion Laptop",
      finalBid: 38000,
      winningBid: 42000,
      status: "lost",
      date: "2 weeks ago"
    }
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      leading: { label: "Leading", color: "bg-green-100 text-green-800" },
      outbid: { label: "Outbid", color: "bg-red-100 text-red-800" },
      won: { label: "Won", color: "bg-blue-100 text-blue-800" },
      lost: { label: "Lost", color: "bg-gray-100 text-gray-800" }
    };
    return configs[status as keyof typeof configs] || configs.lost;
  };

  const handleIncreaseBid = (bidId: number) => {
    console.log("Increase bid for:", bidId);
    // Handle bid increase logic
  };

  const handleViewItem = (bidId: number) => {
    console.log("View item for bid:", bidId);
    // Handle view item logic
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>My Bidding Activity</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track your bids, wins, and bidding history
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bidding Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{biddingStats.activeBids}</div>
            <div className="text-sm text-blue-600">Active Bids</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{biddingStats.wonAuctions}</div>
            <div className="text-sm text-green-600">Won Auctions</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{biddingStats.outbid}</div>
            <div className="text-sm text-red-600">Currently Outbid</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{biddingStats.totalBids}</div>
            <div className="text-sm text-gray-600">Total Bids Placed</div>
          </div>
        </div>

        {/* Active Bids */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Bids</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Item</th>
                  <th className="text-left p-4 font-medium">My Bid</th>
                  <th className="text-left p-4 font-medium">Current Highest</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Time Left</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeBids.map((bid) => (
                  <tr key={bid.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img src={bid.image} alt={bid.item} className="w-12 h-12 rounded object-cover" />
                        <div>
                          <div className="font-medium">{bid.item}</div>
                          <div className="text-sm text-gray-500">{bid.category} • {bid.seller}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium">Ksh {bid.myBid.toLocaleString()}</td>
                    <td className="p-4">Ksh {bid.currentHighest.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(bid.status).color}>
                        {getStatusBadge(bid.status).label}
                      </Badge>
                    </td>
                    <td className="p-4">{bid.timeLeft}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {bid.status === 'outbid' && (
                          <Button size="sm" onClick={() => handleIncreaseBid(bid.id)}>
                            Increase Bid
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleViewItem(bid.id)}>
                          View Item
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bid History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Bid History</h3>
          <div className="space-y-3">
            {bidHistory.map((bid) => (
              <Card key={bid.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{bid.item}</h4>
                    <p className="text-sm text-gray-600">{bid.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm text-gray-600">My bid:</span>
                      <span className="font-medium">Ksh {bid.finalBid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">Winning bid:</span>
                      <span className="font-medium">Ksh {bid.winningBid.toLocaleString()}</span>
                    </div>
                    <Badge className={getStatusBadge(bid.status).color}>
                      {getStatusBadge(bid.status).label}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty States */}
        {activeBids.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bids</h3>
            <p className="text-gray-600 mb-4">Start bidding on auctions to track your activity here</p>
            <Button>Browse Auctions</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyBidsTab;
