import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Receipt, Eye } from "lucide-react";

const WonAuctionsTab: React.FC = () => {
  // Mock won auctions data
  const wonAuctions = [
    {
      id: 1,
      title: "Yamaha R15 V3",
      category: "Motorbikes",
      winningBid: 85000,
      status: "payment_pending",
      dateDue: "2025-09-12",
      dateWon: "2 days ago",
      seller: "Bike World",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=80&q=80",
      collectionLocation: "Nairobi - Industrial Area",
      paymentDeadline: "3 days remaining"
    },
    {
      id: 2,
      title: "iPhone 13 Pro",
      category: "Electronics",
      winningBid: 65000,
      status: "paid",
      datePaid: "2025-09-03",
      dateWon: "1 week ago",
      seller: "TechHub Kenya",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=80&q=80",
      collectionLocation: "Nairobi - CBD",
      collectionDate: "Available for collection"
    },
    {
      id: 3,
      title: "Toyota Vitz 2015",
      category: "Cars",
      winningBid: 275000,
      status: "collected",
      datePaid: "2025-08-28",
      dateWon: "2 weeks ago",
      seller: "Auto Dealers Ltd",
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=80&q=80",
      collectionLocation: "Mombasa - Nyali",
      collectionDate: "Collected on 2025-09-01"
    },
    {
      id: 4,
      title: "MacBook Air M2",
      category: "Electronics",
      winningBid: 95000,
      status: "paid",
      datePaid: "2025-08-25",
      dateWon: "3 weeks ago",
      seller: "Digital Solutions",
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=80&q=80",
      collectionLocation: "Kisumu - Town Center",
      collectionDate: "Ready for collection"
    }
  ];

  const getStatusConfig = (status: string) => {
    const configs = {
      payment_pending: { 
        label: "Payment Pending", 
        color: "bg-yellow-100 text-yellow-800",
        description: "Complete payment to secure your item"
      },
      paid: { 
        label: "Paid", 
        color: "bg-blue-100 text-blue-800",
        description: "Payment confirmed, ready for collection"
      },
      collected: { 
        label: "Collected", 
        color: "bg-green-100 text-green-800",
        description: "Item successfully collected"
      }
    };
    return configs[status as keyof typeof configs] || configs.paid;
  };

  const handlePayNow = (auctionId: number) => {
    console.log("Pay now for auction:", auctionId);
    // Handle payment logic
  };

  const handleViewReceipt = (auctionId: number) => {
    console.log("View receipt for auction:", auctionId);
    // Handle view receipt logic
  };

  const handleViewDetails = (auctionId: number) => {
    console.log("View details for auction:", auctionId);
    // Handle view details logic
  };

  const handleContactSeller = (auctionId: number) => {
    console.log("Contact seller for auction:", auctionId);
    // Handle contact seller logic
  };

  // Calculate statistics
  const totalWon = wonAuctions.length;
  const pendingPayment = wonAuctions.filter(a => a.status === 'payment_pending').length;
  const totalSpent = wonAuctions
    .filter(a => a.status !== 'payment_pending')
    .reduce((sum, auction) => sum + auction.winningBid, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Won Auctions</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Auctions you've successfully won and payment details
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Won Auctions Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalWon}</div>
            <div className="text-sm text-green-600">Total Won</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingPayment}</div>
            <div className="text-sm text-yellow-600">Pending Payment</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Ksh {Math.round(totalSpent / 1000)}K</div>
            <div className="text-sm text-blue-600">Total Spent</div>
          </div>
        </div>

        {/* Won Items List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Wins</h3>
          <div className="space-y-4">
            {wonAuctions.map((auction) => {
              const statusConfig = getStatusConfig(auction.status);
              return (
                <Card key={auction.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={auction.image}
                        alt={auction.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-lg">{auction.title}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{auction.category} • {auction.seller}</p>
                          <p>Won {auction.dateWon}</p>
                          <p className="flex items-center space-x-1">
                            <span>📍</span>
                            <span>{auction.collectionLocation}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 mb-2">
                        Ksh {auction.winningBid.toLocaleString()}
                      </div>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1 max-w-48">
                        {statusConfig.description}
                      </p>
                      {auction.status === 'payment_pending' && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⏰ {auction.paymentDeadline}
                        </p>
                      )}
                      {auction.status === 'paid' && (
                        <p className="text-xs text-blue-600 mt-1">
                          📦 {auction.collectionDate}
                        </p>
                      )}
                      {auction.status === 'collected' && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ {auction.collectionDate}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    {auction.status === 'payment_pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handlePayNow(auction.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Pay Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleContactSeller(auction.id)}
                        >
                          Contact Seller
                        </Button>
                      </>
                    )}
                    {auction.status === 'paid' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewReceipt(auction.id)}
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          View Receipt
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleContactSeller(auction.id)}
                        >
                          Contact Seller
                        </Button>
                      </>
                    )}
                    {auction.status === 'collected' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewReceipt(auction.id)}
                      >
                        <Receipt className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(auction.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {wonAuctions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No won auctions yet</h3>
            <p className="text-gray-600 mb-4">Start bidding on auctions to build your collection</p>
            <Button>Browse Auctions</Button>
          </div>
        )}

        {/* Payment & Collection Info */}
        <Card className="bg-blue-50">
          <CardContent className="p-6">
            <h4 className="font-medium text-blue-900 mb-4">Payment & Collection Guidelines</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2">Payment:</h5>
                <ul className="space-y-1">
                  <li>• Payment due within 48 hours of winning</li>
                  <li>• M-Pesa, bank transfer, or cash accepted</li>
                  <li>• Late payment may result in auction cancellation</li>
                  <li>• Payment confirmation sent via SMS/email</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Collection:</h5>
                <ul className="space-y-1">
                  <li>• Collect within 7 days of payment</li>
                  <li>• Bring ID and payment receipt</li>
                  <li>• Items can be inspected before collection</li>
                  <li>• Delivery available for additional fee</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default WonAuctionsTab;
