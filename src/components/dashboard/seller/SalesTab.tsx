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
} from "lucide-react";

interface Sale {
  id: number;
  item: string;
  buyer: string;
  buyer_email?: string;
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

const SalesTab: React.FC = () => {
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

  // In production, get seller_id from auth context
  const sellerId = 1; // Temporary hardcoded value

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/sales/seller_sales.php?seller_id=${sellerId}&page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("[SalesTab] API Response:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch sales data");
      }

      setSales(result.data || []);
      setSummary(result.summary || summary);
      setTotal(result.total || 0);
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
  }, [page]);

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : `Ksh ${summary.total_sales.toLocaleString()}`}
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
                  {summary.total_sales > 0
                    ? `${Math.round(
                        (summary.total_payouts / summary.total_sales) * 100
                      )}% of total sales`
                    : "0% of total sales"}
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
                        <Button variant="outline" size="sm">
                          {sale.status === "completed" || sale.status === "paid"
                            ? "View Receipt"
                            : "Track Payment"}
                        </Button>
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
              <p className="text-muted-foreground">
                Your completed sales will appear here
              </p>
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
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
              <div>
                <h4 className="font-medium">Next Payout</h4>
                <p className="text-sm text-gray-600">
                  Scheduled for Friday, September 15, 2025
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  Ksh 48,600
                </div>
                <div className="text-xs text-gray-500">1 pending sale</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>• Payouts are processed twice weekly (Tuesdays and Fridays)</p>
              <p>• Minimum payout amount: Ksh 1,000</p>
              <p>• Bank transfers take 1-2 business days</p>
              <p>• M-Pesa transfers are instant</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTab;
