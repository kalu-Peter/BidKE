import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";

// Simple preview modal (inline)
const PreviewModal: React.FC<{
  item: any;
  onClose: () => void;
  onSubmit: () => void;
  validateAuction: (auction: any) => {
    isComplete: boolean;
    missingFields: string[];
  };
}> = ({ item, onClose, onSubmit, validateAuction }) => {
  if (!item) return null;

  const validation = validateAuction(item);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-3xl border border-border max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Preview: {item.title || "Untitled Auction"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              {item.description || "No description provided"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Starting Price
              </label>
              <p className="font-medium">
                {item.starting_price
                  ? `Ksh ${parseFloat(item.starting_price).toLocaleString()}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <p className="font-medium">
                {item.category_name || item.category_id || "Not set"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <p className="font-medium">
                {item.start_time
                  ? new Date(item.start_time).toLocaleString()
                  : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <p className="font-medium">
                {item.end_time
                  ? new Date(item.end_time).toLocaleString()
                  : "Not set"}
              </p>
            </div>
          </div>

          {!validation.isComplete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800 mb-2">
                Cannot submit - Missing required information:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.missingFields.map((field) => (
                  <li key={field} className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {field.replace("_", " ").charAt(0).toUpperCase() +
                      field.replace("_", " ").slice(1)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!validation.isComplete}
            className={
              !validation.isComplete ? "opacity-50 cursor-not-allowed" : ""
            }
          >
            {validation.isComplete
              ? "Submit for Review"
              : "Complete Required Fields First"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DraftsTab: React.FC = () => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Validation function to check if auction has all required fields
  const validateAuction = (auction: any) => {
    const requiredFields = [
      "title",
      "description",
      "starting_price",
      "start_time",
      "end_time",
      "category_id",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = auction[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  };

  const submitDraft = async (auctionId: number, itemData: any) => {
    // Validate before submitting
    const validation = validateAuction(itemData);
    if (!validation.isComplete) {
      window.alert("Cannot submit: Please complete all required fields first.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        // Update status to pending (submitted for admin approval)
        status: "pending",
      };

      const resp = await apiService.updateAuction(auctionId, payload);
      if (resp.success) {
        // Refresh the drafts list
        await loadSellerAuctions();
        setPreviewItem(null);
        window.alert(
          "Successfully submitted for admin review! Your auction will go live once approved."
        );
      } else {
        window.alert(
          "Failed to submit for review: " +
            (resp.error || resp.message || "Unknown error")
        );
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      window.alert("Failed to submit: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadSellerAuctions = async () => {
    setLoading(true);
    try {
      // Get draft status auctions - these are incomplete/not submitted
      const respDrafts = await apiService
        .getSellerAuctions({
          sellerId: 0, // API uses session for seller ID
          status: "draft",
          page: 1,
          limit: 50,
        } as any)
        .catch((e) => e);

      if (respDrafts && respDrafts.success && respDrafts.data) {
        const allDrafts = respDrafts.data.auctions || [];
        // Filter drafts to show only truly incomplete ones
        const incompleteDrafts = allDrafts.filter((auction: any) => {
          const validation = validateAuction(auction);
          return !validation.isComplete;
        });
        setDrafts(incompleteDrafts);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerAuctions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Auctions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete your auction details before submitting for approval
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading drafts...</div>
          </div>
        )}

        <div className="space-y-4">
          {!loading && drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No incomplete drafts found.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All your auctions appear to be complete or already submitted.
              </p>
            </div>
          ) : (
            drafts.map((draft, idx) => {
              const validation = validateAuction(draft);
              return (
                <div
                  key={draft.id ? `draft-${draft.id}` : `draft-idx-${idx}`}
                  className="p-4 border rounded-lg bg-card"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">
                        {draft.title || "Untitled Auction"}
                      </h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        Created:{" "}
                        {new Date(draft.created_at).toLocaleDateString()}
                      </div>

                      {!validation.isComplete && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Missing required information:
                          </p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {validation.missingFields.map((field) => (
                              <li key={field} className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                {field
                                  .replace("_", " ")
                                  .charAt(0)
                                  .toUpperCase() +
                                  field.replace("_", " ").slice(1)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.alert(
                            "Edit functionality will be implemented to navigate to auction form with ID: " +
                              draft.id
                          )
                        }
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewItem(draft)}
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onSubmit={() => submitDraft(previewItem.id, previewItem)}
          validateAuction={validateAuction}
        />
      )}
    </Card>
  );
};

export default DraftsTab;
