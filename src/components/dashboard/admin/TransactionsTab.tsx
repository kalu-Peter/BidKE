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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
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
  const [submittingPayouts, setSubmittingPayouts] = useState<Set<number>>(
    new Set()
  );
  const [processingRefunds, setProcessingRefunds] = useState<Set<number>>(
    new Set()
  );

  const filteredTransactions = allPayouts.filter((p) => {
    const matchesSearch =
      String(
        p.id || p.payout_id || p.payment_id || p.commission_id || ""
      ).includes(searchTerm) ||
      (p.recipient?.name || p.seller?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (p.payer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.auction_id || "").includes(searchTerm) ||
      (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());

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
        // Use primary solid badge so it reads well on both light cards and dark modal
        return "bg-primary text-white";
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
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-primary/70" />;
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
    try {
      console.log(
        `[TransactionsTab] Processing refund for payment: ${transactionId}`
      );

      // Add transaction to processing refunds set
      setProcessingRefunds((prev) => new Set([...prev, transactionId]));
      setError(null);

      // Call the backend API
      const response = await fetch(
        "http://localhost:8000/payments/admin/process_refund.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_id: transactionId,
            refund_reason: "Admin initiated refund",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[TransactionsTab] HTTP Error ${response.status}:`,
          errorText
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[TransactionsTab] Refund response:`, result);

      if (!result.success) {
        throw new Error(result.message || "Failed to process refund");
      }

      // Update local state to reflect the refund was processed
      // Note: We don't change the original transaction status but could add a refunded flag
      setAllPayouts((prev) =>
        prev.map((p) =>
          p.id === transactionId || p.payment_id === transactionId
            ? { ...p, refunded: true, refund_id: result.refund_id }
            : p
        )
      );

      // Update selected transaction if it matches
      setSelectedTransaction((prev) =>
        prev && (prev.id === transactionId || prev.payment_id === transactionId)
          ? { ...prev, refunded: true, refund_id: result.refund_id }
          : prev
      );

      console.log(
        `[TransactionsTab] Refund ${transactionId} processed successfully`
      );

      // Show success message
      setError(null);
    } catch (error) {
      console.error(
        `[TransactionsTab] Error processing refund ${transactionId}:`,
        error
      );
      setError(
        `Failed to process refund: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Remove from processing set
      setProcessingRefunds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
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

  const handleSubmitPayout = async (payoutId: number) => {
    try {
      console.log(
        `[TransactionsTab] Processing payout and commission: ${payoutId}`
      );

      // Add payout to submitting set
      setSubmittingPayouts((prev) => new Set([...prev, payoutId]));

      // Call the new combined backend API
      const response = await fetch(
        "http://localhost:8000/payments/admin/process_payout_and_commission.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payout_id: payoutId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[TransactionsTab] HTTP Error ${response.status}:`,
          errorText
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(
        `[TransactionsTab] Process payout and commission response:`,
        result
      );

      if (!result.success) {
        throw new Error(
          result.message || "Failed to process payout and commission"
        );
      }

      // Update local state to show completed status
      setAllPayouts((prev) =>
        prev.map((p) =>
          p.payout_id === payoutId ? { ...p, status: "completed" } : p
        )
      );

      // Also update selected transaction if it matches
      setSelectedTransaction((prev) =>
        prev && prev.payout_id === payoutId
          ? { ...prev, status: "completed" }
          : prev
      );

      console.log(
        `[TransactionsTab] Payout ${payoutId} and commission processed successfully`
      );

      // Show success message with details
      if (result.payout_amount && result.platform_fee) {
        setError(""); // Clear any previous errors
        // Could add a success toast/notification here if implemented
        console.log(
          `Payout Amount: Ksh ${result.payout_amount}, Platform Fee: Ksh ${result.platform_fee}`
        );
      }

      // Trigger a data refresh by forcing re-render
      // The local state update above should be sufficient for UI feedback
    } catch (error) {
      console.error(
        `[TransactionsTab] Error processing payout and commission ${payoutId}:`,
        error
      );
      setError(
        `Failed to process payout and commission: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Remove from submitting set
      setSubmittingPayouts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
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
        let queryParams = `?page=${page}&limit=${limit}`;

        if (typeFilter === "auction_payment") {
          endpoint = `/payments/admin/list_payments.php`;
        } else if (typeFilter === "refund") {
          // For refunds, get payments that have been refunded
          endpoint = `/payments/admin/list_payments.php`;
          queryParams += `&refunded_only=1`; // Add parameter to filter refunded payments
        } else if (typeFilter === "commission") {
          endpoint = `/payments/admin/list_commissions.php`;
        } else if (typeFilter === "payout" || typeFilter === "all") {
          endpoint = `/payments/admin/list_payouts.php`;
        }

        // Use the backend server URL (PHP server typically runs on port 8000)
        const backendUrl = `http://localhost:8000${endpoint}`;

        console.log(
          `[TransactionsTab] Fetching from: ${backendUrl}${queryParams}`
        );

        const res = await fetch(`${backendUrl}${queryParams}`);

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
      .reduce((sum, t) => sum + Number(t.gross_amount || t.amount || 0), 0),
    totalPayouts: allPayouts
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.net_amount || t.amount || 0), 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-primary">
          <DollarSign className="w-5 h-5 text-primary" />
          <span>Payouts</span>
        </CardTitle>
        <p className="text-sm text-primary/80">
          Manage seller payouts and payout status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <button
              className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
              disabled={page * limit >= (total || 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>

            <span className="text-sm text-primary/90">Page</span>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) =>
                setPage(Math.max(1, Number(e.target.value || 1)))
              }
              className="w-16 px-2 py-1 border border-primary/30 rounded text-primary bg-white/80"
            />

            <span className="text-sm text-primary/80">
              of {Math.max(1, Math.ceil((total || 0) / limit))}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-primary/90">Page size</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-primary/30 rounded text-primary bg-white/90"
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
            <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-primary/80">Loading transactions...</span>
          </div>
        )}

        {/* Transaction Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg text-center border border-primary/20">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-primary/70">Total Payouts</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <p className="text-2xl font-bold text-green-800">
              {stats.completed}
            </p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <p className="text-2xl font-bold text-red-800">{stats.failed}</p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
          <div className="bg-secondary/10 p-4 rounded-lg text-center border border-secondary/20">
            <p className="text-xl font-bold text-secondary">
              {formatAmount(stats.totalVolume)}
            </p>
            <p className="text-sm text-secondary/80">
              Gross Volume (completed)
            </p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg text-center border border-primary/30">
            <p className="text-xl font-bold text-primary">
              {formatAmount(stats.totalPayouts)}
            </p>
            <p className="text-sm text-primary/80">Net Paid (completed)</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/90 text-primary placeholder:text-primary/60 border border-primary/20"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-primary/30 bg-white/90 text-primary">
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
            <SelectTrigger className="border border-primary/30 bg-white/90 text-primary">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="auction_payment">Auction Payments</SelectItem>
              <SelectItem value="refund">Refunded Payments</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
              <SelectItem value="payout">Payouts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="border border-primary/30 bg-white/90 text-primary">
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
              className="border border-primary/10 rounded-lg p-4 bg-white hover:shadow-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Simplified Transaction Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(transaction.type)}
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-lg text-primary">
                            {typeFilter === "refund" || transaction.refunded
                              ? `Refunded payment for auction #${
                                  transaction.auction_id || transaction.id
                                }`
                              : `Payment for auction #${
                                  transaction.auction_id || transaction.id
                                }`}
                          </h3>
                          <span className="font-bold text-lg text-secondary">
                            {formatAmount(
                              transaction.amount ||
                                transaction.net_amount ||
                                transaction.gross_amount ||
                                0,
                              transaction.currency || "KSH"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            className={getStatusColor(
                              transaction.status || "unknown"
                            )}
                          >
                            {(transaction.status || "unknown").replace(
                              "_",
                              " "
                            )}
                          </Badge>
                          <span className="text-sm text-primary/90 font-medium">
                            {transaction.paymentMethod ||
                              transaction.payment_method ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary/80 font-medium">
                        Created:
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                <div className="flex items-center gap-2">
                  {/* Show refunded status badge */}
                  {transaction.refunded && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      Refunded
                    </Badge>
                  )}

                  {/* Dropdown Menu for Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-primary" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Conditional Action Items */}
                      {transaction.status === "failed" && (
                        <DropdownMenuItem
                          onClick={() => handleRetryTransaction(transaction.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Transaction
                        </DropdownMenuItem>
                      )}

                      {transaction.status === "completed" &&
                        transaction.type === "auction_payment" &&
                        !transaction.refunded && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRefundTransaction(transaction.id)
                            }
                            disabled={processingRefunds.has(transaction.id)}
                          >
                            <RefreshCw
                              className={`w-4 h-4 mr-2 ${
                                processingRefunds.has(transaction.id)
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            {processingRefunds.has(transaction.id)
                              ? "Processing Refund..."
                              : "Process Refund"}
                          </DropdownMenuItem>
                        )}

                      {typeFilter === "payout" &&
                        transaction.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleSubmitPayout(transaction.payout_id)
                            }
                            disabled={submittingPayouts.has(
                              transaction.payout_id
                            )}
                          >
                            <CheckCircle
                              className={`w-4 h-4 mr-2 ${
                                submittingPayouts.has(transaction.payout_id)
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            {submittingPayouts.has(transaction.payout_id)
                              ? "Processing Payout..."
                              : "Process Payout"}
                          </DropdownMenuItem>
                        )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Export Transaction
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              No transactions found
            </h3>
            <p className="text-primary/80 mb-4">
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
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div
              className="rounded-xl shadow-2xl border border-white/10 p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
              style={{ backgroundColor: "#00072d" }}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                <h3 className="text-xl font-bold text-white">
                  Transaction Details
                </h3>
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
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Transaction ID
                    </label>
                    <p className="font-mono text-lg text-primary bg-white/10 border border-white/20 px-2 py-1 rounded">
                      {selectedTransaction.id ||
                        selectedTransaction.payment_id ||
                        selectedTransaction.payout_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Auction ID
                    </label>
                    <p className="font-mono text-lg text-white bg-white/10 border border-white/20 px-2 py-1 rounded">
                      #{selectedTransaction.auction_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={
                          // On dark modal background, prefer white text on colored bg for better contrast
                          selectedTransaction.status === "processing"
                            ? "bg-primary text-white"
                            : getStatusColor(selectedTransaction.status)
                        }
                      >
                        {selectedTransaction.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Type
                    </label>
                    <p className="font-semibold text-white">
                      {selectedTransaction.type?.replace("_", " ") || "Payment"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Amount
                    </label>
                    <p className="font-bold text-lg text-accent">
                      {formatAmount(
                        selectedTransaction.amount ||
                          selectedTransaction.net_amount ||
                          selectedTransaction.gross_amount ||
                          0,
                        selectedTransaction.currency || "KSH"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Created Date
                    </label>
                    <p className="font-semibold text-white">
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>
                </div>

                {/* Amount Breakdown */}
                {(selectedTransaction.platform_fee ||
                  selectedTransaction.gross_amount) && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-lg text-white mb-3">
                      Amount Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white/10 border border-white/20 rounded-lg">
                      {selectedTransaction.gross_amount && (
                        <div>
                          <p className="text-sm text-white/80">Gross Amount</p>
                          <p className="font-medium text-white">
                            {formatAmount(selectedTransaction.gross_amount)}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.platform_fee && (
                        <div>
                          <p className="text-sm text-white/80">Platform Fee</p>
                          <p className="font-medium text-white">
                            {formatAmount(selectedTransaction.platform_fee)}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.net_amount && (
                        <div>
                          <p className="text-sm text-white/80">Net Amount</p>
                          <p className="font-medium text-white">
                            {formatAmount(selectedTransaction.net_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div className="border-t border-white/20 pt-6">
                  <h4 className="font-bold text-lg text-white mb-4">
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white/80">
                        Payment Method
                      </label>
                      <p className="font-medium text-white">
                        {selectedTransaction.paymentMethod ||
                          selectedTransaction.payment_method ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">
                        Reference
                      </label>
                      <p className="font-mono text-white">
                        {selectedTransaction.reference ||
                          selectedTransaction.transaction_ref ||
                          "N/A"}
                      </p>
                    </div>
                    {selectedTransaction.payout_method && (
                      <div>
                        <label className="text-sm font-medium text-white/80">
                          Payout Method
                        </label>
                        <p className="font-medium text-white">
                          {selectedTransaction.payout_method}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-white/80">
                        Updated
                      </label>
                      <p className="font-medium text-white">
                        {formatDate(selectedTransaction.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="border-t border-white/20 pt-4">
                  <h4 className="font-semibold mb-3 text-white">
                    Transaction Parties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white/80">
                        Buyer (Payer)
                      </label>
                      <p className="font-medium text-white">
                        {selectedTransaction.payer?.name ||
                          selectedTransaction.buyer_name ||
                          "N/A"}
                      </p>
                      <p className="text-sm text-white/70">
                        {selectedTransaction.payer?.email ||
                          selectedTransaction.buyer_email ||
                          "N/A"}
                      </p>
                      {selectedTransaction.user_id && (
                        <p className="text-xs text-white/50">
                          User ID: {selectedTransaction.user_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">
                        Seller (Recipient)
                      </label>
                      <p className="font-medium text-white">
                        {selectedTransaction.recipient?.name ||
                          selectedTransaction.seller_name ||
                          "N/A"}
                      </p>
                      <p className="text-sm text-white/70">
                        {selectedTransaction.recipient?.email ||
                          selectedTransaction.seller_email ||
                          "N/A"}
                      </p>
                      {selectedTransaction.seller_id && (
                        <p className="text-xs text-white/50">
                          Seller ID: {selectedTransaction.seller_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auction Details */}
                {selectedTransaction.auction_id && (
                  <div className="border-t border-white/20 pt-4">
                    <h4 className="font-semibold mb-3 text-white">
                      Related Auction
                    </h4>
                    <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
                      <p className="font-medium text-white mb-2">
                        Auction #{selectedTransaction.auction_id}
                      </p>
                      {selectedTransaction.auction_title && (
                        <p className="text-sm text-white/80 mb-1">
                          {selectedTransaction.auction_title}
                        </p>
                      )}
                      {selectedTransaction.winning_amount && (
                        <p className="text-sm text-accent">
                          Winning bid:{" "}
                          {formatAmount(selectedTransaction.winning_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status History & Additional Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-white">
                    Additional Information
                  </h4>
                  <div className="space-y-3">
                    {selectedTransaction.description && (
                      <div>
                        <label className="text-sm font-medium text-white/80">
                          Description
                        </label>
                        <p className="text-sm text-white/90">
                          {selectedTransaction.description}
                        </p>
                      </div>
                    )}

                    {/* Status-specific information */}
                    {selectedTransaction.status === "failed" &&
                      selectedTransaction.failureReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">
                              Failure Reason:
                            </span>
                          </div>
                          <p className="text-sm text-red-700">
                            {selectedTransaction.failureReason}
                          </p>
                        </div>
                      )}

                    {selectedTransaction.status === "pending" &&
                      selectedTransaction.estimatedCompletion && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">
                              Estimated Completion:
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            {formatDate(
                              selectedTransaction.estimatedCompletion
                            )}
                          </p>
                        </div>
                      )}

                    {selectedTransaction.refunded && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">
                            This transaction has been refunded
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedTransaction.status === "failed" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleRetryTransaction(selectedTransaction.id)
                        }
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry Transaction
                      </Button>
                    )}

                    {selectedTransaction.status === "completed" &&
                      selectedTransaction.type === "auction_payment" &&
                      !selectedTransaction.refunded && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRefundTransaction(selectedTransaction.id)
                          }
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Process Refund
                        </Button>
                      )}

                    {typeFilter === "payout" &&
                      selectedTransaction.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSubmitPayout(selectedTransaction.payout_id)
                          }
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Process Payout
                        </Button>
                      )}

                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download Receipt
                    </Button>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4 text-xs text-white/60">
                  <p>Transaction processed through BidKE platform</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Processing Guidelines */}
        {/* Payment Processing Guidelines */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-primary mb-2">
            Payment Processing Guidelines:
          </h4>
          <ul className="text-sm text-primary/80 space-y-1">
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
