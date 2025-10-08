import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api";
import { Clock, Eye, AlertCircle } from "lucide-react";

const PendingTab: React.FC = () => {
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingAuctions = async () => {
    setLoading(true);
    try {
      // Get auctions with "pending" status - submitted for admin approval
      const response = await apiService.getSellerAuctions({
        sellerId: 0, // API uses session for seller ID
        status: "pending",
        page: 1,
        limit: 50,
      } as any);

      if (response && response.success && response.data) {
        setPendingAuctions(response.data.auctions || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load pending auctions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingAuctions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Approval
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Auctions submitted for admin review and awaiting approval to go live
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Loading pending auctions...
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!loading && pendingAuctions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No pending auctions
              </h3>
              <p className="text-muted-foreground">
                You don't have any auctions waiting for approval at the moment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete your drafts and submit them for review to see them
                here.
              </p>
            </div>
          ) : (
            pendingAuctions.map((auction) => (
              <div
                key={auction.id}
                className="p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-lg">{auction.title}</h4>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status.charAt(0).toUpperCase() +
                          auction.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Starting Price:
                        </span>
                        <span className="ml-2 font-medium">
                          Ksh{" "}
                          {parseFloat(
                            auction.starting_price || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-2 font-medium">
                          {auction.category_name || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Submitted:
                        </span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            auction.updated_at || auction.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Auction Period:
                        </span>
                        <span className="ml-2 font-medium">
                          {auction.start_time && auction.end_time
                            ? `${new Date(
                                auction.start_time
                              ).toLocaleDateString()} - ${new Date(
                                auction.end_time
                              ).toLocaleDateString()}`
                            : "Dates not set"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Awaiting Admin Review
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your auction has been submitted and is in the approval
                        queue. You'll be notified once it's been reviewed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement view details functionality
                        window.alert(
                          `View details for auction: ${auction.title}\nID: ${auction.id}`
                        );
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && pendingAuctions.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Admin will review your auction details within 24-48 hours
              </li>
              <li>
                • You'll receive an email notification about the approval status
              </li>
              <li>
                • Approved auctions will automatically go live at the scheduled
                start time
              </li>
              <li>• If rejected, you can edit and resubmit your auction</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingTab;
