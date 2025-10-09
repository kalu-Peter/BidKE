import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Package,
  Calculator,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import MessagingModal from "@/components/messaging/MessagingModal";

interface Sale {
  id: number;
  item: string;
  buyer: string;
  buyer_email?: string;
  buyer_id?: number;
  auction_id?: number;
  soldPrice: number;
  commission: number;
  payout: number;
  date: string;
  payment_date?: string;
  payout_date?: string;
  status: string;
  payment_status?: string;
  payout_status?: string;
  commission_percentage: number;
}

interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  total_payouts: number;
  total_commission: number;
  items_sold: number;
}

interface SalesApiResponse {
  success: boolean;
  data: Sale[];
  total: number;
  page: number;
  limit: number;
  summary: SalesSummary;
  message?: string;
}

const SalesTab: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    total_sales: 0,
    total_revenue: 0,
    total_payouts: 0,
    total_commission: 0,
    items_sold: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [messagingModalOpen, setMessagingModalOpen] = useState(false);
  const [selectedSaleForMessaging, setSelectedSaleForMessaging] =
    useState<Sale | null>(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<
    Record<number, number>
  >({});

  const fetchSales = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the API service to fetch sales data for the authenticated user
      const result = await apiService.getSellerSales(user.id, page, limit);
      console.log("[SalesTab] API Response:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch sales data");
      }

      // Type assertion for proper access to API response properties
      const salesResult = result as unknown as SalesApiResponse;
      setSales(salesResult.data || []);
      setSummary(salesResult.summary || summary);
      setTotal(salesResult.total || 0);
    } catch (error) {
      console.error("[SalesTab] Error fetching sales:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load sales data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user?.id, page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle contact buyer functionality
  const handleContactBuyer = (sale: Sale) => {
    if (sale.buyer_id && sale.auction_id && user) {
      setSelectedSaleForMessaging(sale);
      setMessagingModalOpen(true);
    }
  };

  // Fetch unread message counts for sales
  const fetchUnreadCounts = React.useCallback(async () => {
    if (!user?.id || sales.length === 0) return;

    try {
      const promises = sales
        .filter((sale) => sale.auction_id && sale.buyer_id)
        .map(async (sale) => {
          try {
            const response = await fetch(
              `http://localhost:8000/messages.php?auction_id=${sale.auction_id}&user_id=${user.id}`,
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
                  auctionId: sale.auction_id!,
                  unreadCount: data.data.unread_count || 0,
                };
              }
            }
          } catch (error) {
            console.error(
              `Error fetching unread count for sale ${sale.id}:`,
              error
            );
          }
          return { auctionId: sale.auction_id!, unreadCount: 0 };
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
  }, [user?.id, sales]);

  // Fetch unread counts when sales are loaded
  React.useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  const payoutMethods = [
    {
      id: 1,
      type: "Bank Transfer",
      bank: "Standard Chartered Bank",
      account: "****1234",
      isDefault: true,
    },
    {
      id: 2,
      type: "M-Pesa",
      number: "****0789",
      isDefault: false,
    },
  ];

  // Loading state while authenticating
  if (authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your sales data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state for unauthenticated user
  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              Please log in to view your sales
            </p>
            <Button onClick={() => (window.location.href = "/login")}>
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : `Ksh ${summary.total_revenue.toLocaleString()}`}
                </p>
                <p className="text-xs text-green-600">Total sales revenue</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Items Sold</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : summary.items_sold}
                </p>
                <p className="text-xs text-green-600">
                  Successfully sold auctions
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payouts</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : `Ksh ${summary.total_payouts.toLocaleString()}`}
                </p>
                <p className="text-xs text-blue-600">
                  {summary.total_revenue > 0
                    ? `${Math.round(
                        (summary.total_payouts / summary.total_revenue) * 100
                      )}% of total revenue`
                    : "0% of total revenue"}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Commission Paid</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : `Ksh ${summary.total_commission.toLocaleString()}`}
                </p>
                <p className="text-xs text-gray-600">Platform commission</p>
              </div>
              <Calculator className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Recent Sales</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Track your completed sales and payout history
          </p>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchSales();
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading sales data...</span>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Item</th>
                    <th className="text-left p-4 font-medium">Buyer</th>
                    <th className="text-left p-4 font-medium">
                      Final Bid Amount
                    </th>
                    <th className="text-left p-4 font-medium">Commission</th>
                    <th className="text-left p-4 font-medium">Your Payout</th>
                    <th className="text-left p-4 font-medium">Date Sold</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">{sale.item}</td>
                      <td className="p-4">{sale.buyer}</td>
                      <td className="p-4">
                        Ksh {sale.soldPrice.toLocaleString()}
                      </td>
                      <td className="p-4 text-red-600">
                        Ksh {sale.commission.toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-green-600">
                        Ksh {sale.payout.toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDate(sale.date)}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(sale.status)}>
                          {sale.status.charAt(0).toUpperCase() +
                            sale.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            {sale.status === "completed" ||
                            sale.status === "paid"
                              ? "View Receipt"
                              : "Track Payment"}
                          </Button>
                          {(sale.status === "completed" ||
                            sale.status === "paid") &&
                            sale.buyer_id &&
                            sale.auction_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContactBuyer(sale)}
                                className="relative"
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Contact Buyer
                                {unreadMessageCounts[sale.auction_id] > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                  >
                                    {unreadMessageCounts[sale.auction_id]}
                                  </Badge>
                                )}
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && sales.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No sales yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Your completed sales will appear here once you sell items
              </p>
              <Button
                onClick={() => (window.location.href = "/dashboard/post-item")}
              >
                <Package className="w-4 h-4 mr-2" />
                Post New Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Manage how you receive payments from successful sales
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 rounded-lg border ${
                method.isDefault
                  ? "bg-green-500/10 border-green-200"
                  : "bg-muted/20"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium flex items-center space-x-2">
                    <span>{method.type}</span>
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800">
                        Default
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.type === "Bank Transfer"
                      ? `${method.bank} - Account: ${method.account}`
                      : `Mobile: ${method.number}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <Button variant="outline" size="sm">
                      Set as Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full">
            Add New Payout Method
          </Button>
        </CardContent>
      </Card>

      {/* Payout Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calculate pending payouts */}
            {(() => {
              const pendingPayouts = sales.filter(
                (sale) =>
                  sale.payout_status === "pending" ||
                  sale.payout_status === "processing" ||
                  (!sale.payout_status && sale.status === "completed")
              );
              const totalPendingAmount = pendingPayouts.reduce(
                (sum, sale) => sum + sale.payout,
                0
              );
              const completedPayouts = sales.filter(
                (sale) =>
                  sale.payout_status === "completed" ||
                  sale.payout_status === "paid"
              );

              return (
                <>
                  {/* Next Payout Section */}
                  {pendingPayouts.length > 0 ? (
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                      <div>
                        <h4 className="font-medium">Pending Payouts</h4>
                        <p className="text-sm text-gray-600">
                          {pendingPayouts.length} sale
                          {pendingPayouts.length !== 1 ? "s" : ""} awaiting
                          payout
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          Ksh {totalPendingAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total pending amount
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">All Payouts Complete</h4>
                        <p className="text-sm text-gray-600">
                          No pending payouts at this time
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          Ksh 0
                        </div>
                        <div className="text-xs text-gray-500">
                          Pending amount
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Payouts List */}
                  {(pendingPayouts.length > 0 ||
                    completedPayouts.length > 0) && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">
                        Recent Payout Status
                      </h5>
                      {[...pendingPayouts, ...completedPayouts]
                        .slice(0, 5)
                        .map((sale) => (
                          <div
                            key={sale.id}
                            className="flex justify-between items-center p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{sale.item}</p>
                              <p className="text-xs text-gray-500">
                                Sale Date: {formatDate(sale.date)}
                                {sale.payout_date &&
                                  ` • Paid: ${formatDate(sale.payout_date)}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                Ksh {sale.payout.toLocaleString()}
                              </div>
                              <Badge
                                className={
                                  sale.payout_status === "completed" ||
                                  sale.payout_status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : sale.payout_status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {sale.payout_status || "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Payout Information */}
            <div className="text-sm text-gray-600 space-y-2 pt-4 border-t">
              <p>• Payouts are processed twice weekly (Tuesdays and Fridays)</p>
              <p>• Minimum payout amount: Ksh 1,000</p>
              <p>• Bank transfers take 1-2 business days</p>
              <p>• M-Pesa transfers are instant</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Modal */}
      {selectedSaleForMessaging && (
        <MessagingModal
          isOpen={messagingModalOpen}
          onClose={() => {
            setMessagingModalOpen(false);
            setSelectedSaleForMessaging(null);
            // Refresh unread counts after closing messaging
            fetchUnreadCounts();
          }}
          auctionId={selectedSaleForMessaging.auction_id!}
          recipientId={selectedSaleForMessaging.buyer_id!}
          auctionTitle={selectedSaleForMessaging.item}
        />
      )}
    </div>
  );
};

export default SalesTab;
