import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Clock,
  MessageCircle,
  Image as ImageIcon,
  ShieldCheck
} from "lucide-react";

const ListingsControlTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [infoRequest, setInfoRequest] = useState("");

  // Mock data for listings
  const allListings = [
    {
      id: 1,
      title: "Toyota Hilux 2018 - Double Cab",
      description: "Well maintained pickup truck with service history",
      seller: "ABC Auctioneers Ltd",
      sellerRating: 4.8,
      category: "Cars",
      subcategory: "Pickup Trucks",
      reservePrice: 1500000,
      startingBid: 1200000,
      submittedDate: "2024-01-22",
      status: "pending_review",
      images: ["image1.jpg", "image2.jpg", "image3.jpg"],
      documents: ["logbook.pdf", "inspection.pdf"],
      condition: "Used - Good",
      mileage: "85,000 km",
      year: 2018,
      location: "Nairobi",
      auctionDuration: 7,
      features: ["4WD", "Manual Transmission", "Diesel Engine"],
      verificationStatus: "documents_uploaded"
    },
    {
      id: 2,
      title: "Samsung Galaxy S21 Ultra - 256GB",
      description: "Mint condition smartphone with original accessories",
      seller: "Tech Repos Ltd",
      sellerRating: 4.2,
      category: "Electronics",
      subcategory: "Smartphones",
      reservePrice: 45000,
      startingBid: 35000,
      submittedDate: "2024-01-21",
      status: "needs_info",
      images: ["phone1.jpg", "phone2.jpg"],
      documents: [],
      condition: "Used - Excellent",
      color: "Phantom Black",
      storage: "256GB",
      location: "Mombasa",
      auctionDuration: 5,
      features: ["5G", "120Hz Display", "S Pen"],
      verificationStatus: "missing_documents",
      requestedInfo: "Please provide purchase receipt and IMEI verification"
    },
    {
      id: 3,
      title: "Yamaha R15 V3 - Sport Bike",
      description: "Performance motorcycle in excellent condition",
      seller: "Moto Elite",
      sellerRating: 4.6,
      category: "Motorbikes",
      subcategory: "Sport Bikes",
      reservePrice: 250000,
      startingBid: 200000,
      submittedDate: "2024-01-20",
      status: "approved",
      images: ["bike1.jpg", "bike2.jpg", "bike3.jpg", "bike4.jpg"],
      documents: ["logbook.pdf", "insurance.pdf"],
      condition: "Used - Excellent",
      mileage: "12,000 km",
      year: 2021,
      location: "Kisumu",
      auctionDuration: 7,
      features: ["ABS", "Digital Display", "LED Headlights"],
      verificationStatus: "verified",
      approvedDate: "2024-01-21",
      auctionStartDate: "2024-01-23"
    },
    {
      id: 4,
      title: "MacBook Pro 2020 - M1 Chip",
      description: "Professional laptop with M1 processor",
      seller: "Digital Solutions",
      sellerRating: 4.9,
      category: "Electronics",
      subcategory: "Laptops",
      reservePrice: 95000,
      startingBid: 75000,
      submittedDate: "2024-01-19",
      status: "rejected",
      images: ["laptop1.jpg"],
      documents: [],
      condition: "Used - Good",
      processor: "Apple M1",
      storage: "512GB SSD",
      ram: "16GB",
      location: "Nakuru",
      auctionDuration: 5,
      features: ["Touch Bar", "Retina Display", "MacOS"],
      verificationStatus: "rejected",
      rejectionReason: "Insufficient images and missing proof of purchase",
      rejectionDate: "2024-01-21"
    },
    {
      id: 5,
      title: "Honda Civic 2019 - Sedan",
      description: "Reliable family car with full service history",
      seller: "Premium Motors",
      sellerRating: 4.7,
      category: "Cars",
      subcategory: "Sedans",
      reservePrice: 1200000,
      startingBid: 950000,
      submittedDate: "2024-01-18",
      status: "live",
      images: ["civic1.jpg", "civic2.jpg", "civic3.jpg"],
      documents: ["logbook.pdf", "service_history.pdf"],
      condition: "Used - Very Good",
      mileage: "45,000 km",
      year: 2019,
      location: "Eldoret",
      auctionDuration: 7,
      features: ["CVT Transmission", "Honda Sensing", "Sunroof"],
      verificationStatus: "verified",
      approvedDate: "2024-01-19",
      auctionStartDate: "2024-01-20",
      currentBid: 1050000,
      totalBids: 12,
      timeRemaining: "2d 14h"
    }
  ];

  const filteredListings = allListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || listing.category.toLowerCase() === categoryFilter;
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "needs_info":
        return "bg-orange-100 text-orange-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "live":
        return "bg-blue-100 text-blue-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <ShieldCheck className="w-4 h-4 text-green-600" />;
      case "documents_uploaded":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "missing_documents":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleApproveListing = (listingId: number) => {
    console.log("Approve listing:", listingId);
    // Handle listing approval logic
  };

  const handleRejectListing = (listingId: number) => {
    setSelectedListing(allListings.find(l => l.id === listingId));
    setShowRejectModal(true);
  };

  const handleRequestInfo = (listingId: number) => {
    setSelectedListing(allListings.find(l => l.id === listingId));
    setShowRequestInfoModal(true);
  };

  const handleViewDetails = (listingId: number) => {
    const listing = allListings.find(l => l.id === listingId);
    setSelectedListing(listing);
  };

  const submitRejection = () => {
    console.log("Reject listing with reason:", rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
    setSelectedListing(null);
  };

  const submitInfoRequest = () => {
    console.log("Request info for listing:", infoRequest);
    setShowRequestInfoModal(false);
    setInfoRequest("");
    setSelectedListing(null);
  };

  // Statistics
  const stats = {
    total: allListings.length,
    pending: allListings.filter(l => l.status === "pending_review").length,
    needsInfo: allListings.filter(l => l.status === "needs_info").length,
    approved: allListings.filter(l => l.status === "approved").length,
    live: allListings.filter(l => l.status === "live").length,
    rejected: allListings.filter(l => l.status === "rejected").length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Listings Control</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Review, approve, and manage auction listings from sellers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listing Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            <p className="text-sm text-blue-600">Total</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-800">{stats.needsInfo}</p>
            <p className="text-sm text-orange-600">Needs Info</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
            <p className="text-sm text-green-600">Approved</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-800">{stats.live}</p>
            <p className="text-sm text-purple-600">Live</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search listings by title or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cars">Cars</SelectItem>
              <SelectItem value="motorbikes">Motorbikes</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="needs_info">Needs Info</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings List */}
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Listing Image */}
                <div className="w-full lg:w-32 h-24 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                  {listing.images.length > 0 ? (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-500">{listing.images.length} images</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-red-400 mx-auto" />
                      <p className="text-xs text-red-500">No images</p>
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">{listing.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {listing.seller}
                        </span>
                        <Badge variant="outline">{listing.category}</Badge>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(listing.submittedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <Badge className={getStatusColor(listing.status)}>
                        {listing.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getVerificationIcon(listing.verificationStatus)}
                      </div>
                    </div>
                  </div>

                  {/* Price and Auction Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Reserve Price</p>
                      <p className="font-bold text-green-600">
                        Ksh {listing.reservePrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Starting Bid</p>
                      <p className="font-medium text-gray-700">
                        Ksh {listing.startingBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-700">
                        {listing.auctionDuration} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-700">{listing.location}</p>
                    </div>
                  </div>

                  {/* Live Auction Info */}
                  {listing.status === 'live' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-blue-600">Current Bid</p>
                        <p className="font-bold text-blue-800">
                          Ksh {listing.currentBid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Total Bids</p>
                        <p className="font-bold text-blue-800">{listing.totalBids}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Time Remaining</p>
                        <p className="font-bold text-blue-800">{listing.timeRemaining}</p>
                      </div>
                    </div>
                  )}

                  {/* Status-specific messages */}
                  {listing.status === 'needs_info' && listing.requestedInfo && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Information Requested:</span>
                      </div>
                      <p className="text-sm text-orange-700">{listing.requestedInfo}</p>
                    </div>
                  )}

                  {listing.status === 'rejected' && listing.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Rejection Reason:</span>
                      </div>
                      <p className="text-sm text-red-700">{listing.rejectionReason}</p>
                    </div>
                  )}

                  {/* Documents and Images Summary */}
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                      <span className={listing.images.length > 0 ? "text-green-600" : "text-red-600"}>
                        {listing.images.length} images
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className={listing.documents.length > 0 ? "text-green-600" : "text-red-600"}>
                        {listing.documents.length} documents
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(listing.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    
                    {listing.status === 'pending_review' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveListing(listing.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRequestInfo(listing.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Request Info
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRejectListing(listing.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {listing.status === 'needs_info' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveListing(listing.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRejectListing(listing.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                ? "No listings match your search criteria"
                : "No listings submitted yet"}
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Modals */}
        {showRejectModal && selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reject Listing</h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to reject the listing "<strong>{selectedListing.title}</strong>". 
                Please provide a reason:
              </p>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={submitRejection}
                  disabled={!rejectReason.trim()}
                >
                  Reject Listing
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedListing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showRequestInfoModal && selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Request Additional Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Request additional information from the seller for "<strong>{selectedListing.title}</strong>":
              </p>
              <Textarea
                placeholder="Specify what information is needed..."
                value={infoRequest}
                onChange={(e) => setInfoRequest(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={submitInfoRequest}
                  disabled={!infoRequest.trim()}
                >
                  Send Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRequestInfoModal(false);
                    setInfoRequest("");
                    setSelectedListing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Review Guidelines */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Listing Review Guidelines:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Verify all images are clear and show the item accurately</li>
            <li>• Check that descriptions are detailed and truthful</li>
            <li>• Ensure proper documentation is provided (logbooks, receipts, etc.)</li>
            <li>• Confirm reserve prices are reasonable for market value</li>
            <li>• Review seller's history and ratings before approval</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingsControlTab;
