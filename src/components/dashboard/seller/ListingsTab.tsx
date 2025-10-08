import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Auction } from "../../../services/api";
import { toast } from "@/hooks/use-toast";

const ListingsTab: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch seller's listings
  useEffect(() => {
    const fetchListings = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getSellerAuctions({
          sellerId: user.id,
          status: statusFilter,
          page: currentPage,
          limit: 10,
        });

        if (response.success && response.data) {
          setListings(response.data.auctions || []);
          setTotalPages(response.data.pagination?.pages || 1);
        } else {
          throw new Error(response.error || "Failed to fetch listings");
        }
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load listings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user?.id, currentPage, statusFilter]);

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      live: {
        label: "Live",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      active: {
        label: "Live",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      pending: {
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-3 h-3" />,
      },
      ended: {
        label: "Ended - No Sale",
        color: "bg-gray-100 text-gray-800",
        icon: <XCircle className="w-3 h-3" />,
      },
      sold: {
        label: "Sold",
        color: "bg-purple-100 text-purple-800",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      draft: {
        label: "Draft",
        color: "bg-blue-100 text-blue-800",
        icon: <FileText className="w-3 h-3" />,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    return configs[status as keyof typeof configs] || configs.ended;
  };

  const formatTimeLeft = (timeRemaining: number) => {
    if (timeRemaining <= 0) return "Ended";

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleViewListing = (id: number) => {
    // Navigate to auction details page
    window.open(`/auction/${id}`, "_blank");
  };

  const handleEditListing = (id: number) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Auction",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteListing = (id: number) => {
    // TODO: Implement delete functionality with confirmation
    toast({
      title: "Delete Auction",
      description: "Delete functionality will be implemented soon.",
      variant: "destructive",
    });
  };

  const handleAddImages = (id: number) => {
    // TODO: Implement image upload functionality
    toast({
      title: "Add Images",
      description: "Image upload functionality will be implemented soon.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your listings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>My Listings</span>
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Manage your auction items and track their performance
          </p>
          <Badge variant="outline">{listings.length} Total Listings</Badge>
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2 mt-4">
          {(() => {
            const statuses = [
              "all",
              "live",
              "pending",
              "sold",
              "ended",
              "draft",
              "cancelled",
            ];
            return statuses.map((status) => {
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              );
            });
          })()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {listings.map((listing) => {
            // images may be undefined, an array of strings or objects
            let primaryImage: any = null;
            if (Array.isArray(listing.images) && listing.images.length > 0) {
              primaryImage = listing.images[0];
            }
            let imageSrc = "/placeholder.svg";
            if (primaryImage) {
              if (typeof primaryImage === "string") {
                if (
                  primaryImage.startsWith("http://") ||
                  primaryImage.startsWith("https://")
                ) {
                  imageSrc = primaryImage;
                } else if (primaryImage.startsWith("/")) {
                  imageSrc = `http://localhost:8000${primaryImage}`;
                } else {
                  imageSrc = `http://localhost:8000/${primaryImage}`;
                }
              } else if (typeof primaryImage === "object") {
                const p =
                  primaryImage.image_url ||
                  primaryImage.file_path ||
                  primaryImage.image_path;
                if (p) {
                  if (p.startsWith("http://") || p.startsWith("https://"))
                    imageSrc = p;
                  else if (p.startsWith("/"))
                    imageSrc = `http://localhost:8000${p}`;
                  else imageSrc = `http://localhost:8000/${p}`;
                }
              }
            }
            const currentPrice = (listing.current_bid ?? 0) as number;
            const bidsCount = listing.bid_count ?? 0;
            const timeRemaining = listing.time_remaining ?? 0;
            const createdAt = listing.created_at
              ? new Date(listing.created_at).toLocaleDateString()
              : "";

            return (
              <div
                key={listing.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <img
                  src={imageSrc}
                  alt={listing.title}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg">{listing.title}</h3>
                    <Badge variant="outline">
                      {listing.category_name || listing.category}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <span>
                      Starting: Ksh{" "}
                      {Number(listing.starting_price || 0).toLocaleString()}
                    </span>
                    {listing.status === "sold" && listing.winning_amount ? (
                      <span className="font-medium text-purple-600">
                        Sold for: Ksh{" "}
                        {Number(listing.winning_amount).toLocaleString()}
                      </span>
                    ) : (
                      <span>
                        Current:{" "}
                        {currentPrice > 0
                          ? `Ksh ${currentPrice.toLocaleString()}`
                          : "No bids yet"}
                      </span>
                    )}
                    <span>Bids: {bidsCount}</span>
                    <span>
                      {listing.status === "live" || listing.status === "active"
                        ? `Time: ${formatTimeLeft(timeRemaining)}`
                        : listing.status === "pending"
                        ? "Awaiting approval"
                        : listing.status === "sold"
                        ? "Transaction complete"
                        : listing.status === "ended"
                        ? "Auction ended"
                        : listing.status === "draft"
                        ? "Not submitted"
                        : "Status: " + listing.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Created: {createdAt}
                    </span>
                    {listing.featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusBadge(listing.status).color}>
                    <div className="flex items-center space-x-1">
                      {getStatusBadge(listing.status).icon}
                      <span>{getStatusBadge(listing.status).label}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewListing(listing.id)}
                    title="View listing"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {/* Edit button - only for draft and pending auctions */}
                  {(listing.status === "draft" ||
                    listing.status === "pending") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditListing(listing.id)}
                      title="Edit listing"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Add images - only for active auctions and drafts */}
                  {(listing.status === "draft" ||
                    listing.status === "live" ||
                    listing.status === "active") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddImages(listing.id)}
                      title="Add images"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Delete - only for drafts and pending auctions */}
                  {(listing.status === "draft" ||
                    listing.status === "pending") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteListing(listing.id)}
                      title="Delete listing"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Special actions for sold items */}
                  {listing.status === "sold" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Transaction Details",
                          description:
                            "View payment and shipping details (coming soon)",
                        })
                      }
                      title="View transaction details"
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No{" "}
              {statusFilter === "all" ? "listings" : statusFilter + " auctions"}{" "}
              found
            </h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === "all" && "You haven't posted any auctions yet"}
              {statusFilter === "live" &&
                "You don't have any active auctions currently running"}
              {statusFilter === "pending" &&
                "No auctions awaiting admin approval"}
              {statusFilter === "sold" && "You haven't sold any items yet"}
              {statusFilter === "ended" &&
                "No auctions have ended without a sale"}
              {statusFilter === "draft" &&
                "No draft auctions found - complete drafts are automatically hidden"}
              {statusFilter === "cancelled" && "No cancelled auctions found"}
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/post-item")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Item
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingsTab;
