import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Auction } from "../../../services/api";
import { apiService } from "@/services/api";

interface ListingModalProps {
  auction: Auction | null;
  open: boolean;
  onClose: () => void;
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
}) => {
  const [detailedAuction, setDetailedAuction] = useState<AuctionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch detailed auction information when modal opens
  useEffect(() => {
    if (open && auction) {
      fetchAuctionDetails();
    }
  }, [open, auction]);

  const fetchAuctionDetails = async () => {
    if (!auction) return;

    setLoading(true);
    try {
      // You can extend this to fetch more detailed information
      // For now, we'll use the basic auction data
      setDetailedAuction({
        ...auction,
        bids: [], // This would come from an API call
        watchers: [], // This would come from an API call
      });
    } catch (error) {
      console.error("Error fetching auction details:", error);
      // Fallback to basic auction data
      setDetailedAuction(auction as AuctionDetails);
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

  // Prepare images array
  const images = React.useMemo(() => {
    if (!detailedAuction) return [];

    const imageList = [];

    // Add image_path if available
    if (detailedAuction.image_path) {
      const imageUrl = detailedAuction.image_path.startsWith("http")
        ? detailedAuction.image_path
        : `http://localhost:8000${
            detailedAuction.image_path.startsWith("/") ? "" : "/"
          }${detailedAuction.image_path}`;
      imageList.push(imageUrl);
    }

    // Add image_url if available
    if (detailedAuction.image_url) {
      const imageUrl = detailedAuction.image_url.startsWith("http")
        ? detailedAuction.image_url
        : `http://localhost:8000${
            detailedAuction.image_url.startsWith("/") ? "" : "/"
          }${detailedAuction.image_url}`;
      if (!imageList.includes(imageUrl)) {
        imageList.push(imageUrl);
      }
    }

    // Add images from images array
    if (detailedAuction.images && Array.isArray(detailedAuction.images)) {
      detailedAuction.images.forEach((img: any) => {
        let imageUrl = "";
        if (typeof img === "string") {
          imageUrl = img.startsWith("http")
            ? img
            : `http://localhost:8000${img.startsWith("/") ? "" : "/"}${img}`;
        } else if (typeof img === "object" && img !== null) {
          const url =
            img.image_url || img.image_path || img.file_path || img.url;
          if (url) {
            imageUrl = url.startsWith("http")
              ? url
              : `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`;
          }
        }
        if (imageUrl && !imageList.includes(imageUrl)) {
          imageList.push(imageUrl);
        }
      });
    }

    return imageList.length > 0 ? imageList : ["/placeholder.svg"];
  }, [detailedAuction]);

  if (!auction || !detailedAuction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              {detailedAuction.title}
            </span>
            <Badge className={getStatusBadge(detailedAuction.status).color}>
              <div className="flex items-center space-x-1">
                {getStatusBadge(detailedAuction.status).icon}
                <span>{getStatusBadge(detailedAuction.status).label}</span>
              </div>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Images Section */}
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[selectedImageIndex]}
                  alt={detailedAuction.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
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
                    </button>
                  ))}
                </div>
              )}
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
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {detailedAuction.description || "No description provided"}
                  </p>
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
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() =>
                  window.open(`/auction/${detailedAuction.id}`, "_blank")
                }
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Public Page
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ListingModal;
