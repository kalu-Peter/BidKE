import React, { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye } from "lucide-react";

const WatchlistTab: React.FC = () => {
  const { user } = useAuth();
  // Live watchlist state
  const [watchlistItems, setWatchlistItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiService.getWatchlist(user?.id);
        if (!mounted) return;
        if (res.success && Array.isArray(res.data)) {
          const items = res.data.map((d: any) => ({
            id: Number(d.auction_id),
            title: d.title || d.auction_title || `Auction #${d.auction_id}`,
            category: d.category_name || d.category || "",
            currentBid: d.current_bid ?? d.current_price ?? 0,
            bids: d.bid_count ?? 0,
            timeLeft: d.time_remaining
              ? `${Math.floor(d.time_remaining / 3600)}h`
              : "",
            seller: d.seller_name || d.seller || "",
            image:
              d.primary_image && d.primary_image.startsWith("http")
                ? d.primary_image
                : `http://localhost:8000${
                    d.primary_image || d.image_path || "/placeholder.svg"
                  }`,
            addedDate: d.added_at || d.added_date || null,
          }));
          setWatchlistItems(items);
        } else {
          setWatchlistItems([]);
        }
      } catch (err) {
        console.error("Failed to load watchlist:", err);
        setWatchlistItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Refresh when watchlist changes elsewhere in the app
    const onChange = async (e: any) => {
      try {
        const res = await apiService.getWatchlist(user?.id);
        if (res.success && Array.isArray(res.data)) {
          const items = res.data.map((d: any) => ({
            id: Number(d.auction_id),
            title: d.title || d.auction_title || `Auction #${d.auction_id}`,
            category: d.category_name || d.category || "",
            currentBid: d.current_bid ?? d.current_price ?? 0,
            bids: d.bid_count ?? 0,
            timeLeft: d.time_remaining
              ? `${Math.floor(d.time_remaining / 3600)}h`
              : "",
            seller: d.seller_name || d.seller || "",
            image:
              d.primary_image && d.primary_image.startsWith("http")
                ? d.primary_image
                : `http://localhost:8000${
                    d.primary_image || d.image_path || "/placeholder.svg"
                  }`,
            addedDate: d.added_at || d.added_date || null,
          }));
          setWatchlistItems(items);
        } else {
          setWatchlistItems([]);
        }
      } catch (err) {
        console.error("Failed to refresh watchlist on change event:", err);
        setWatchlistItems([]);
      }
    };
    window.addEventListener("watchlist:changed", onChange as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener(
        "watchlist:changed",
        onChange as EventListener
      );
    };
  }, []);

  const handleRemoveFromWatchlist = async (itemId: number) => {
    const prev = watchlistItems;
    setWatchlistItems(prev ? prev.filter((i) => i.id !== itemId) : prev);
    try {
      const res = await apiService.removeFromWatchlist(itemId, user?.id);
      if (!res.success)
        throw new Error(
          res.message || res.error || "Failed to remove from watchlist"
        );
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
      setWatchlistItems(prev ?? []);
    }
  };

  const handlePlaceBid = (itemId: number) => {
    console.log("Place bid on item:", itemId);
    // Handle place bid logic (navigate or open bid modal)
  };

  const handleViewDetails = (itemId: number) => {
    console.log("View details for item:", itemId);
    // Handle view details logic
  };

  const getTimeLeftColor = (timeLeft: string) => {
    if (timeLeft.includes("h") && !timeLeft.includes("d")) {
      const hours = parseInt(timeLeft.split("h")[0]);
      if (hours < 12) return "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5" />
          <span>My Watchlist</span>
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Items you're watching and considering to bid on
          </p>
          <Badge variant="outline">
            {(watchlistItems || []).length} Items Watched
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {(watchlistItems || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlistItems.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    Active
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 left-2 bg-card/90 hover:bg-card"
                    onClick={() => handleRemoveFromWatchlist(item.id)}
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="text-xs text-muted-foreground">
                        <span>
                          {item.category} • {item.seller}
                        </span>
                        <span>Added {item.addedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-lg font-bold text-green-600">
                      Ksh {item.currentBid.toLocaleString()}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{item.bids} bids</span>
                      <span className={getTimeLeftColor(item.timeLeft)}>
                        {item.timeLeft} left
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePlaceBid(item.id)}
                    >
                      Place Bid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No items in watchlist
            </h3>
            <p className="text-muted-foreground mb-4">
              Start exploring auctions and add items to your watchlist
            </p>
            <Button>Browse Auctions</Button>
          </div>
        )}

        {/* Watchlist Stats */}
        {(watchlistItems || []).length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(watchlistItems || []).length}
                </div>
                <div className="text-sm text-gray-600">Items Watched</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {
                    watchlistItems.filter(
                      (item) =>
                        item.timeLeft.includes("h") &&
                        !item.timeLeft.includes("d")
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Ending Soon</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  Ksh{" "}
                  {Math.round(
                    watchlistItems.reduce(
                      (sum, item) => sum + item.currentBid,
                      0
                    ) / 1000
                  )}
                  K
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </Card>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Watchlist Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Get notified when items you're watching are ending soon</li>
            <li>• Monitor price changes and bidding activity</li>
            <li>• Quick access to place bids on items you're interested in</li>
            <li>
              • Remove items from watchlist if you're no longer interested
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistTab;
