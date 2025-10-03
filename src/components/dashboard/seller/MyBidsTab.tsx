import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyBidsTab: React.FC = () => {
  const [biddingStats, setBiddingStats] = useState({
    activeBids: 0,
    wonAuctions: 0,
    outbid: 0,
    totalBids: 0,
  });
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidInputs, setBidInputs] = useState<
    Record<number, { amount: number | ""; loading: boolean }>
  >({});
  const { toast } = useToast();
  const [withdrawDialogOpenFor, setWithdrawDialogOpenFor] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { apiService } = await import("@/services/api");
        const res = await apiService.getMyBids();
        if (res && res.success && res.data) {
          // Use buyer_bids (auctions the user has placed bids on)
          const buyer = res.data.buyer_bids || [];
          // Compute timeLeft and normalize some fields
          const nowTs = Date.now();
          const normalized = buyer.map((b: any) => {
            const endTs = b.end_time ? new Date(b.end_time).getTime() : nowTs;
            const timeRemaining = Math.max(
              0,
              Math.floor((endTs - nowTs) / 1000)
            );
            return {
              ...b,
              time_remaining: timeRemaining,
              timeLeft: formatTimeLeft(timeRemaining),
              current_bid: Number(b.current_bid || 0),
              bid_count: Number(b.bid_count || 0),
              my_bid: Number(b.my_bid || 0),
            };
          });

          setActiveBids(normalized);
          // Stats: active bids (auctions still active), won auctions (ended and my_bid >= current_bid), outbid (active and my_bid < current_bid), totalBids sum of auction bid_count
          const activeCount = normalized.filter(
            (s: any) => s.status === "active"
          ).length;
          const wonCount = normalized.filter(
            (s: any) =>
              s.status === "ended" && (s.my_bid || 0) >= (s.current_bid || 0)
          ).length;
          const outbidCount = normalized.filter(
            (s: any) =>
              s.status === "active" && (s.my_bid || 0) < (s.current_bid || 0)
          ).length;
          const totalBids = normalized.reduce(
            (sum: number, s: any) => sum + ((s.bid_count as number) || 0),
            0
          );

          setBiddingStats({
            activeBids: activeCount,
            wonAuctions: wonCount,
            outbid: outbidCount,
            totalBids: totalBids,
          });
        }
      } catch (err) {
        console.error("Failed to load seller bids", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    const onBidsChanged = () => fetch();
    if (typeof window !== "undefined" && (window as any).addEventListener) {
      window.addEventListener("bids:changed", onBidsChanged as EventListener);
    }
    return () => {
      if (
        typeof window !== "undefined" &&
        (window as any).removeEventListener
      ) {
        window.removeEventListener(
          "bids:changed",
          onBidsChanged as EventListener
        );
      }
    };
  }, []);

  const bidHistory: any[] = [];

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

  const getStatusBadge = (status: string) => {
    const configs = {
      leading: { label: "Leading", color: "bg-green-100 text-green-800" },
      outbid: { label: "Outbid", color: "bg-red-100 text-red-800" },
      won: { label: "Won", color: "bg-blue-100 text-blue-800" },
      lost: { label: "Lost", color: "bg-muted/20 text-muted-foreground" },
    };
    return configs[status as keyof typeof configs] || configs.lost;
  };

  const handleIncreaseBid = (bidId: number) => {
    console.log("Increase bid for:", bidId);
    // Handle bid increase logic
  };

  const handleViewItem = (bidId: number) => {
    console.log("View item for bid:", bidId);
    // Handle view item logic
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>My Bidding Activity</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track your bids, wins, and bidding history
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bidding Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {biddingStats.activeBids}
            </div>
            <div className="text-sm text-blue-600">Active Bids</div>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {biddingStats.wonAuctions}
            </div>
            <div className="text-sm text-green-600">Won Auctions</div>
          </div>
          <div className="bg-destructive/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {biddingStats.outbid}
            </div>
            <div className="text-sm text-red-600">Currently Outbid</div>
          </div>
          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {biddingStats.totalBids}
            </div>
            <div className="text-sm text-gray-600">Total Bids Placed</div>
          </div>
        </div>

        {/* Active Bids */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Bids</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left p-4 font-medium">Item</th>
                  <th className="text-left p-4 font-medium">Current</th>
                  <th className="text-left p-4 font-medium">Bids</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Time Left</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-4">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading &&
                  activeBids.map((bid) => (
                    <tr
                      key={bid.auction_id}
                      className="border-t hover:bg-muted/20"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{bid.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {bid.category_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        Ksh {(bid.current_bid || 0).toLocaleString()}
                      </td>
                      <td className="p-4">{bid.bid_count ?? 0}</td>
                      <td className="p-4">{bid.status}</td>
                      <td className="p-4">{bid.timeLeft || ""}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {bid.status === "active" ? (
                            <>
                              <input
                                type="number"
                                min={Math.max(
                                  (bid.current_bid || 0) + 100,
                                  (bid.my_bid || 0) + 100
                                )}
                                step={100}
                                value={bidInputs[bid.auction_id]?.amount ?? ""}
                                onChange={(e) => {
                                  const v =
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value);
                                  setBidInputs((prev) => ({
                                    ...prev,
                                    [bid.auction_id]: {
                                      ...(prev[bid.auction_id] || {
                                        amount: "",
                                        loading: false,
                                      }),
                                      amount: v,
                                    },
                                  }));
                                }}
                                className="border rounded px-2 py-1 w-28"
                                placeholder={`Ksh ${Math.max(
                                  (bid.current_bid || 0) + 100,
                                  (bid.my_bid || 0) + 100
                                ).toLocaleString()}`}
                              />
                              <button
                                className="px-3 py-1 rounded border text-sm bg-primary/5"
                                onClick={async () => {
                                  const entry = bidInputs[bid.auction_id] || {
                                    amount: "",
                                  };
                                  const amount = Number(entry.amount || 0);
                                  if (
                                    !amount ||
                                    amount <= (bid.current_bid || 0)
                                  ) {
                                    alert(
                                      "Enter an amount higher than the current bid"
                                    );
                                    return;
                                  }
                                  setBidInputs((prev) => ({
                                    ...prev,
                                    [bid.auction_id]: {
                                      ...(prev[bid.auction_id] || { amount }),
                                      loading: true,
                                    },
                                  }));
                                  try {
                                    const { apiService } = await import(
                                      "@/services/api"
                                    );
                                    const res = await apiService.placeBid(
                                      bid.auction_id,
                                      amount
                                    );
                                    if (res && res.success) {
                                      // Refresh via event
                                      try {
                                        (window as any).dispatchEvent(
                                          new CustomEvent("bids:changed")
                                        );
                                      } catch (_) {}
                                      alert("Bid placed successfully");
                                    } else {
                                      alert(
                                        res.error ||
                                          res.message ||
                                          "Failed to place bid"
                                      );
                                    }
                                  } catch (err) {
                                    console.error("Place bid error", err);
                                    alert("Failed to place bid");
                                  } finally {
                                    setBidInputs((prev) => ({
                                      ...prev,
                                      [bid.auction_id]: {
                                        ...(prev[bid.auction_id] || {
                                          amount: "",
                                        }),
                                        loading: false,
                                      },
                                    }));
                                  }
                                }}
                              >
                                Place Bid
                              </button>
                              <AlertDialog
                                open={withdrawDialogOpenFor === bid.auction_id}
                                onOpenChange={(open) =>
                                  setWithdrawDialogOpenFor(
                                    open ? bid.auction_id : null
                                  )
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Withdraw Bid
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to withdraw your bid
                                      for "{bid.title}"? This will remove your
                                      active bid from the auction.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Keep Bid
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        try {
                                          const resp = await fetch(
                                            "/withdraw-bid.php",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                auction_id: bid.auction_id,
                                              }),
                                            }
                                          );
                                          const data = await resp.json();
                                          if (resp.ok && data.success) {
                                            try {
                                              (window as any).dispatchEvent(
                                                new CustomEvent("bids:changed")
                                              );
                                            } catch (_) {}
                                            toast({
                                              title: "Bid withdrawn",
                                              description:
                                                "Your bid was removed",
                                            });
                                            setBidInputs((prev) => {
                                              const p = { ...prev };
                                              delete p[bid.auction_id];
                                              return p;
                                            });
                                          } else {
                                            toast({
                                              title: "Withdraw failed",
                                              description:
                                                data.message ||
                                                "Could not withdraw bid",
                                            });
                                          }
                                        } catch (err) {
                                          console.error(
                                            "Withdraw bid error",
                                            err
                                          );
                                          toast({
                                            title: "Network error",
                                            description:
                                              "Failed to withdraw bid",
                                          });
                                        } finally {
                                          setWithdrawDialogOpenFor(null);
                                        }
                                      }}
                                    >
                                      Withdraw
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewItem(bid.auction_id)}
                            >
                              View Item
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bid History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Bid History</h3>
          <div className="space-y-3">
            {bidHistory.map((bid) => (
              <Card key={bid.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{bid.item}</h4>
                    <p className="text-sm text-gray-600">{bid.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm text-gray-600">My bid:</span>
                      <span className="font-medium">
                        Ksh {bid.finalBid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">
                        Winning bid:
                      </span>
                      <span className="font-medium">
                        Ksh {(Number(bid.winning_amount) || 0).toLocaleString()}
                      </span>
                    </div>
                    <Badge className={getStatusBadge(bid.status).color}>
                      {getStatusBadge(bid.status).label}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty States */}
        {activeBids.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No active bids
            </h3>
            <p className="text-muted-foreground mb-4">
              Start bidding on auctions to track your activity here
            </p>
            <Button>Browse Auctions</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyBidsTab;
