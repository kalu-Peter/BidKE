import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  ExternalLink,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";

const TransactionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Reset page to 1 when type filter changes
  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    setPage(1);
  };
  const [dateRange, setDateRange] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [allPayouts, setAllPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const filteredTransactions = allPayouts.filter((p) => {
    const matchesSearch =
      String(p.payout_id).includes(searchTerm) ||
      p.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.auction_id).includes(searchTerm);

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    // Simple date filtering (could be enhanced with actual date range picker)
    let matchesDate = true;
    const created = new Date(p.created_at);
    const now = new Date();

    if (dateRange === "today") {
      matchesDate = created.toDateString() === now.toDateString();
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = created >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = created >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPayoutIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "processing":
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number, currency: string = "KSH") => {
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = (payoutId: number) => {
    const p = allPayouts.find((x) => x.payout_id === payoutId);
    setSelectedTransaction(p);
  };

  // Simple type icon mapper (fallbacks to DollarSign)
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "auction_payment":
        return <CreditCard className="w-5 h-5" />;
      case "listing_fee":
        return <User className="w-5 h-5" />;
      case "refund":
        return <RefreshCw className="w-5 h-5" />;
      case "commission":
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const handleRetryTransaction = async (transactionId: number) => {
    // Optimistic local update; in production this should call a backend retry endpoint
    setAllPayouts((prev) =>
      prev.map((t) =>
        t.id === transactionId || t.payout_id === transactionId
          ? { ...t, status: "processing" }
          : t
      )
    );
    setSelectedTransaction((prev) =>
      prev && (prev.id === transactionId || prev.payout_id === transactionId)
        ? { ...prev, status: "processing" }
        : prev
    );
  };

  const handleRefundTransaction = async (transactionId: number) => {
    // Refund workflow not implemented yet; show a helpful message
    setError("Refund action is not implemented in this dev UI.");
    // Optionally you could call a refund endpoint here and update state
  };

  const handleMarkPaid = async (payoutId: number) => {
    try {
      setLoadingPayouts(true);
      setError(null);
      const res = await fetch(
        `http://localhost:8000/payments/admin/mark_payout.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payout_id: payoutId }),
        }
      );
      const j = await res.json();
      if (j && j.success) {
        // refresh list
        setAllPayouts((prev) =>
          prev.map((p) =>
            p.payout_id === payoutId ? { ...p, status: "completed" } : p
          )
        );
        setSelectedTransaction((prev) =>
          prev && prev.payout_id === payoutId
            ? { ...prev, status: "completed" }
            : prev
        );
      } else {
        setError(j?.message || "Failed to mark payout");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Fetch data when page/limit/typeFilter change
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPayouts(true);
        setError(null);

        // Determine which endpoint to call based on typeFilter
        let endpoint = `/payments/admin/list_payouts.php`; // default to payouts
        if (typeFilter === "auction_payment") {
          endpoint = `/payments/admin/list_payments.php`;
        } else if (typeFilter === "commission") {
          endpoint = `/payments/admin/list_commissions.php`;
        } else if (typeFilter === "payout" || typeFilter === "all") {
          endpoint = `/payments/admin/list_payouts.php`;
        }

        // Use the backend server URL (PHP server typically runs on port 8000)
        const backendUrl = `http://localhost:8000${endpoint}`;

        console.log(
          `[TransactionsTab] Fetching from: ${backendUrl}?page=${page}&limit=${limit}`
        );

        const res = await fetch(`${backendUrl}?page=${page}&limit=${limit}`);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            `[TransactionsTab] HTTP Error ${res.status}:`,
            errorText
          );
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const responseText = await res.text();
        console.log(
          `[TransactionsTab] Raw response:`,
          responseText.substring(0, 200)
        );

        let j;
        try {
          j = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[TransactionsTab] JSON Parse Error:`, parseError);
          console.error(
            `[TransactionsTab] Response was:`,
            responseText.substring(0, 500)
          );
          throw new Error(`Invalid JSON response: ${parseError}`);
        }

        console.log(`[TransactionsTab] Parsed response:`, j);

        if (!mounted) return;

        if (j && j.success) {
          setAllPayouts(j.data || []);
          setTotal(j.total || 0);
        } else {
          setError(j?.message || "Failed to load data");
        }
      } catch (e: any) {
        console.error(`[TransactionsTab] Fetch error:`, e);
        if (mounted) {
          setError(e?.message || "Network error");
        }
      } finally {
        if (mounted) setLoadingPayouts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, limit, typeFilter]);

  // Calculate statistics
  const stats = {
    total: allPayouts.length,
    completed: allPayouts.filter((t) => t.status === "completed").length,
    pending: allPayouts.filter((t) => t.status === "pending").length,
    failed: allPayouts.filter((t) => t.status === "failed").length,
    totalVolume: allPayouts
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.gross_amount), 0),
    totalPayouts: allPayouts
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.net_amount), 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Payouts</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage seller payouts and payout status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              disabled={page * limit >= (total || 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>

            <span className="text-sm text-gray-600">Page</span>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) =>
                setPage(Math.max(1, Number(e.target.value || 1)))
              }
              className="w-16 px-2 py-1 border rounded"
            />

            <span className="text-sm text-gray-600">
              of {Math.max(1, Math.ceil((total || 0) / limit))}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Page size</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border rounded"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loadingPayouts && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading transactions...</span>
          </div>
        )}

        {/* Transaction Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            <p className="text-sm text-blue-600">Total Payouts</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800">
              {stats.completed}
            </p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-800">{stats.failed}</p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-purple-800">
              {formatAmount(stats.totalVolume)}
            </p>
            <p className="text-sm text-purple-600">Gross Volume (completed)</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-teal-800">
              {formatAmount(stats.totalPayouts)}
            </p>
            <p className="text-sm text-teal-600">Net Paid (completed)</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="auction_payment">Auction Payments</SelectItem>
              <SelectItem value="listing_fee">Listing Fees</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
              <SelectItem value="payout">Payouts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Transaction Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {transaction.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {transaction.description}
                      </p>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Amount and Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-bold text-lg text-green-600">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium text-gray-900">
                        {transaction.payer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.payer.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">
                        {transaction.recipient.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.recipient.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="font-medium text-gray-700">
                        {transaction.paymentMethod}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.reference}
                      </p>
                    </div>
                  </div>

                  {/* Related Item */}
                  {(transaction.auction || transaction.listing) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Related {transaction.auction ? "Auction" : "Listing"}:
                      </p>
                      <p className="font-medium text-gray-900">
                        {transaction.auction?.title ||
                          transaction.listing?.title}
                      </p>
                      {transaction.auction?.winning_amount && (
                        <p className="text-sm text-green-600">
                          Winning bid:{" "}
                          {formatAmount(transaction.auction.winning_amount)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status-specific Information */}
                  {transaction.status === "failed" &&
                    transaction.failureReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">
                            Failure Reason:
                          </span>
                        </div>
                        <p className="text-sm text-red-700">
                          {transaction.failureReason}
                        </p>
                        {transaction.nextRetry && (
                          <p className="text-sm text-red-600 mt-1">
                            Next retry: {formatDate(transaction.nextRetry)}
                          </p>
                        )}
                      </div>
                    )}

                  {transaction.status === "pending" &&
                    transaction.estimatedCompletion && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            Estimated Completion:
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          {formatDate(transaction.estimatedCompletion)}
                        </p>
                      </div>
                    )}

                  {/* Fee Breakdown */}
                  {(transaction.processingFee || transaction.platformFee) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                      {transaction.processingFee && (
                        <div>
                          <p className="text-sm text-blue-600">
                            Processing Fee
                          </p>
                          <p className="font-medium text-blue-800">
                            {formatAmount(transaction.processingFee)}
                          </p>
                        </div>
                      )}
                      {transaction.platformFee && (
                        <div>
                          <p className="text-sm text-blue-600">Platform Fee</p>
                          <p className="font-medium text-blue-800">
                            {formatAmount(transaction.platformFee)}
                          </p>
                        </div>
                      )}
                      {(transaction.sellerPayout ||
                        transaction.refundAmount ||
                        transaction.escrowAmount) && (
                        <div>
                          <p className="text-sm text-blue-600">
                            {transaction.sellerPayout
                              ? "Seller Payout"
                              : transaction.refundAmount
                              ? "Refund Amount"
                              : "Escrow Amount"}
                          </p>
                          <p className="font-medium text-blue-800">
                            {formatAmount(
                              transaction.sellerPayout ||
                                transaction.refundAmount ||
                                transaction.escrowAmount ||
                                0
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Created: {formatDate(transaction.transactionDate)}
                      </span>
                    </div>
                    {transaction.completedDate && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Completed: {formatDate(transaction.completedDate)}
                        </span>
                      </div>
                    )}
                    {transaction.failedDate && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          Failed: {formatDate(transaction.failedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 lg:flex-col lg:w-40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(transaction.id)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Details
                  </Button>

                  {transaction.status === "failed" && (
                    <Button
                      size="sm"
                      onClick={() => handleRetryTransaction(transaction.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  )}

                  {transaction.status === "completed" &&
                    transaction.type === "auction_payment" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundTransaction(transaction.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refund
                      </Button>
                    )}

                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ||
              statusFilter !== "all" ||
              typeFilter !== "all" ||
              dateRange !== "all"
                ? "No transactions match your search criteria"
                : "No transactions recorded yet"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setDateRange("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Transaction Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Transaction ID
                    </label>
                    <p className="font-mono text-lg">
                      {selectedTransaction.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={getStatusColor(selectedTransaction.status)}
                      >
                        {selectedTransaction.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Type
                    </label>
                    <p className="font-medium">
                      {selectedTransaction.type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Amount
                    </label>
                    <p className="font-bold text-lg text-green-600">
                      {formatAmount(
                        selectedTransaction.amount,
                        selectedTransaction.currency
                      )}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Payment Method
                      </label>
                      <p className="font-medium">
                        {selectedTransaction.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Reference
                      </label>
                      <p className="font-mono">
                        {selectedTransaction.reference}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Transaction Parties</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        From
                      </label>
                      <p className="font-medium">
                        {selectedTransaction.payer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedTransaction.payer.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        To
                      </label>
                      <p className="font-medium">
                        {selectedTransaction.recipient.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedTransaction.recipient.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm">
                        {formatDate(selectedTransaction.transactionDate)}
                      </span>
                    </div>
                    {selectedTransaction.completedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Completed:
                        </span>
                        <span className="text-sm">
                          {formatDate(selectedTransaction.completedDate)}
                        </span>
                      </div>
                    )}
                    {selectedTransaction.failedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed:</span>
                        <span className="text-sm">
                          {formatDate(selectedTransaction.failedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export Receipt
                  </Button>
                  {selectedTransaction.status === "failed" && (
                    <Button size="sm">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry Transaction
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Processing Guidelines */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Payment Processing Guidelines:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Monitor failed transactions and initiate retries where
              appropriate
            </li>
            <li>• Process refund requests within 24-48 hours</li>
            <li>• Verify high-value transactions manually before approval</li>
            <li>• Maintain audit trails for all financial transactions</li>
            <li>• Ensure compliance with payment processor requirements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
