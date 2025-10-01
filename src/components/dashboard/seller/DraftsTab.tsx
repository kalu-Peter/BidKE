import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";

// Simple preview modal (inline)
const PreviewModal: React.FC<{
  item: any;
  onClose: () => void;
  onSubmit: () => void;
}> = ({ item, onClose, onSubmit }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">Preview: {item.title}</h3>
        <p className="text-sm text-gray-700">{item.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Start</p>
            <p className="font-medium">
              {item.start_time || item.auctionStartDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">End</p>
            <p className="font-medium">
              {item.end_time || item.auctionEndDate}
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onSubmit}>Submit for Review</Button>
        </div>
      </div>
    </div>
  );
};

const DraftsTab: React.FC = () => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const submitDraft = async (auctionId: number, itemData: any) => {
    try {
      setLoading(true);
      const payload = {
        // update status to pending_review
        status: "pending_review",
      };

      // optionally include images or other updated fields
      if (itemData.images) payload["images"] = itemData.images;

      const resp = await apiService.updateAuction(auctionId, payload);
      if (resp.success) {
        // refresh lists
        await loadSellerAuctions();
        setPreviewItem(null);
        window.alert("Submitted for review");
      } else {
        window.alert(
          "Failed to submit for review: " +
            (resp.error || resp.message || "Unknown")
        );
      }
    } catch (err: any) {
      window.alert("Failed to submit: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadSellerAuctions = async () => {
    setLoading(true);
    try {
      // Assuming API supports seller-auctions.php?seller_id=current or uses session
      // We call getSellerAuctions with sellerId omitted if server uses session
      const respDrafts = await apiService
        .getSellerAuctions({
          sellerId: 0,
          status: "draft",
          page: 1,
          limit: 50,
        } as any)
        .catch((e) => e);
      const respPending = await apiService
        .getSellerAuctions({
          sellerId: 0,
          status: "pending_review",
          page: 1,
          limit: 50,
        } as any)
        .catch((e) => e);

      if (respDrafts && respDrafts.success && respDrafts.data)
        setDrafts(respDrafts.data.auctions || []);
      if (respPending && respPending.success && respPending.data)
        setPending(respPending.data.auctions || []);
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
        <CardTitle>Drafts & Pending</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600">{error}</div>}
        <div className="space-y-4">
          <section>
            <h4 className="font-semibold">Drafts</h4>
            {drafts.length === 0 ? (
              <p className="text-sm text-gray-500">No drafts found.</p>
            ) : (
              drafts.map((d, idx) => (
                <div
                  key={d.id ? `draft-${d.id}` : `draft-idx-${idx}`}
                  className="p-3 border rounded mb-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-sm text-gray-500">
                      Status: {d.status}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => window.alert("Edit draft: " + d.id)}
                    >
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => setPreviewItem(d)}>
                      Preview
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section>
            <h4 className="font-semibold">Pending Review</h4>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">No pending items.</p>
            ) : (
              pending.map((d, idx) => (
                <div
                  key={d.id ? `pending-${d.id}` : `pending-idx-${idx}`}
                  className="p-3 border rounded mb-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-sm text-gray-500">
                      Status: {d.status}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => window.alert("View: " + d.id)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </CardContent>
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onSubmit={() => submitDraft(previewItem.id, previewItem)}
        />
      )}
    </Card>
  );
};

export default DraftsTab;
