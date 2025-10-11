import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Eye,
  MapPin,
  Package,
  Gavel,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Edit,
  Save,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import { Auction } from "../../../services/api";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface ListingModalProps {
  auction: Auction | null;
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  onSave?: () => void;
}

interface AuctionDetails extends Auction {
  bids?: Array<{
    id: number;
    bidder_name: string;
    bid_amount: number;
    bid_time: string;
  }>;
  watchers?: Array<{
    id: number;
    user_name: string;
    added_at: string;
  }>;
  location?: string;
  shipping_available?: boolean;
  shipping_cost?: number | string;
}

const ListingModal: React.FC<ListingModalProps> = ({
  auction,
  open,
  onClose,
  editMode = false,
  onSave,
}) => {
  const [detailedAuction, setDetailedAuction] = useState<AuctionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(editMode);

  // Edit form state
  const [editDescription, setEditDescription] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch detailed auction information when modal opens
  useEffect(() => {
    if (open && auction) {
      fetchAuctionDetails();
      setIsEditing(editMode);
    }
  }, [open, auction, editMode]);

  // Initialize edit form when auction data is loaded
  useEffect(() => {
    if (detailedAuction && isEditing) {
      setEditDescription(detailedAuction.description || "");
      setNewImages([]);
      setImagesToRemove([]);
    }
  }, [detailedAuction, isEditing]);

  const fetchAuctionDetails = async () => {
    if (!auction) return;

    setLoading(true);
    try {
      // Fetch detailed auction information from API
      const response = await apiService.getAuctionDetails(auction.id);

      if (response.success && response.data) {
        // Ensure images is always an array
        const auctionData = {
          ...response.data,
          images: response.data.images || [],
          bids: response.data.bids || [],
          watchers: response.data.watchers || [],
        };

        console.log("📷 Fetched auction details with images:", {
          id: auctionData.id,
          primary_image: auctionData.primary_image,
          images: auctionData.images,
          imagesCount: auctionData.images.length,
        });

        setDetailedAuction(auctionData);
      } else {
        // Fallback to basic auction data if API call fails
        console.warn("Failed to fetch detailed auction data, using basic data");
        setDetailedAuction({
          ...auction,
          images: auction.images || [],
          bids: [],
          watchers: [],
        });
      }
    } catch (error) {
      console.error("Error fetching auction details:", error);
      // Fallback to basic auction data
      setDetailedAuction({
        ...auction,
        images: auction.images || [],
        bids: [],
        watchers: [],
      } as AuctionDetails);
    } finally {
      setLoading(false);
    }
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
        label: "Ended",
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

    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "N/A";
    return `Ksh ${Number(price).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setNewImages((prev) => [...prev, ...fileArray]);
    }
  };

  // Handle image removal
  const handleRemoveExistingImage = (imageUrl: string) => {
    setImagesToRemove((prev) => [...prev, imageUrl]);
  };

  // Handle new image removal (before upload)
  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Reset form when canceling edit
      setEditDescription(detailedAuction?.description || "");
      setNewImages([]);
      setImagesToRemove([]);
    }
    setIsEditing(!isEditing);
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!detailedAuction) return;

    setIsSaving(true);
    try {
      // Create FormData for the update request
      const formData = new FormData();
      formData.append("auction_id", detailedAuction.id.toString());
      formData.append("description", editDescription);

      // Add new images
      newImages.forEach((file, index) => {
        formData.append(`new_images[]`, file);
      });

      // Add images to remove (only if there are any)
      if (imagesToRemove.length > 0) {
        imagesToRemove.forEach((imageUrl, index) => {
          formData.append(`remove_images[]`, imageUrl);
        });
      }

      // Make API call to update auction
      console.log("Making API request to update auction:", detailedAuction.id);
      console.log(
        "New images to upload:",
        newImages.map((f) => f.name)
      );
      console.log("Images to remove:", imagesToRemove);
      // Get session token for authorization
      const sessionToken = localStorage.getItem("bidlode_session_token");
      const headers: Record<string, string> = {};

      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        "http://localhost:8000/auctions/update.php",
        {
          method: "POST",
          body: formData,
          credentials: "include",
          headers,
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Auction updated successfully",
        });

        // Refresh auction details
        await fetchAuctionDetails();

        // Exit edit mode
        setIsEditing(false);
        setNewImages([]);
        setImagesToRemove([]);

        // Call onSave callback if provided
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error(result.error || "Failed to update auction");
      }
    } catch (error) {
      console.error("Error updating auction:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        type: typeof error,
      });

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update auction",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare images array (filtered for removed images)
  const images = React.useMemo(() => {
    if (!detailedAuction) return [];

    const imageList: string[] = [];

    // First, add primary_image if available
    if (
      detailedAuction.primary_image &&
      !imagesToRemove.includes(detailedAuction.primary_image)
    ) {
      imageList.push(detailedAuction.primary_image);
    }

    // Then add images from images array
    if (detailedAuction.images && Array.isArray(detailedAuction.images)) {
      detailedAuction.images.forEach((img: any) => {
        let imageUrl = "";

        if (typeof img === "string") {
          imageUrl = img;
        } else if (typeof img === "object" && img !== null) {
          imageUrl =
            img.image_url || img.image_path || img.file_path || img.url || "";
        }

        // Only add if it's a valid URL, not already in the list, and not marked for removal
        if (
          imageUrl &&
          !imageList.includes(imageUrl) &&
          !imagesToRemove.includes(imageUrl)
        ) {
          imageList.push(imageUrl);
        }
      });
    }

    // Add fallback fields if no images found yet
    if (imageList.length === 0) {
      const fallbackFields = [
        detailedAuction.image_path,
        detailedAuction.image_url,
      ];

      for (const field of fallbackFields) {
        if (field && !imagesToRemove.includes(field)) {
          const imageUrl = field.startsWith("http")
            ? field
            : `http://localhost:8000${
                field.startsWith("/") ? "" : "/"
              }${field}`;
          if (!imageList.includes(imageUrl)) {
            imageList.push(imageUrl);
            break; // Only add the first fallback found
          }
        }
      }
    }

    return imageList.length > 0 ? imageList : ["/placeholder.svg"];
  }, [detailedAuction, imagesToRemove]);

  // Preview URLs for new images
  const newImagePreviews = React.useMemo(() => {
    return newImages.map((file) => URL.createObjectURL(file));
  }, [newImages]);

  // Combined images for display (existing + new)
  const allImages = React.useMemo(() => {
    return [...images, ...newImagePreviews];
  }, [images, newImagePreviews]);

  if (!auction || !detailedAuction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              {detailedAuction.title}
              {isEditing && (
                <Badge variant="secondary" className="ml-2">
                  <Edit className="w-3 h-3 mr-1" />
                  Editing
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              {/* Edit toggle button - only show for draft/pending auctions */}
              {(detailedAuction.status === "draft" ||
                detailedAuction.status === "pending") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditMode}
                  disabled={isSaving}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              )}
              <Badge className={getStatusBadge(detailedAuction.status).color}>
                <div className="flex items-center space-x-1">
                  {getStatusBadge(detailedAuction.status).icon}
                  <span>{getStatusBadge(detailedAuction.status).label}</span>
                </div>
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Images Section */}
            <div className="space-y-4">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={allImages[selectedImageIndex] || "/placeholder.svg"}
                  alt={detailedAuction.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                {/* Image remove button in edit mode */}
                {isEditing &&
                  allImages.length > 0 &&
                  allImages[selectedImageIndex] !== "/placeholder.svg" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        console.log(
                          "🗑️ Remove button clicked for image:",
                          allImages[selectedImageIndex]
                        );

                        // Double confirmation for removing existing images
                        const currentImage = allImages[selectedImageIndex];
                        if (!currentImage.startsWith("blob:")) {
                          if (
                            !window.confirm(
                              "Are you sure you want to remove this image? This action cannot be undone."
                            )
                          ) {
                            console.log("🗑️ User cancelled image removal");
                            return;
                          }
                        }

                        // Check if it's a new image (blob URL) or existing image
                        if (currentImage.startsWith("blob:")) {
                          // Remove from new images
                          const newImageIndex =
                            selectedImageIndex - images.length;
                          if (newImageIndex >= 0) {
                            console.log(
                              "🗑️ Removing new image at index:",
                              newImageIndex
                            );
                            handleRemoveNewImage(newImageIndex);
                          }
                        } else {
                          // Remove existing image
                          console.log(
                            "🗑️ Removing existing image:",
                            currentImage
                          );
                          handleRemoveExistingImage(currentImage);
                        }
                        // Adjust selected index if necessary
                        if (selectedImageIndex >= allImages.length - 1) {
                          setSelectedImageIndex(
                            Math.max(0, selectedImageIndex - 1)
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {/* Existing and new image thumbnails */}
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden relative ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${detailedAuction.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    {/* New image indicator */}
                    {isEditing && image.startsWith("blob:") && (
                      <Badge className="absolute -top-1 -right-1 text-xs bg-green-500">
                        New
                      </Badge>
                    )}
                  </button>
                ))}

                {/* Add image button in edit mode */}
                {isEditing && (
                  <label className="flex-shrink-0 w-16 h-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Plus className="w-6 h-6 text-gray-400" />
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Separator />

            {/* Auction Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                    {isEditing && (
                      <Badge variant="outline" className="text-xs">
                        Editable
                      </Badge>
                    )}
                  </h3>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter auction description..."
                      className="min-h-[100px] w-full"
                      maxLength={1000}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {detailedAuction.description || "No description provided"}
                    </p>
                  )}
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-1">
                      {editDescription.length}/1000 characters
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pricing Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Starting Price:</span>
                      <span className="font-medium">
                        {formatPrice(detailedAuction.starting_price)}
                      </span>
                    </div>
                    {detailedAuction.status === "sold" &&
                    detailedAuction.winning_amount ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sold For:</span>
                        <span className="font-medium text-purple-600">
                          {formatPrice(detailedAuction.winning_amount)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Bid:</span>
                        <span className="font-medium">
                          {detailedAuction.current_bid
                            ? formatPrice(detailedAuction.current_bid)
                            : "No bids yet"}
                        </span>
                      </div>
                    )}
                    {detailedAuction.reserve_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reserve Price:</span>
                        <span className="font-medium">
                          {formatPrice(detailedAuction.reserve_price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {detailedAuction.location && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <p className="text-gray-700">{detailedAuction.location}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Auction Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    {detailedAuction.start_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Time:</span>
                        <span className="font-medium">
                          {formatDate(detailedAuction.start_time)}
                        </span>
                      </div>
                    )}
                    {detailedAuction.end_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Time:</span>
                        <span className="font-medium">
                          {formatDate(detailedAuction.end_time)}
                        </span>
                      </div>
                    )}
                    {(detailedAuction.status === "live" ||
                      detailedAuction.status === "active") && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Remaining:</span>
                        <span className="font-medium text-green-600">
                          {formatTimeLeft(detailedAuction.time_remaining || 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {detailedAuction.created_at
                          ? formatDate(detailedAuction.created_at)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Engagement
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Bids:</span>
                      <span className="font-medium">
                        {detailedAuction.bid_count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Watchers:</span>
                      <span className="font-medium">
                        {detailedAuction.watcher_count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">
                        {detailedAuction.category_name ||
                          detailedAuction.category ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {detailedAuction.shipping_available && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Shipping
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Shipping Available:
                        </span>
                        <span className="font-medium text-green-600">Yes</span>
                      </div>
                      {detailedAuction.shipping_cost && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping Cost:</span>
                          <span className="font-medium">
                            {formatPrice(detailedAuction.shipping_cost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {isEditing && (
                  <>
                    <Button
                      variant="outline"
                      onClick={toggleEditMode}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Close
                </Button>
                {!isEditing && (
                  <Button
                    onClick={() => window.open(`/browse-auctions`, "_blank")}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Public Page
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ListingModal;
