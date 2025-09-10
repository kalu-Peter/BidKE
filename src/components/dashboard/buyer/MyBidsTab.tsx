import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Gavel, Clock, TrendingUp, TrendingDown } from "lucide-react";

const MyBidsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for active bids
  const activeBids = [
    {
      id: 1,
      title: "MacBook Pro 2020",
      seller: "Digital Solutions",
      myBid: 95000,
      currentBid: 97000,
      maxBid: 120000,
      timeLeft: "3d 8h",
      status: "outbid",
      bidsCount: 22,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
      bidHistory: [
        { amount: 85000, time: "2 days ago" },
        { amount: 90000, time: "1 day ago" },
        { amount: 95000, time: "12 hours ago" }
      ]
    },
    {
      id: 2,
      title: "Samsung 55'' 4K TV",
      seller: "TechHub Kenya",
      myBid: 45000,
      currentBid: 45000,
      maxBid: 60000,
      timeLeft: "1h 30m",
      status: "winning",
      bidsCount: 8,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
      bidHistory: [
        { amount: 35000, time: "3 days ago" },
        { amount: 40000, time: "2 days ago" },
        { amount: 45000, time: "1 day ago" }
      ]
    },
    {
      id: 3,
      title: "Honda Civic 2019",
      seller: "Premium Motors",
      myBid: 1150000,
      currentBid: 1200000,
      maxBid: 1300000,
      timeLeft: "1d 14h",
      status: "outbid",
      bidsCount: 28,
      category: "Cars",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
      bidHistory: [
        { amount: 1000000, time: "5 days ago" },
        { amount: 1100000, time: "3 days ago" },
        { amount: 1150000, time: "2 days ago" }
      ]
    }
  ];

  const filteredBids = activeBids.filter(bid => 
    bid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bid.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIncreaseBid = (bidId: number) => {
    console.log("Increase bid for:", bidId);
    // Handle bid increase logic
  };

  const handleViewAuction = (bidId: number) => {
    console.log("View auction for bid:", bidId);
    // Handle view auction logic
  };

  const handleWithdrawBid = (bidId: number) => {
    console.log("Withdraw bid:", bidId);
    // Handle bid withdrawal logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "winning":
        return "bg-green-100 text-green-800";
      case "outbid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "winning":
        return <TrendingUp className="w-4 h-4" />;
      case "outbid":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Stats calculation
  const totalActiveBids = activeBids.length;
  const winningBids = activeBids.filter(bid => bid.status === "winning").length;
  const outbidCount = activeBids.filter(bid => bid.status === "outbid").length;
  const totalBidAmount = activeBids.reduce((sum, bid) => sum + bid.myBid, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gavel className="w-5 h-5" />
          <span>My Active Bids</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track and manage your current auction bids
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bid Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Active Bids</p>
                <p className="text-2xl font-bold text-blue-800">{totalActiveBids}</p>
              </div>
              <Gavel className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Winning</p>
                <p className="text-2xl font-bold text-green-800">{winningBids}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Outbid</p>
                <p className="text-2xl font-bold text-red-800">{outbidCount}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Committed</p>
                <p className="text-lg font-bold text-purple-800">
                  Ksh {totalBidAmount.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search your bids..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Active Bids List */}
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <div key={bid.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                <div className="w-full lg:w-32 h-24 flex-shrink-0">
                  <img 
                    src={bid.image} 
                    alt={bid.title} 
                    className="w-full h-full object-cover rounded"
                  />
                </div>

                {/* Bid Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{bid.title}</h3>
                      <p className="text-sm text-gray-500">by {bid.seller}</p>
                      <Badge variant="outline" className="mt-1 w-fit">
                        {bid.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <Badge className={getStatusColor(bid.status)}>
                        {getStatusIcon(bid.status)}
                        <span className="ml-1 capitalize">{bid.status}</span>
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {bid.timeLeft}
                      </div>
                    </div>
                  </div>

                  {/* Bid Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Your Bid</p>
                      <p className="font-bold text-blue-600">
                        Ksh {bid.myBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Highest</p>
                      <p className={`font-bold ${bid.status === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                        Ksh {bid.currentBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Max Bid</p>
                      <p className="font-bold text-gray-800">
                        Ksh {bid.maxBid.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Bid Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Bid Progress</span>
                      <span>{bid.bidsCount} total bids</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${bid.status === 'winning' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(bid.myBid / bid.currentBid) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleViewAuction(bid.id)}>
                      View Auction
                    </Button>
                    {bid.status === 'outbid' && (
                      <Button size="sm" variant="outline" onClick={() => handleIncreaseBid(bid.id)}>
                        Increase Bid
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleWithdrawBid(bid.id)}
                    >
                      Withdraw Bid
                    </Button>
                  </div>

                  {/* Status Alert */}
                  {bid.status === 'outbid' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                        <p className="text-sm text-red-800">
                          You've been outbid! The current highest bid is Ksh {bid.currentBid.toLocaleString()}.
                        </p>
                      </div>
                    </div>
                  )}

                  {bid.status === 'winning' && bid.timeLeft.includes('h') && !bid.timeLeft.includes('d') && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                        <p className="text-sm text-green-800">
                          You're winning! Auction ends in {bid.timeLeft}.
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
        {filteredBids.length === 0 && (
          <div className="text-center py-12">
            <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bids found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "No bids match your search criteria" : "You haven't placed any bids yet"}
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              {searchTerm ? "Clear Search" : "Browse Auctions"}
            </Button>
          </div>
        )}

        {/* Bidding Guidelines */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Bidding Guidelines:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• You can increase your maximum bid at any time</li>
            <li>• Bids can be withdrawn up to 1 hour before auction ends</li>
            <li>• If you're outbid, you'll receive an instant notification</li>
            <li>• Your maximum bid is kept confidential until needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBidsTab;
