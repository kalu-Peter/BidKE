import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, Package, Calendar, Download, MessageCircle } from "lucide-react";

const WonAuctionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Mock data for won auctions
  const wonAuctions = [
    {
      id: 1,
      title: "iPhone 12 Pro - 128GB",
      seller: "Mobile World",
      winningBid: 68000,
      wonDate: "2024-01-20",
      category: "Electronics",
      status: "delivered",
      deliveryDate: "2024-01-25",
      paymentStatus: "paid",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
      sellerRating: 4.8,
      trackingNumber: "TN123456789",
      deliveryAddress: "Nairobi, Kenya",
      hasReviewed: true,
      myRating: 5,
      totalBids: 23
    },
    {
      id: 2,
      title: "Samsung Galaxy Watch 4",
      seller: "TechHub Kenya",
      winningBid: 24000,
      wonDate: "2024-01-18",
      category: "Electronics",
      status: "shipped",
      deliveryDate: null,
      paymentStatus: "paid",
      image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=400&q=80",
      sellerRating: 4.6,
      trackingNumber: "TN987654321",
      deliveryAddress: "Mombasa, Kenya",
      hasReviewed: false,
      myRating: null,
      totalBids: 12
    },
    {
      id: 3,
      title: "Sony WH-1000XM4 Headphones",
      seller: "Audio Pro",
      winningBid: 18500,
      wonDate: "2024-01-15",
      category: "Electronics",
      status: "payment_pending",
      deliveryDate: null,
      paymentStatus: "pending",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
      sellerRating: 4.9,
      trackingNumber: null,
      deliveryAddress: "Nakuru, Kenya",
      hasReviewed: false,
      myRating: null,
      totalBids: 8
    },
    {
      id: 4,
      title: "Canon EOS M50 Camera",
      seller: "Camera Store KE",
      winningBid: 52000,
      wonDate: "2024-01-12",
      category: "Electronics",
      status: "delivered",
      deliveryDate: "2024-01-17",
      paymentStatus: "paid",
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=400&q=80",
      sellerRating: 4.7,
      trackingNumber: "TN456789123",
      deliveryAddress: "Kisumu, Kenya",
      hasReviewed: true,
      myRating: 4,
      totalBids: 19
    },
    {
      id: 5,
      title: "Dell XPS 13 Laptop",
      seller: "Computer World",
      winningBid: 78000,
      wonDate: "2024-01-10",
      category: "Electronics",
      status: "cancelled",
      deliveryDate: null,
      paymentStatus: "refunded",
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80",
      sellerRating: 4.2,
      trackingNumber: null,
      deliveryAddress: "Eldoret, Kenya",
      hasReviewed: false,
      myRating: null,
      totalBids: 31
    }
  ];

  const filteredAuctions = wonAuctions
    .filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           auction.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || auction.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.wonDate).getTime() - new Date(a.wonDate).getTime();
        case "price":
          return b.winningBid - a.winningBid;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const handlePayNow = (auctionId: number) => {
    console.log("Pay for auction:", auctionId);
    // Handle payment logic
  };

  const handleTrackPackage = (trackingNumber: string) => {
    console.log("Track package:", trackingNumber);
    // Handle package tracking logic
  };

  const handleContactSeller = (auctionId: number) => {
    console.log("Contact seller for auction:", auctionId);
    // Handle seller contact logic
  };

  const handleLeaveReview = (auctionId: number) => {
    console.log("Leave review for auction:", auctionId);
    // Handle review logic
  };

  const handleDownloadInvoice = (auctionId: number) => {
    console.log("Download invoice for auction:", auctionId);
    // Handle invoice download logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "payment_pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "shipped":
        return "Shipped";
      case "payment_pending":
        return "Payment Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Statistics
  const totalWonAuctions = wonAuctions.length;
  const deliveredCount = wonAuctions.filter(a => a.status === "delivered").length;
  const totalSpent = wonAuctions
    .filter(a => a.paymentStatus === "paid")
    .reduce((sum, a) => sum + a.winningBid, 0);
  const pendingPayments = wonAuctions.filter(a => a.status === "payment_pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Won Auctions</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your successful auction wins and track deliveries
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Won</p>
                <p className="text-2xl font-bold text-green-800">{totalWonAuctions}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Delivered</p>
                <p className="text-2xl font-bold text-blue-800">{deliveredCount}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Spent</p>
                <p className="text-lg font-bold text-purple-800">
                  Ksh {totalSpent.toLocaleString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pending Payment</p>
                <p className="text-2xl font-bold text-yellow-800">{pendingPayments}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search won auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Won</SelectItem>
              <SelectItem value="price">Winning Bid</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Won Auctions List */}
        <div className="space-y-4">
          {filteredAuctions.map((auction) => (
            <div key={auction.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                <div className="w-full lg:w-32 h-24 flex-shrink-0">
                  <img 
                    src={auction.image} 
                    alt={auction.title} 
                    className="w-full h-full object-cover rounded"
                  />
                </div>

                {/* Auction Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{auction.title}</h3>
                      <p className="text-sm text-gray-500">by {auction.seller}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{auction.category}</Badge>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{auction.sellerRating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <Badge className={getStatusColor(auction.status)}>
                        {getStatusText(auction.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Auction Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Winning Bid</p>
                      <p className="font-bold text-green-600">
                        Ksh {auction.winningBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Won Date</p>
                      <p className="font-medium text-gray-700">
                        {new Date(auction.wonDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Bids</p>
                      <p className="font-medium text-gray-700">{auction.totalBids}</p>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="font-medium">{auction.deliveryAddress}</p>
                      </div>
                      {auction.trackingNumber && (
                        <div>
                          <p className="text-sm text-gray-500">Tracking Number</p>
                          <p className="font-medium font-mono text-blue-600">{auction.trackingNumber}</p>
                        </div>
                      )}
                      {auction.deliveryDate && (
                        <div>
                          <p className="text-sm text-gray-500">Delivered On</p>
                          <p className="font-medium">
                            {new Date(auction.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {auction.status === "payment_pending" && (
                      <Button size="sm" onClick={() => handlePayNow(auction.id)}>
                        Pay Now
                      </Button>
                    )}
                    {auction.trackingNumber && (
                      <Button size="sm" variant="outline" onClick={() => handleTrackPackage(auction.trackingNumber!)}>
                        <Package className="w-4 h-4 mr-1" />
                        Track Package
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleContactSeller(auction.id)}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Contact Seller
                    </Button>
                    {auction.status === "delivered" && !auction.hasReviewed && (
                      <Button size="sm" variant="outline" onClick={() => handleLeaveReview(auction.id)}>
                        <Star className="w-4 h-4 mr-1" />
                        Leave Review
                      </Button>
                    )}
                    {auction.paymentStatus === "paid" && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(auction.id)}>
                        <Download className="w-4 h-4 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>

                  {/* Review Section */}
                  {auction.hasReviewed && auction.myRating && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < auction.myRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-sm text-green-800 ml-2">
                          You rated this seller {auction.myRating} stars
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status-specific Messages */}
                  {auction.status === "payment_pending" && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Payment is required to complete this purchase. Please pay within 48 hours.
                      </p>
                    </div>
                  )}

                  {auction.status === "cancelled" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        This auction was cancelled. {auction.paymentStatus === "refunded" ? "Your payment has been refunded." : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No won auctions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "No auctions match your search criteria" 
                : "You haven't won any auctions yet"}
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}>
              {searchTerm || statusFilter !== "all" ? "Clear Filters" : "Browse Auctions"}
            </Button>
          </div>
        )}

        {/* Success Tips */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Post-Purchase Tips:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Complete payment promptly to avoid auction cancellation</li>
            <li>• Track your packages using the provided tracking numbers</li>
            <li>• Leave honest reviews to help other buyers</li>
            <li>• Contact sellers directly for any delivery issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WonAuctionsTab;
