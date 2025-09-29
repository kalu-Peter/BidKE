import React, { useEffect, useState } from "react";
import { apiService } from "@/services/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  User,
  Clock,
  FileText,
} from "lucide-react";

const UserManagementTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingDetails, setViewingDetails] = useState<{
    loading: boolean;
    error?: string | null;
    data?: any | null;
  }>({ loading: false, error: null, data: null });

  // Users loaded from the admin API (pending verifications and more)
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = users.filter((user: any) => {
    const name = (user.name || user.username || "").toString().toLowerCase();
    const email = (user.email || "").toString().toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (user.type || user.role || "buyer") === filterType;
    const matchesStatus =
      filterStatus === "all" || (user.status || "").toString() === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-600";
      case "submitted":
        return "text-yellow-600";
      case "incomplete":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleApproveUser = (userId: number) => {
    setLoading(true);
    apiService
      .reviewUserVerification("approve", userId)
      .then((res) => {
        if (res.success) {
          // remove from list or update status locally
          setUsers((prev) =>
            prev.filter((u) => (u.id || u.user_id) !== userId)
          );
        } else {
          console.error("Approve failed", res.error);
          setError(res.error || "Failed to approve user");
        }
      })
      .catch((err) => {
        console.error("Approve error", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  const handleRejectUser = (userId: number) => {
    const u = users.find((u: any) => (u.id || u.user_id) === userId);
    setSelectedUser(u || null);
    setShowRejectModal(true);
  };

  const handleSuspendUser = (userId: number) => {
    console.log("Suspend user:", userId);
    // Handle user suspension logic
  };

  const handleViewUserDetails = (userId: number) => {
    // Fetch full details (user + buyer profile) from admin endpoint
    setViewingDetails({ loading: true, error: null, data: null });
    apiService
      .getUserDetails(userId)
      .then((res) => {
        if (res.success) {
          const payload: any = (res as any).data || res.data || {};
          setViewingDetails({ loading: false, data: payload, error: null });
          // also set selectedUser for reuse in reject modal if needed
          setSelectedUser(payload.user || null);
        } else {
          setViewingDetails({
            loading: false,
            data: null,
            error: res.error || "Failed to load details",
          });
        }
      })
      .catch((err) => {
        setViewingDetails({
          loading: false,
          data: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  const handleSendMessage = (userId: number) => {
    console.log("Send message to user:", userId);
    // Handle message sending logic
  };

  const submitRejection = () => {
    if (!selectedUser) return;
    setLoading(true);
    apiService
      .reviewUserVerification(
        "reject",
        selectedUser.id || selectedUser.user_id,
        rejectReason
      )
      .then((res) => {
        if (res.success) {
          setUsers((prev) =>
            prev.filter(
              (u) =>
                (u.id || u.user_id) !==
                (selectedUser.id || selectedUser.user_id)
            )
          );
          setShowRejectModal(false);
          setRejectReason("");
          setSelectedUser(null);
        } else {
          setError(res.error || "Failed to reject user");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  // Load pending verifications on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    apiService
      .getUsers({ limit: 50 })
      .then((res) => {
        if (!mounted) return;
        if (res.success) {
          // Our endpoint returns { success, message, data: { total, limit, offset, users } }
          const payload: any =
            (res as any).data || (res as any).data?.data || res.data || {};
          console.debug("getUsers payload:", payload, "raw:", res);
          const list = Array.isArray(payload?.users)
            ? payload.users
            : Array.isArray(payload)
            ? payload
            : [];
          setUsers(list);
        } else {
          setError(res.error || "Failed to load users");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Statistics (computed from loaded users)
  const stats = {
    total: users.length,
    pending: users.filter((u: any) => (u.status || "").toString() === "pending")
      .length,
    approved: users.filter(
      (u: any) => (u.status || "").toString() === "approved"
    ).length,
    suspended: users.filter(
      (u: any) => (u.status || "").toString() === "suspended"
    ).length,
    rejected: users.filter(
      (u: any) => (u.status || "").toString() === "rejected"
    ).length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>User Management</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage user registrations, approvals, and account status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            <p className="text-sm text-blue-600">Total Users</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800">
              {stats.approved}
            </p>
            <p className="text-sm text-green-600">Approved</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-800">
              {stats.suspended}
            </p>
            <p className="text-sm text-gray-600">Suspended</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {loading && (
            <div className="p-4 text-center text-sm text-gray-600">
              Loading users...
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-sm text-red-700 bg-red-50 rounded">
              Error: {error}
            </div>
          )}

          {filteredUsers.map((user) => (
            <div
              key={(
                user.id ||
                user.user_id ||
                user.username ||
                Math.random()
              ).toString()}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {user.type === "seller" ? (
                          <Building className="w-8 h-8 text-blue-600" />
                        ) : (
                          <User className="w-8 h-8 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.name || user.full_name || user.username || "—"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {user.email || user.username || "—"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {user.type}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        Registered{" "}
                        {new Date(
                          user.registrationDate ||
                            user.created_at ||
                            user.createdAt ||
                            Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Shield
                        className={`w-4 h-4 ${getKycStatusColor(
                          user.kycStatus
                        )}`}
                      />
                      <span className={getKycStatusColor(user.kycStatus)}>
                        KYC: {user.kycStatus}
                      </span>
                    </div>
                  </div>

                  {/* Seller-specific info */}
                  {user.type === "seller" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Business License: </span>
                        <span>{user.businessLicense || "Not provided"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Tax PIN: </span>
                        <span>{user.taxPin || "Not provided"}</span>
                      </div>
                      {user.status === "approved" && (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">
                              Total Listings:{" "}
                            </span>
                            <span>{user.totalListings || 0}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Total Sales: </span>
                            <span>
                              Ksh {user.totalSales?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Buyer-specific info */}
                  {user.type === "buyer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">ID Number: </span>
                        <span>{user.idNumber || "Not provided"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Occupation: </span>
                        <span>{user.occupation || "Not provided"}</span>
                      </div>
                    </div>
                  )}

                  {/* Rejection/Suspension info */}
                  {user.status === "rejected" && user.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">
                          Rejection Reason:
                        </span>
                      </div>
                      <p className="text-sm text-red-700">
                        {user.rejectionReason}
                      </p>
                    </div>
                  )}

                  {user.status === "suspended" && user.suspensionReason && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-800">
                          Suspension Reason:
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {user.suspensionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 lg:mt-0 lg:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUserDetails(user.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>

                  {user.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectUser(user.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {user.status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspendUser(user.id)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(user.id)}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "No users match your search criteria"
                : "No users registered yet"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Reject User Registration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to reject the registration for{" "}
                <strong>{selectedUser.name}</strong>. Please provide a reason:
              </p>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={submitRejection}
                  disabled={!rejectReason.trim()}
                >
                  Reject User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingDetails.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl overflow-auto">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-2">User Details</h3>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setViewingDetails({
                      loading: false,
                      data: null,
                      error: null,
                    })
                  }
                >
                  Close
                </Button>
              </div>

              {viewingDetails.loading && <div>Loading...</div>}
              {viewingDetails.error && (
                <div className="text-red-700">{viewingDetails.error}</div>
              )}

              {viewingDetails.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Personal</h4>
                    <p>
                      <strong>Full name:</strong>{" "}
                      {viewingDetails.data.user.full_name ||
                        viewingDetails.data.user.username}
                    </p>
                    <p>
                      <strong>Email:</strong> {viewingDetails.data.user.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {viewingDetails.data.user.phone}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {viewingDetails.data.user.address || "—"}
                    </p>
                    <p>
                      <strong>City:</strong>{" "}
                      {viewingDetails.data.user.city || "—"}
                    </p>
                    <p>
                      <strong>State:</strong>{" "}
                      {viewingDetails.data.user.state || "—"}
                    </p>
                    <p>
                      <strong>Postal code:</strong>{" "}
                      {viewingDetails.data.user.postal_code ||
                        viewingDetails.data.user.postalCode ||
                        "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Buyer / KYC</h4>
                    <p>
                      <strong>National ID:</strong>{" "}
                      {viewingDetails.data.profile?.national_id || "—"}
                    </p>
                    <p>
                      <strong>KYC type:</strong>{" "}
                      {viewingDetails.data.profile?.kyc_type || "—"}
                    </p>
                    <div>
                      <strong>KYC documents:</strong>
                      <div className="mt-2 space-y-2">
                        {Array.isArray(
                          viewingDetails.data.profile?.kyc_documents
                        ) &&
                        viewingDetails.data.profile.kyc_documents.length > 0 ? (
                          viewingDetails.data.profile.kyc_documents.map(
                            (u: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center space-x-2"
                              >
                                <a
                                  className="text-blue-600 underline"
                                  href={u}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Document {i + 1}
                                </a>
                              </div>
                            )
                          )
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <strong>Preferred payment methods:</strong>
                      <div>
                        {Array.isArray(
                          viewingDetails.data.profile?.preferred_payment_methods
                        )
                          ? viewingDetails.data.profile.preferred_payment_methods.join(
                              ", "
                            )
                          : viewingDetails.data.profile
                              ?.preferred_payment_methods || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Management Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            User Management Guidelines:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Verify all business licenses and tax documents for sellers
            </li>
            <li>• Check KYC compliance before approving any registrations</li>
            <li>• Review user history and ratings for suspension decisions</li>
            <li>
              • Provide clear rejection reasons to help users understand
              requirements
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagementTab;
