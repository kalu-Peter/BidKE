import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Receipt, Eye } from "lucide-react";

const WonAuctionsTab: React.FC = () => {
  const [wonAuctions, setWonAuctions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [detailAuction, setDetailAuction] = React.useState<any | null>(null);
  const [modalImage, setModalImage] = React.useState<string | null>(null);

  const normalizeUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    try {
      const scheme = window.location.protocol.replace(":", "");
      const host = window.location.host;
      return `${scheme}://${host}/${url.replace(/^\//, "")}`;
    } catch (_err) {
      return url;
    }
  };

  const cacheKey = "wonAuctions_primary_images_v1";

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    import("@/services/api").then(async ({ apiService }) => {
      try {
        const res = await apiService.getWonAuctions();
        if (!mounted) return;
        setLoading(false);
        if (res && res.success && res.data) {
          const rows = res.data as any[];

          let cache: Record<string, string | null> = {};
          try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) cache = JSON.parse(raw);
          } catch (_e) {
            cache = {};
          }

          // Start with whatever the list provides, but prefer cache when available
          let items = rows.map((r) => {
            const id = String(r.id ?? r.auction_id ?? "");
            const provided =
              r.primary_image || r.primaryImage || r.image || null;
            const cached = cache[id] ?? null;
            return { ...r, primary_image: cached || provided };
          });

          // For items missing primary_image, fetch auction detail (limited batch)
          const missing = items.filter((i) => !i.primary_image).slice(0, 10);
          if (missing.length > 0) {
            await Promise.all(
              missing.map(async (m) => {
                try {
                  const det = await apiService.getAuction(Number(m.id));
                  if (det && det.success && det.data) {
                    const img = (det.data as any).images?.[0] || null;
                    const norm = normalizeUrl(img);
                    m.primary_image = norm;
                    const id = String(m.id ?? m.auction_id ?? "");
                    cache[id] = norm;
                  }
                } catch (_e) {
                  // ignore per-item failures
                }
              })
            );

            // Persist cache
            try {
              localStorage.setItem(cacheKey, JSON.stringify(cache));
            } catch (_e) {
              // ignore storage failures
            }
          }

          items = items.map((it) => ({
            ...it,
            primary_image: normalizeUrl(it.primary_image),
          }));

          if (!mounted) return;
          setWonAuctions(items);
        } else {
          setWonAuctions([]);
        }
      } catch (_err) {
        if (!mounted) return;
        setLoading(false);
        setWonAuctions([]);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load modal image when detailAuction opens
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!detailAuction) {
        setModalImage(null);
        return;
      }

      const id = String(detailAuction.id ?? detailAuction.auction_id ?? "");

      let cache: Record<string, string | null> = {};
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) cache = JSON.parse(raw);
      } catch (_e) {
        cache = {};
      }

      const cached = cache[id] ?? null;
      if (cached) {
        if (!mounted) return;
        setModalImage(normalizeUrl(cached));
        return;
      }

      // If the detailAuction already contains a primary_image, use it
      const provided =
        detailAuction.primary_image || detailAuction.image || null;
      if (provided) {
        const n = normalizeUrl(provided);
        cache[id] = n;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch (_e) {}
        if (!mounted) return;
        setModalImage(n);
        return;
      }

      // Fetch auction details for image
      try {
        const { apiService } = await import("@/services/api");
        const det = await apiService.getAuction(Number(id));
        if (det && det.success && det.data) {
          const img = (det.data as any).images?.[0] || null;
          const norm = normalizeUrl(img);
          cache[id] = norm;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cache));
          } catch (_e) {}
          if (!mounted) return;
          setModalImage(norm);
        }
      } catch (_e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [detailAuction]);

  const getStatusConfig = (status: string) => {
    const configs = {
      payment_pending: {
        label: "Payment Pending",
        color: "bg-yellow-100 text-yellow-800",
        description: "Complete payment to secure your item",
      },
      paid: {
        label: "Paid",
        color: "bg-blue-100 text-blue-800",
        description: "Payment confirmed, ready for collection",
      },
      collected: {
        label: "Collected",
        color: "bg-green-100 text-green-800",
        description: "Item successfully collected",
      },
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
  const pendingPayment = wonAuctions.filter(
    (a) => a.status === "payment_pending"
  ).length;
  const totalSpent = wonAuctions
    .filter((a) => a.status !== "payment_pending")
    .reduce((sum, auction) => sum + (Number(auction.winning_amount) || 0), 0);

  // Helper to format the canonical `winning_amount` field returned by the API
  const formatWinningAmount = (auction: any) => {
    const raw = auction.winning_amount;
    if (raw === null || raw === undefined) return "—";
    const n = typeof raw === "number" ? raw : Number(raw);
    if (isNaN(n)) return String(raw);
    return n.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Won Auctions</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Auctions you've successfully won and payment details
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Won Auctions Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalWon}</div>
            <div className="text-sm text-green-600">Total Won</div>
          </div>
          <div className="bg-yellow-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPayment}
            </div>
            <div className="text-sm text-yellow-600">Pending Payment</div>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              Ksh {Math.round(totalSpent / 1000)}K
            </div>
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
                <Card
                  key={auction.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={auction.primary_image || auction.image}
                        alt={auction.title}
                        className="w-16 h-16 rounded object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.src = "/placeholder.svg";
                        }}
                      />
                      <div>
                        <h4 className="font-semibold text-lg">
                          {auction.title}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{auction.category}</p>
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
                        Ksh {formatWinningAmount(auction)}
                      </div>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1 max-w-48">
                        {statusConfig.description}
                      </p>
                      {auction.status === "payment_pending" && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⏰ {auction.paymentDeadline}
                        </p>
                      )}
                      {auction.status === "paid" && (
                        <p className="text-xs text-blue-600 mt-1">
                          📦 {auction.collectionDate}
                        </p>
                      )}
                      {auction.status === "collected" && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ {auction.collectionDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    {auction.status === "payment_pending" && (
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
                    {auction.status === "paid" && (
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
                    {auction.status === "collected" && (
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
                      onClick={() => setDetailAuction(auction)}
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

        {/* Details Modal */}
        {detailAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[#001f3f] text-white rounded-lg w-full max-w-3xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {detailAuction.title}
                  </h3>
                  <p className="text-sm text-white/80">
                    Auction ID: {detailAuction.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white"
                    onClick={() => {
                      setDetailAuction(null);
                      setModalImage(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <img
                    src={
                      modalImage ||
                      detailAuction.primary_image ||
                      detailAuction.image
                    }
                    alt={detailAuction.title}
                    className="w-full h-64 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2">
                    <strong>Winning Amount:</strong> Ksh{" "}
                    {formatWinningAmount(detailAuction)}
                  </p>
                  <p className="mb-2">
                    <strong>Winner:</strong>{" "}
                    {detailAuction.winner_username ?? "—"}
                  </p>
                  <p className="mb-2">
                    <strong>Seller:</strong> {detailAuction.seller_name ?? "—"}
                  </p>
                  <p className="mb-2">
                    <strong>Won At:</strong>{" "}
                    {detailAuction.won_at ?? detailAuction.dateWon ?? "—"}
                  </p>
                  <p className="mb-2">
                    <strong>Collection Location:</strong>{" "}
                    {detailAuction.collectionLocation ?? "—"}
                  </p>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-white">Description</h4>
                    <p className="text-sm text-white/80">
                      {detailAuction.description ?? "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {wonAuctions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No won auctions yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start bidding on auctions to build your collection
            </p>
            <Button>Browse Auctions</Button>
          </div>
        )}

        {/* Payment & Collection Info */}
        <Card className="bg-primary/10">
          <CardContent className="p-6">
            <h4 className="font-medium text-blue-900 mb-4">
              Payment & Collection Guidelines
            </h4>
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
