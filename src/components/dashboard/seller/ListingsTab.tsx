import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Auction } from "../../../services/api";
import { toast } from "@/hooks/use-toast";
import ListingModal from "./ListingModal";

const ListingsTab: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [selectedListing, setSelectedListing] = useState<Auction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedImagePreview, setExpandedImagePreview] = useState<
    number | null
  >(null);

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

    // Update URL parameters
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
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

  // Helper function to get all images for a listing with primary image first
  const getAllImages = (listing: Auction) => {
    const images = [];
    let primaryImage = null;

    // Check for primary image from API response
    if (listing.primary_image) {
      primaryImage = listing.primary_image;
    }

    // Add images from images array
    if (Array.isArray(listing.images)) {
      listing.images.forEach((img: any) => {
        let imageUrl = "";
        if (typeof img === "string") {
          imageUrl = img.startsWith("http")
            ? img
            : `http://localhost:8000${img.startsWith("/") ? "" : "/"}${img}`;
        } else if (typeof img === "object" && img !== null) {
          const url =
            img.image_url || img.file_path || img.image_path || img.url;
          if (url) {
            imageUrl = url.startsWith("http")
              ? url
              : `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`;
          }
        }
        if (imageUrl && !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      });
    }

    // Fallback: try image_path and image_url if no images array
    if (images.length === 0) {
      if (listing.image_path) {
        const imageUrl = listing.image_path.startsWith("http")
          ? listing.image_path
          : `http://localhost:8000${
              listing.image_path.startsWith("/") ? "" : "/"
            }${listing.image_path}`;
        images.push(imageUrl);
      }

      if (listing.image_url && !images.includes(listing.image_url)) {
        const imageUrl = listing.image_url.startsWith("http")
          ? listing.image_url
          : `http://localhost:8000${
              listing.image_url.startsWith("/") ? "" : "/"
            }${listing.image_url}`;
        images.push(imageUrl);
      }
    }

    // If we have a primary image, make sure it's first in the array
    if (primaryImage && images.length > 0) {
      const primaryIndex = images.indexOf(primaryImage);
      if (primaryIndex > 0) {
        // Move primary to front
        images.splice(primaryIndex, 1);
        images.unshift(primaryImage);
      } else if (primaryIndex === -1 && primaryImage !== "/placeholder.svg") {
        // Add primary to front if not in array
        images.unshift(primaryImage);
      }
    }

    return images.length > 0 ? images : ["/placeholder.svg"];
  };

  const handleViewListing = (id: number) => {
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      setSelectedListing(listing);
      setIsEditMode(false);
      setIsModalOpen(true);
    }
  };

  const handleEditListing = (id: number) => {
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      setSelectedListing(listing);
      setIsEditMode(true);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
    setIsEditMode(false);
  };

  const handleSaveListing = () => {
    // Refresh listings after save
    const fetchListings = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await apiService.getSellerAuctions({
          sellerId: user.id,
          status: statusFilter,
          page: currentPage,
          limit: 10,
        });

        if (response.success && response.data) {
          setListings(response.data.auctions || []);
          setTotalPages(response.data.pagination?.pages || 1);
        }
      } catch (err) {
        console.error("Error refreshing listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  };

  const handleDeleteListing = (id: number) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing) return;

    // Confirm deletion
    if (
      window.confirm(
        `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`
      )
    ) {
      deleteAuction(id);
    }
  };

  const deleteAuction = async (id: number) => {
    try {
      // Get session token for authorization
      const sessionToken = localStorage.getItem("bidlode_session_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:8000/auctions/delete.php/${id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers,
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Auction deleted successfully",
        });

        // Remove from local state
        setListings((prev) => prev.filter((listing) => listing.id !== id));
      } else {
        throw new Error(result.error || "Failed to delete auction");
      }
    } catch (error) {
      console.error("Error deleting auction:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete auction",
        variant: "destructive",
      });
    }
  };

  const handleAddImages = (id: number) => {
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      setSelectedListing(listing);
      setIsEditMode(true);
      setIsModalOpen(true);
    }
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
            const allImages = getAllImages(listing);
            const primaryImage = allImages[0];
            const currentPrice = (listing.current_bid ?? 0) as number;
            const bidsCount = listing.bid_count ?? 0;
            const timeRemaining = listing.time_remaining ?? 0;
            const createdAt = listing.created_at
              ? new Date(listing.created_at).toLocaleDateString()
              : "";

            return (
              <div
                key={listing.id}
                className="border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 p-4">
                  <div className="relative group">
                    <img
                      src={primaryImage}
                      alt={listing.title}
                      className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                      onClick={() => handleViewListing(listing.id)}
                    />

                    {/* Show image count if there are multiple images */}
                    {allImages.length > 1 &&
                      allImages[0] !== "/placeholder.svg" && (
                        <Badge
                          className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs"
                          variant="default"
                        >
                          +{allImages.length - 1}
                        </Badge>
                      )}

                    {/* Show no image indicator if there are no images */}
                    {allImages.length === 1 &&
                      allImages[0] === "/placeholder.svg" && (
                        <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                    {/* Hover overlay for quick actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white hover:bg-opacity-20 p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewListing(listing.id);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {(listing.status === "draft" ||
                          listing.status === "pending") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white hover:bg-opacity-20 p-1 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditListing(listing.id);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
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
                        {listing.status === "live" ||
                        listing.status === "active"
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

                      {/* Image count indicator */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ImageIcon className="w-3 h-3" />
                        <span>
                          {allImages.length > 0 &&
                          allImages[0] !== "/placeholder.svg"
                            ? allImages.length
                            : 0}{" "}
                          image{allImages.length !== 1 ? "s" : ""}
                        </span>
                        {allImages.length > 1 &&
                          allImages[0] !== "/placeholder.svg" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs p-0 h-auto text-blue-600 hover:text-blue-700"
                              onClick={() =>
                                setExpandedImagePreview(
                                  expandedImagePreview === listing.id
                                    ? null
                                    : listing.id
                                )
                              }
                            >
                              {expandedImagePreview === listing.id
                                ? "Hide"
                                : "Show"}{" "}
                              gallery
                            </Button>
                          )}
                      </div>
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

                    {/* Manage images - only for active auctions and drafts */}
                    {(listing.status === "draft" ||
                      listing.status === "live" ||
                      listing.status === "active") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddImages(listing.id)}
                        title="Manage images"
                        className="flex items-center gap-1"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs">
                          {allImages.length > 0 &&
                          allImages[0] !== "/placeholder.svg"
                            ? allImages.length
                            : 0}
                        </span>
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

                {/* Expanded Image Gallery */}
                {expandedImagePreview === listing.id &&
                  allImages.length > 1 &&
                  allImages[0] !== "/placeholder.svg" && (
                    <div className="px-4 pb-4">
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3 text-gray-700">
                          All Images ({allImages.length})
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {allImages.map((image, index) => (
                            <div
                              key={index}
                              className="relative aspect-square bg-gray-100 rounded overflow-hidden group cursor-pointer"
                              onClick={() => handleViewListing(listing.id)}
                            >
                              <img
                                src={image}
                                alt={`${listing.title} - Image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder.svg";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Listing Details Modal */}
      <ListingModal
        auction={selectedListing}
        open={isModalOpen}
        onClose={handleCloseModal}
        editMode={isEditMode}
        onSave={handleSaveListing}
      />
    </Card>
  );
};

export default ListingsTab;
