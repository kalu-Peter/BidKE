import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, Save, X } from "lucide-react";

interface UserVerification {
  user_id: number;
  username: string;
  email: string;
  // Users table fields
  user_status: string;
  user_verified: boolean;
  // Seller profiles table fields
  verification_status?: string;
  verified_by?: number;
  seller_status?: string;
  verified_by_username?: string;
}

interface UpdateData {
  // Users table fields
  user_status?: string;
  is_verified?: boolean;
  // Seller profiles table fields
  verification_status?: string;
  verified_by?: number;
  seller_status?: string;
}

const VerificationsTab: React.FC = () => {
  const [users, setUsers] = useState<UserVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [verificationStatusFilter, setVerificationStatusFilter] =
    useState("all");
  const [editingUser, setEditingUser] = useState<UserVerification | null>(null);
  const [updateData, setUpdateData] = useState<UpdateData>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user has session token
      const token = localStorage.getItem("bidlode_session_token");
      if (!token) {
        setError("No authentication token found. Please log in as admin.");
        return;
      }

      const params = {
        limit: 50,
        ...(search && { search }),
        ...(userStatusFilter &&
          userStatusFilter !== "all" && { user_status: userStatusFilter }),
        ...(verificationStatusFilter &&
          verificationStatusFilter !== "all" && {
            verification_status: verificationStatusFilter,
          }),
      };

      const result = await apiService.getUsersVerificationManagement(params);

      if (result.success && result.data) {
        // The API returns an object with 'users' array inside
        const usersData = result.data.users || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setError(result.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, userStatusFilter, verificationStatusFilter]);

  const handleEdit = (user: UserVerification) => {
    setEditingUser(user);
    setUpdateData({
      user_status: user.user_status,
      is_verified: user.user_verified,
      verification_status: user.verification_status || "",
      verified_by: user.verified_by || undefined,
      seller_status: user.seller_status || "",
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const result = await apiService.updateUserVerificationStatus(
        editingUser.user_id,
        updateData
      );

      if (result.success) {
        setIsDialogOpen(false);
        setEditingUser(null);
        setUpdateData({});
        await fetchUsers();
      } else {
        setError(result.message || "Failed to update user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "inactive":
      case "rejected":
        return "destructive";
      case "suspended":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Verification Management</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by username, email, or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={userStatusFilter}
              onValueChange={setUserStatusFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={verificationStatusFilter}
              onValueChange={setVerificationStatusFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-600 text-center py-4">{error}</div>
          )}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status (Users)</TableHead>
                  <TableHead>Is Verified (Users)</TableHead>
                  <TableHead>Verification Status (Seller)</TableHead>
                  <TableHead>Seller Status</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.user_status)}>
                        {user.user_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.user_verified ? "default" : "secondary"}
                      >
                        {user.user_verified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.verification_status ? (
                        <Badge
                          variant={getStatusBadgeVariant(
                            user.verification_status
                          )}
                        >
                          {user.verification_status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">No Seller Profile</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.seller_status ? (
                        <Badge
                          variant={getStatusBadgeVariant(user.seller_status)}
                        >
                          {user.seller_status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.verified_by_username ? (
                        <div className="text-sm">
                          {user.verified_by_username}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Verification Status</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Users Table Fields</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-status">Status</Label>
                    <Select
                      value={updateData.user_status || "active"}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          user_status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="is-verified">Is Verified</Label>
                    <Select
                      value={updateData.is_verified?.toString() || "false"}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          is_verified: value === "true",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Seller Profiles Table Fields
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="verification-status">
                      Verification Status
                    </Label>
                    <Select
                      value={updateData.verification_status || "pending"}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          verification_status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seller-status">Seller Status</Label>
                    <Select
                      value={updateData.seller_status || "active"}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          seller_status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seller status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationsTab;
