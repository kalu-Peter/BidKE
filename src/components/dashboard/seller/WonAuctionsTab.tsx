import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Receipt, Eye, MessageCircle } from "lucide-react";
import MessagingModal from "@/components/messaging/MessagingModal";
import { useAuth } from "@/contexts/AuthContext";

const WonAuctionsTab: React.FC = () => {
  const { user } = useAuth();
  const [wonAuctions, setWonAuctions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [detailAuction, setDetailAuction] = React.useState<any | null>(null);
  const [modalImage, setModalImage] = React.useState<string | null>(null);
  const [messagingModalOpen, setMessagingModalOpen] = React.useState(false);
  const [selectedAuctionForMessaging, setSelectedAuctionForMessaging] =
    React.useState<any | null>(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = React.useState<
    Record<number, number>
  >({});

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

  // Fetch unread message counts for auctions
  const fetchUnreadCounts = React.useCallback(async () => {
    if (!user?.id || wonAuctions.length === 0) return;

    try {
      // Fetch unread counts for all auctions
      const promises = wonAuctions.map(async (auction) => {
        try {
          const response = await fetch(
            `http://localhost:8000/messages.php?auction_id=${auction.id}&user_id=${user.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return {
                auctionId: auction.id,
                unreadCount: data.data.unread_count || 0,
              };
            }
          }
        } catch (error) {
          console.error(
            `Error fetching unread count for auction ${auction.id}:`,
            error
          );
        }
        return { auctionId: auction.id, unreadCount: 0 };
      });

      const results = await Promise.all(promises);
      const counts: Record<number, number> = {};
      results.forEach(({ auctionId, unreadCount }) => {
        counts[auctionId] = unreadCount;
      });
      setUnreadMessageCounts(counts);
    } catch (error) {
      console.error("Error fetching unread message counts:", error);
    }
  }, [user?.id, wonAuctions]);

  // Fetch unread counts when auctions are loaded
  React.useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Listen for global payment processed events (dispatched by admin/process endpoints)
  React.useEffect(() => {
    const onProcessed = (ev: any) => {
      const detail = ev?.detail;
      if (!detail) return;
      const { auction_id, payment_id } = detail;
      setWonAuctions((prev) =>
        prev.map((a) =>
          a.id === auction_id
            ? { ...a, payment_status: "completed", payment_id }
            : a
        )
      );
    };
    window.addEventListener("payments:processed", onProcessed as EventListener);
    return () =>
      window.removeEventListener(
        "payments:processed",
        onProcessed as EventListener
      );
  }, []);

  // Poll payment status for pending payments (per-auction poller)
  React.useEffect(() => {
    const timers: Record<string, number> = {};

    const startPoll = (auction: any) => {
      const tx = auction.transaction_ref;
      if (!tx) return;
      const key = String(tx);
      // avoid duplicate timers
      if (timers[key]) return;

      const poll = async () => {
        try {
          const res = await fetch(
            `/payments/status.php?transaction_ref=${encodeURIComponent(key)}`
          );
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.success && j.data) {
            const status = j.data.status;
            if (status === "completed" || status === "paid") {
              // update UI to show confirmation
              setWonAuctions((prev) =>
                prev.map((a) =>
                  a.transaction_ref === key
                    ? {
                        ...a,
                        payment_status: "completed",
                        payment_id: j.data.payment_id,
                        justPaid: true,
                      }
                    : a
                )
              );
              // clear timer
              clearInterval(timers[key]);
              delete timers[key];
              // remove justPaid flag after short delay
              setTimeout(() => {
                setWonAuctions((prev) =>
                  prev.map((a) =>
                    a.transaction_ref === key ? { ...a, justPaid: false } : a
                  )
                );
              }, 4000);
            }
          }
        } catch (_e) {
          // ignore network errors
        }
      };

      // start interval
      timers[key] = window.setInterval(poll, 3000);
      // run once immediately
      poll();
    };

    // start pollers for any pending payments
    wonAuctions.forEach((a) => {
      const status = a.payment_status || a.status;
      if (status === "pending" || status === "payment_pending") {
        startPoll(a);
      }
    });

    return () => {
      // clear all timers
      Object.values(timers).forEach((t) => clearInterval(t));
    };
  }, [wonAuctions]);

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
      processing: {
        label: "Processing",
        color: "bg-indigo-100 text-indigo-800",
        description: "Payment is being processed",
      },
    };
    return configs[status as keyof typeof configs] || configs.paid;
  };

  const handlePayNow = (auctionId: number) => {
    (async () => {
      try {
        const { apiService } = await import("@/services/api");
        // Optimistic UI: mark as processing for this auction
        setWonAuctions((prev) =>
          prev.map((a) =>
            a.id === auctionId ? { ...a, status: "processing" } : a
          )
        );
        const res = await apiService.initiateAuctionPayment(auctionId);
        if (res && res.success && res.data) {
          const tx = (res.data as any).transaction_ref;
          const pid = (res.data as any).payment_id;
          const checkoutUrl = (res.data as any).checkout_url || null;
          // Update local row with payment info
          setWonAuctions((prev) =>
            prev.map((a) =>
              a.id === auctionId
                ? {
                    ...a,
                    payment_status: "pending",
                    transaction_ref: tx,
                    payment_id: pid,
                    status: "payment_pending",
                  }
                : a
            )
          );
          // Open gateway/checkout page - for now we'll open a simple /checkout?tx=... page (implement actual gateway separately)
          const urlToOpen =
            checkoutUrl ||
            `/checkout?tx=${encodeURIComponent(
              tx
            )}&auction_id=${encodeURIComponent(String(auctionId))}`;
          window.open(urlToOpen, "_blank");
        } else {
          // revert UI
          setWonAuctions((prev) =>
            prev.map((a) =>
              a.id === auctionId ? { ...a, status: "payment_pending" } : a
            )
          );
          alert(
            "Failed to initiate payment: " +
              (res?.message || res?.error || "Unknown")
          );
        }
      } catch (err) {
        setWonAuctions((prev) =>
          prev.map((a) =>
            a.id === auctionId ? { ...a, status: "payment_pending" } : a
          )
        );
        alert("Error initiating payment");
      }
    })();
  };

  const handleProcessPayment = async (auction: any) => {
    // Use API to process payment (creates payment, commission and payout records)
    try {
      // Optimistic UI: mark as processing locally
      setWonAuctions((prev) =>
        prev.map((a) =>
          a.id === auction.id ? { ...a, status: "processing_payment" } : a
        )
      );
      const { apiService } = await import("@/services/api");
      const amount = Number(auction.winning_amount) || 0;
      const res = await apiService.processPayment(
        Number(auction.id),
        amount,
        "mpesa"
      );
      if (res && res.success) {
        // Update to paid
        setWonAuctions((prev) =>
          prev.map((a) => (a.id === auction.id ? { ...a, status: "paid" } : a))
        );
        // Optionally show a global event
        try {
          const ev = new CustomEvent("payments:processed", {
            detail: {
              auction_id: auction.id,
              payment_id: (res.data as any)?.payment_id,
            },
          });
          window.dispatchEvent(ev);
        } catch (_) {}
      } else {
        // Revert optimistic state
        setWonAuctions((prev) =>
          prev.map((a) =>
            a.id === auction.id ? { ...a, status: "payment_pending" } : a
          )
        );
        alert("Payment failed: " + (res.error || res.message || "Unknown"));
      }
    } catch (err) {
      setWonAuctions((prev) =>
        prev.map((a) =>
          a.id === auction.id ? { ...a, status: "payment_pending" } : a
        )
      );
      alert("Payment processing error");
    }
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
    const auction = wonAuctions.find((a) => a.id === auctionId);
    if (auction && user) {
      setSelectedAuctionForMessaging(auction);
      setMessagingModalOpen(true);
    }
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
              // Determine payment UI state: prefer explicit payment_status from API when available
              let uiStatus = auction.status;
              if (auction.payment_status) {
                if (auction.payment_status === "pending")
                  uiStatus = "payment_pending";
                else if (
                  auction.payment_status === "completed" ||
                  auction.payment_status === "paid"
                )
                  uiStatus = "paid";
                else if (auction.payment_status === "processing")
                  uiStatus = "processing";
                else uiStatus = auction.payment_status;
              }
              const statusConfig = getStatusConfig(uiStatus);
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
                      {auction.justPaid && (
                        <div className="mt-2 inline-block bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Payment confirmed ✓
                        </div>
                      )}
                      {auction.payment_status && (
                        <p className="text-xs text-gray-500 mt-1">
                          Payment status: {auction.payment_status}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 max-w-48">
                        {statusConfig.description}
                      </p>
                      {uiStatus === "payment_pending" && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⏰ {auction.paymentDeadline}
                        </p>
                      )}
                      {uiStatus === "paid" && (
                        <p className="text-xs text-blue-600 mt-1">
                          📦 {auction.collectionDate}
                        </p>
                      )}
                      {uiStatus === "collected" && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ {auction.collectionDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    {uiStatus === "payment_pending" && (
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
                          onClick={() => handleProcessPayment(auction)}
                        >
                          Process Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactSeller(auction.id)}
                          className="relative"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contact Seller
                          {unreadMessageCounts[auction.id] > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                              {unreadMessageCounts[auction.id]}
                            </Badge>
                          )}
                        </Button>
                      </>
                    )}
                    {uiStatus === "paid" && (
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
                          className="relative"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contact Seller
                          {unreadMessageCounts[auction.id] > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                              {unreadMessageCounts[auction.id]}
                            </Badge>
                          )}
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

      {/* Messaging Modal */}
      {selectedAuctionForMessaging && (
        <MessagingModal
          isOpen={messagingModalOpen}
          onClose={() => {
            setMessagingModalOpen(false);
            setSelectedAuctionForMessaging(null);
            // Refresh unread counts after closing messaging
            fetchUnreadCounts();
          }}
          auctionId={selectedAuctionForMessaging.id}
          recipientId={selectedAuctionForMessaging.seller_id}
          auctionTitle={selectedAuctionForMessaging.title}
        />
      )}
    </Card>
  );
};

export default WonAuctionsTab;
