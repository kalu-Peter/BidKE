import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw
} from "lucide-react";

const TransactionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Mock data for transactions
  const allTransactions = [
    {
      id: "TXN001",
      type: "auction_payment",
      amount: 1050000,
      currency: "KSH",
      status: "completed",
      payer: {
        name: "John Kamau",
        email: "john@example.com",
        id: "USR123"
      },
      recipient: {
        name: "ABC Auctioneers Ltd",
        email: "abc@auctioneers.com",
        id: "USR456"
      },
      auction: {
        id: "AUC789",
        title: "Honda Civic 2019 - Sedan",
        winningBid: 1050000
      },
      paymentMethod: "M-Pesa",
      processingFee: 21000, // 2%
      platformFee: 31500, // 3%
      sellerPayout: 997500,
      transactionDate: "2024-01-22T14:30:00Z",
      completedDate: "2024-01-22T14:32:00Z",
      reference: "MP240122143000",
      description: "Payment for winning bid on Honda Civic auction"
    },
    {
      id: "TXN002",
      type: "listing_fee",
      amount: 500,
      currency: "KSH",
      status: "completed",
      payer: {
        name: "Tech Repos Ltd",
        email: "info@techrepos.com",
        id: "USR789"
      },
      recipient: {
        name: "BidLode Platform",
        email: "admin@bidlode.com",
        id: "PLATFORM"
      },
      listing: {
        id: "LST456",
        title: "Samsung Galaxy S21 Ultra - 256GB"
      },
      paymentMethod: "Credit Card",
      processingFee: 15, // 3%
      platformRevenue: 485,
      transactionDate: "2024-01-21T09:15:00Z",
      completedDate: "2024-01-21T09:16:00Z",
      reference: "CC240121091500",
      description: "Listing fee for Samsung Galaxy smartphone"
    },
    {
      id: "TXN003",
      type: "refund",
      amount: 25000,
      currency: "KSH",
      status: "pending",
      payer: {
        name: "BidLode Platform",
        email: "admin@bidlode.com",
        id: "PLATFORM"
      },
      recipient: {
        name: "Mary Wanjiku",
        email: "mary@example.com",
        id: "USR321"
      },
      auction: {
        id: "AUC654",
        title: "iPhone 13 Pro - 128GB",
        refundReason: "Item not as described"
      },
      paymentMethod: "M-Pesa",
      processingFee: 500,
      refundAmount: 24500,
      transactionDate: "2024-01-20T16:45:00Z",
      initiatedDate: "2024-01-20T16:45:00Z",
      reference: "RF240120164500",
      description: "Refund for disputed iPhone purchase",
      estimatedCompletion: "2024-01-23T16:45:00Z"
    },
    {
      id: "TXN004",
      type: "auction_payment",
      amount: 85000,
      currency: "KSH",
      status: "failed",
      payer: {
        name: "Peter Ochieng",
        email: "peter@example.com",
        id: "USR654"
      },
      recipient: {
        name: "Digital Solutions",
        email: "sales@digitalsol.com",
        id: "USR987"
      },
      auction: {
        id: "AUC321",
        title: "MacBook Pro 2020 - M1 Chip",
        winningBid: 85000
      },
      paymentMethod: "Bank Transfer",
      processingFee: 1700,
      platformFee: 2550,
      failureReason: "Insufficient funds",
      transactionDate: "2024-01-19T11:20:00Z",
      failedDate: "2024-01-19T11:25:00Z",
      reference: "BT240119112000",
      description: "Payment attempt for MacBook auction win",
      retryCount: 2,
      nextRetry: "2024-01-23T11:20:00Z"
    },
    {
      id: "TXN005",
      type: "commission",
      amount: 75000,
      currency: "KSH",
      status: "completed",
      payer: {
        name: "Premium Motors",
        email: "info@premiummotors.com",
        id: "USR111"
      },
      recipient: {
        name: "BidLode Platform",
        email: "admin@bidlode.com",
        id: "PLATFORM"
      },
      auction: {
        id: "AUC555",
        title: "Toyota Hilux 2018 - Double Cab",
        finalPrice: 1500000,
        commissionRate: 5
      },
      paymentMethod: "Auto-deduction",
      platformRevenue: 75000,
      transactionDate: "2024-01-18T13:10:00Z",
      completedDate: "2024-01-18T13:10:00Z",
      reference: "COM240118131000",
      description: "5% commission on Toyota Hilux sale"
    },
    {
      id: "TXN006",
      type: "deposit",
      amount: 50000,
      currency: "KSH",
      status: "completed",
      payer: {
        name: "Grace Mutindi",
        email: "grace@example.com",
        id: "USR999"
      },
      recipient: {
        name: "BidLode Escrow",
        email: "escrow@bidlode.com",
        id: "ESCROW"
      },
      auction: {
        id: "AUC888",
        title: "Yamaha R15 V3 - Sport Bike",
        requiredDeposit: 50000
      },
      paymentMethod: "M-Pesa",
      processingFee: 1000,
      escrowAmount: 49000,
      transactionDate: "2024-01-17T08:30:00Z",
      completedDate: "2024-01-17T08:32:00Z",
      reference: "DEP240117083000",
      description: "Security deposit for motorcycle auction participation",
      releaseCondition: "Auction completion or non-winning"
    }
  ];

  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.payer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.auction?.title || transaction.listing?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    // Simple date filtering (could be enhanced with actual date range picker)
    let matchesDate = true;
    const transactionDate = new Date(transaction.transactionDate);
    const now = new Date();
    
    if (dateRange === "today") {
      matchesDate = transactionDate.toDateString() === now.toDateString();
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "auction_payment":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "listing_fee":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case "refund":
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case "commission":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case "deposit":
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number, currency: string = "KSH") => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = (transactionId: string) => {
    const transaction = allTransactions.find(t => t.id === transactionId);
    setSelectedTransaction(transaction);
  };

  const handleRetryTransaction = (transactionId: string) => {
    console.log("Retry transaction:", transactionId);
    // Handle transaction retry logic
  };

  const handleRefundTransaction = (transactionId: string) => {
    console.log("Process refund for transaction:", transactionId);
    // Handle refund processing logic
  };

  // Calculate statistics
  const stats = {
    total: allTransactions.length,
    completed: allTransactions.filter(t => t.status === "completed").length,
    pending: allTransactions.filter(t => t.status === "pending").length,
    failed: allTransactions.filter(t => t.status === "failed").length,
    totalVolume: allTransactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    totalRevenue: allTransactions
      .filter(t => t.status === "completed" && (t.type === "commission" || t.type === "listing_fee"))
      .reduce((sum, t) => {
        if (t.type === "commission") return sum + t.platformRevenue;
        if (t.type === "listing_fee") return sum + (t.platformRevenue || t.amount);
        return sum;
      }, 0)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Transaction Management</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Monitor payments, refunds, fees, and platform revenue
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            <p className="text-sm text-blue-600">Total</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
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
            <p className="text-sm text-purple-600">Volume</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-teal-800">
              {formatAmount(stats.totalRevenue)}
            </p>
            <p className="text-sm text-teal-600">Revenue</p>
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="auction_payment">Auction Payments</SelectItem>
              <SelectItem value="listing_fee">Listing Fees</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
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
            <div key={transaction.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Transaction Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {transaction.id}
                      </h3>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status.replace('_', ' ')}
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
                      <p className="font-medium text-gray-900">{transaction.payer.name}</p>
                      <p className="text-sm text-gray-500">{transaction.payer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">{transaction.recipient.name}</p>
                      <p className="text-sm text-gray-500">{transaction.recipient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="font-medium text-gray-700">{transaction.paymentMethod}</p>
                      <p className="text-sm text-gray-500">{transaction.reference}</p>
                    </div>
                  </div>

                  {/* Related Item */}
                  {(transaction.auction || transaction.listing) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Related {transaction.auction ? 'Auction' : 'Listing'}:
                      </p>
                      <p className="font-medium text-gray-900">
                        {transaction.auction?.title || transaction.listing?.title}
                      </p>
                      {transaction.auction?.winningBid && (
                        <p className="text-sm text-green-600">
                          Winning bid: {formatAmount(transaction.auction.winningBid)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status-specific Information */}
                  {transaction.status === 'failed' && transaction.failureReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Failure Reason:</span>
                      </div>
                      <p className="text-sm text-red-700">{transaction.failureReason}</p>
                      {transaction.nextRetry && (
                        <p className="text-sm text-red-600 mt-1">
                          Next retry: {formatDate(transaction.nextRetry)}
                        </p>
                      )}
                    </div>
                  )}

                  {transaction.status === 'pending' && transaction.estimatedCompletion && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Estimated Completion:</span>
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
                          <p className="text-sm text-blue-600">Processing Fee</p>
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
                      {(transaction.sellerPayout || transaction.refundAmount || transaction.escrowAmount) && (
                        <div>
                          <p className="text-sm text-blue-600">
                            {transaction.sellerPayout ? 'Seller Payout' : 
                             transaction.refundAmount ? 'Refund Amount' : 'Escrow Amount'}
                          </p>
                          <p className="font-medium text-blue-800">
                            {formatAmount(
                              transaction.sellerPayout || 
                              transaction.refundAmount || 
                              transaction.escrowAmount || 0
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
                      <span>Created: {formatDate(transaction.transactionDate)}</span>
                    </div>
                    {transaction.completedDate && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed: {formatDate(transaction.completedDate)}</span>
                      </div>
                    )}
                    {transaction.failedDate && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Failed: {formatDate(transaction.failedDate)}</span>
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
                  
                  {transaction.status === 'failed' && (
                    <Button 
                      size="sm"
                      onClick={() => handleRetryTransaction(transaction.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  )}

                  {transaction.status === 'completed' && transaction.type === 'auction_payment' && (
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" || dateRange !== "all"
                ? "No transactions match your search criteria"
                : "No transactions recorded yet"}
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
              setDateRange("all");
            }}>
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
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <p className="font-mono text-lg">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedTransaction.status)}>
                        {selectedTransaction.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="font-medium">{selectedTransaction.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="font-bold text-lg text-green-600">
                      {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reference</label>
                      <p className="font-mono">{selectedTransaction.reference}</p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Transaction Parties</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">From</label>
                      <p className="font-medium">{selectedTransaction.payer.name}</p>
                      <p className="text-sm text-gray-500">{selectedTransaction.payer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">To</label>
                      <p className="font-medium">{selectedTransaction.recipient.name}</p>
                      <p className="text-sm text-gray-500">{selectedTransaction.recipient.email}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm">{formatDate(selectedTransaction.transactionDate)}</span>
                    </div>
                    {selectedTransaction.completedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="text-sm">{formatDate(selectedTransaction.completedDate)}</span>
                      </div>
                    )}
                    {selectedTransaction.failedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed:</span>
                        <span className="text-sm">{formatDate(selectedTransaction.failedDate)}</span>
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
                  {selectedTransaction.status === 'failed' && (
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
          <h4 className="font-medium text-blue-900 mb-2">Payment Processing Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Monitor failed transactions and initiate retries where appropriate</li>
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
