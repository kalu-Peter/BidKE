import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Clock, Eye, X, Bell, Search } from "lucide-react";

const WatchlistTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();

  // Live watchlist state (loaded from API)
  const [watchlistItems, setWatchlistItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const filteredWatchlist = (watchlistItems || []).filter(
    (item: any) =>
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.seller || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiService.getWatchlist(user?.id);
        if (!mounted) return;
        if (res.success && Array.isArray(res.data)) {
          // Map backend shape to UI-friendly shape if necessary
          const items = res.data.map((d: any) => ({
            id: Number(d.auction_id),
            title: d.title || d.auction_title || `Auction #${d.auction_id}`,
            seller: d.seller_name || d.seller || "Unknown",
            currentBid: d.current_bid ?? d.current_price ?? 0,
            timeLeft: d.time_remaining
              ? `${Math.floor(d.time_remaining / 3600)}h`
              : "",
            category: d.category_name || d.category || "",
            bidsCount: d.bid_count ?? 0,
            addedDate: d.added_at || d.added_date || null,
            priceWhenAdded: d.price_when_added || 0,
            priceChange:
              (d.current_price ?? d.current_bid ?? 0) -
              (d.price_when_added ?? 0),
            image:
              d.primary_image && d.primary_image.startsWith("http")
                ? d.primary_image
                : `http://localhost:8000${
                    d.primary_image || d.image_path || "/placeholder.svg"
                  }`,
            notifications: !!d.notifications,
            endingSoon: !!(d.time_remaining && d.time_remaining < 3600 * 24),
          }));

          // Set initial items
          setWatchlistItems(items);

          // Refresh when watchlist changes elsewhere in the app
          const onChange = async (e: any) => {
            try {
              const res2 = await apiService.getWatchlist(user?.id);
              if (!mounted) return;
              if (res2.success && Array.isArray(res2.data)) {
                const updated = res2.data.map((d: any) => ({
                  id: Number(d.auction_id),
                  title:
                    d.title || d.auction_title || `Auction #${d.auction_id}`,
                  seller: d.seller_name || d.seller || "Unknown",
                  currentBid: d.current_bid ?? d.current_price ?? 0,
                  timeLeft: d.time_remaining
                    ? `${Math.floor(d.time_remaining / 3600)}h`
                    : "",
                  category: d.category_name || d.category || "",
                  bidsCount: d.bid_count ?? 0,
                  addedDate: d.added_at || d.added_date || null,
                  priceWhenAdded: d.price_when_added || 0,
                  priceChange:
                    (d.current_price ?? d.current_bid ?? 0) -
                    (d.price_when_added ?? 0),
                  image:
                    d.primary_image && d.primary_image.startsWith("http")
                      ? d.primary_image
                      : `http://localhost:8000${
                          d.primary_image || d.image_path || "/placeholder.svg"
                        }`,
                  notifications: !!d.notifications,
                  endingSoon: !!(
                    d.time_remaining && d.time_remaining < 3600 * 24
                  ),
                }));

                setWatchlistItems(updated);
              } else {
                setWatchlistItems([]);
              }
            } catch (err) {
              console.error("Failed to refresh watchlist after change:", err);
            }
          };

          window.addEventListener(
            "watchlist:changed",
            onChange as EventListener
          );
        }
      } catch (err) {
        console.error("Failed to load watchlist:", err);
        setWatchlistItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.removeEventListener(
        "watchlist:changed",
        (window as any).onChange as EventListener
      );
    };
  }, []);

  const handleRemoveFromWatchlist = async (itemId: number) => {
    // Optimistic removal
    const prev = watchlistItems;
    setWatchlistItems(prev ? prev.filter((i) => i.id !== itemId) : prev);
    try {
      const res = await apiService.removeFromWatchlist(itemId, user?.id);
      if (!res.success) {
        throw new Error(
          res.message || res.error || "Failed to remove from watchlist"
        );
      }
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
      // Rollback
      setWatchlistItems(prev ?? []);
    }
  };

  const handleToggleNotifications = (itemId: number) => {
    console.log("Toggle notifications for:", itemId);
    // Placeholder - notifications API not implemented yet
  };

  const handlePlaceBid = (itemId: number) => {
    console.log("Place bid on:", itemId);
    // Handle bid placement logic
  };

  const handleViewDetails = (itemId: number) => {
    console.log("View details for:", itemId);
    // Handle view details logic - e.g. navigate to /auction/:id
  };

  const getPriceChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <span className="text-red-600 text-sm font-medium">
          +Ksh {change.toLocaleString()}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-green-600 text-sm font-medium">
          -Ksh {Math.abs(change).toLocaleString()}
        </span>
      );
    }
    return <span className="text-gray-500 text-sm">No change</span>;
  };

  // Statistics
  const totalItems = (watchlistItems || []).length;
  const endingSoonCount = (watchlistItems || []).filter(
    (item: any) => item.endingSoon
  ).length;
  const avgPriceIncrease =
    (watchlistItems || []).length > 0
      ? (watchlistItems || []).reduce(
          (sum: number, item: any) => sum + (item.priceChange || 0),
          0
        ) / (watchlistItems || []).length
      : 0;
  const notificationsEnabled = (watchlistItems || []).filter(
    (item: any) => item.notifications
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5" />
          <span>My Watchlist</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Keep track of interesting auctions and get notified about price
          changes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Watchlist Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Watched Items</p>
                <p className="text-2xl font-bold text-purple-800">
                  {totalItems}
                </p>
              </div>
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Ending Soon</p>
                <p className="text-2xl font-bold text-red-800">
                  {endingSoonCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Notifications On</p>
                <p className="text-2xl font-bold text-blue-800">
                  {notificationsEnabled}
                </p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Avg. Price Change</p>
                <p className="text-lg font-bold text-green-800">
                  {avgPriceIncrease >= 0 ? "+" : ""}Ksh{" "}
                  {avgPriceIncrease.toLocaleString()}
                </p>
              </div>
              <Search className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-red-50"
            onClick={() => setSearchTerm("ending soon")}
          >
            Ending Soon ({endingSoonCount})
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-blue-50"
            onClick={() => setSearchTerm("electronics")}
          >
            Electronics
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-green-50"
            onClick={() => setSearchTerm("cars")}
          >
            Cars
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-purple-50"
            onClick={() => setSearchTerm("motorbikes")}
          >
            Motorbikes
          </Badge>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-4">
          {filteredWatchlist.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                <div className="w-full lg:w-32 h-24 flex-shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                  />
                  {item.endingSoon && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                      Ending Soon!
                    </Badge>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-500">by {item.seller}</p>
                      <Badge variant="outline" className="mt-1 w-fit">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.timeLeft}
                      </div>
                    </div>
                  </div>

                  {/* Price Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Current</p>
                      <p className="font-bold text-green-600">
                        Ksh {item.currentBid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">When Added</p>
                      <p className="font-medium text-gray-700">
                        Ksh {item.priceWhenAdded.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price Change</p>
                      {getPriceChangeIndicator(item.priceChange)}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                    <span>{item.bidsCount} bids</span>
                    <span>
                      Added on {new Date(item.addedDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center">
                      <Bell
                        className={`w-4 h-4 mr-1 ${
                          item.notifications ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span>
                        {item.notifications
                          ? "Notifications On"
                          : "Notifications Off"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handlePlaceBid(item.id)}>
                      Place Bid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleNotifications(item.id)}
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      {item.notifications ? "Disable" : "Enable"} Alerts
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveFromWatchlist(item.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  {/* Ending Soon Alert */}
                  {item.endingSoon && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-red-600 mr-2" />
                        <p className="text-sm text-red-800">
                          This auction is ending soon! Only {item.timeLeft}{" "}
                          remaining.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price Increase Alert */}
                  {item.priceChange > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <Search className="w-4 h-4 text-amber-600 mr-2" />
                        <p className="text-sm text-amber-800">
                          Price has increased by Ksh{" "}
                          {item.priceChange.toLocaleString()} since you added it
                          to watchlist.
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
        {filteredWatchlist.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No items in watchlist
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No items match your search criteria"
                : "Start watching auctions to track their progress"}
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              {searchTerm ? "Clear Search" : "Browse Auctions"}
            </Button>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Watchlist Tips:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Enable notifications to get alerts when prices change</li>
            <li>• Items ending soon are highlighted for quick action</li>
            <li>
              • Track price changes since you added items to your watchlist
            </li>
            <li>• You can watch up to 50 items at once</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistTab;
