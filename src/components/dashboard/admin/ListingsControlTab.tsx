import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  Loader2,
  RefreshCw
} from "lucide-react";

// Types
interface Listing {
  id: number;
  title: string;
  description: string;
  starting_price: number;
  reserve_price: number | null;
  current_bid: number;
  start_time: string;
  end_time: string;
  status: string;
  featured: boolean;
  view_count: number;
  bid_count: number;
  created_at: string;
  seller_name: string;
  seller_email: string;
  category_name: string;
  category_slug: string;
  item_type: 'vehicle' | 'electronics' | 'other';
  make_brand: string;
  model: string;
  year: number | null;
  item_condition: string;
  location: string;
  auction_duration: number;
  images: string[];
  documents: string[];
  verification_status: string;
}

interface Stats {
  total: number;
  draft: number;
  pending_review: number;
  needs_info: number;
  approved: number;
  live: number;
  ended: number;
  rejected: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ListingsControlTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  
  // API state
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    pending_review: 0,
    needs_info: 0,
    approved: 0,
    live: 0,
    ended: 0,
    rejected: 0
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from API
  const fetchListings = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm
      });
      
      const response = await fetch(`http://localhost:8000/admin/listings.php?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setListings(data.data || []);
        setStats(data.stats || stats);
        setPagination(data.pagination || pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  // Update auction status
  const updateAuctionStatus = async (auctionId: number, action: string, reason?: string, message?: string) => {
    try {
      const response = await fetch('http://localhost:8000/admin/listings.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          auction_id: auctionId,
          action,
          reason,
          message
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh listings
        await fetchListings(pagination.page);
        return true;
      } else {
        throw new Error(data.message || 'Failed to update auction status');
      }
    } catch (err) {
      console.error('Error updating auction status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auction');
      return false;
    }
  };

  // Load listings on component mount and when filters change
  useEffect(() => {
    fetchListings(1);
  }, [statusFilter, categoryFilter, searchTerm]);

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
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

  const handleApproveListing = async (listingId: number) => {
    const success = await updateAuctionStatus(listingId, 'approve');
    if (success) {
      console.log("Listing approved successfully");
    }
  };

  const handleRejectListing = (listingId: number) => {
    setSelectedListing(listings.find(l => l.id === listingId) || null);
    setShowRejectModal(true);
  };

  const handleRequestInfo = (listingId: number) => {
    setSelectedListing(listings.find(l => l.id === listingId) || null);
    setShowRequestInfoModal(true);
  };

  const handleViewDetails = (listingId: number) => {
    const listing = listings.find(l => l.id === listingId);
    setSelectedListing(listing || null);
  };

  const submitRejection = async () => {
    if (!selectedListing || !rejectReason.trim()) return;
    
    const success = await updateAuctionStatus(selectedListing.id, 'reject', rejectReason);
    if (success) {
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedListing(null);
    }
  };

  const submitInfoRequest = async () => {
    if (!selectedListing || !infoRequest.trim()) return;
    
    const success = await updateAuctionStatus(selectedListing.id, 'request_info', undefined, infoRequest);
    if (success) {
      setShowRequestInfoModal(false);
      setInfoRequest("");
      setSelectedListing(null);
    }
  };

  const handleMakeLive = async (listingId: number) => {
    const success = await updateAuctionStatus(listingId, 'make_live');
    if (success) {
      console.log("Auction is now live");
    }
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
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchListings(pagination.page)}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        {/* Listing Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            <p className="text-sm text-blue-600">Total</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-800">{stats.pending_review}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-800">{stats.needs_info || 0}</p>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
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
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="needs_info">Needs Info</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading listings...</span>
          </div>
        )}

        {/* Listings List */}
        {!loading && (
          <div className="space-y-4">
            {listings.map((listing) => (
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
                            {listing.seller_name || 'Unknown Seller'}
                          </span>
                          <Badge variant="outline">{listing.category_name}</Badge>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(listing.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        <Badge className={getStatusColor(listing.status)}>
                          {listing.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {getVerificationIcon(listing.verification_status)}
                        </div>
                      </div>
                    </div>

                    {/* Price and Auction Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Reserve Price</p>
                        <p className="font-bold text-green-600">
                          {listing.reserve_price ? `Ksh ${listing.reserve_price.toLocaleString()}` : 'No Reserve'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Starting Bid</p>
                        <p className="font-medium text-gray-700">
                          Ksh {listing.starting_price.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-700">
                          {listing.auction_duration} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-700">{listing.location || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Live Auction Info */}
                    {listing.status === 'live' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-blue-600">Current Bid</p>
                          <p className="font-bold text-blue-800">
                            Ksh {listing.current_bid.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Total Bids</p>
                          <p className="font-bold text-blue-800">{listing.bid_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Views</p>
                          <p className="font-bold text-blue-800">{listing.view_count}</p>
                        </div>
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Item Type</p>
                        <p className="font-medium capitalize">{listing.item_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Make/Brand</p>
                        <p className="font-medium">{listing.make_brand || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Model</p>
                        <p className="font-medium">{listing.model || 'N/A'}</p>
                      </div>
                      {listing.year && (
                        <div>
                          <p className="text-gray-500">Year</p>
                          <p className="font-medium">{listing.year}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Condition</p>
                        <p className="font-medium">{listing.item_condition || 'N/A'}</p>
                      </div>
                    </div>

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
                      
                      {(listing.status === 'draft' || listing.status === 'pending_review') && (
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

                      {listing.status === 'approved' && (
                        <Button 
                          size="sm"
                          onClick={() => handleMakeLive(listing.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Make Live
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
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

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchListings(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = pagination.page - 2 + i;
                if (pageNum < 1 || pageNum > pagination.pages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => fetchListings(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchListings(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
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
