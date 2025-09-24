import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';

const SellerVerificationsTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const res = await apiService.getPendingSellerVerifications({ limit: 50 });
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data);
    } else {
      setError(res.message || res.error || 'Failed to load');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleReview = async (userId: number, action: 'approve' | 'reject') => {
    const res = await apiService.reviewSellerVerification(action, userId, action === 'reject' ? 'Rejected by admin' : 'Approved by admin');
    if (res.success) {
      // remove from list
      setItems(prev => prev.filter(i => i.user_id !== userId));
    } else {
      alert(res.message || res.error || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Seller Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && items.length === 0 && <div>No pending verifications</div>}

          <div className="space-y-4">
            {items.map(item => (
              <div key={item.user_id} className="p-4 border rounded-md flex items-start justify-between">
                <div>
                  <div className="font-medium">{item.username} &middot; {item.email}</div>
                  <div className="text-sm text-muted-foreground">Business: {item.business_name}</div>
                  <div className="mt-2 flex gap-2">
                    {Array.isArray(item.verification_documents) ? (
                      item.verification_documents.map((d: string, idx: number) => (
                        <a key={idx} href={d} target="_blank" rel="noreferrer" className="text-blue-600 underline">View doc {idx+1}</a>
                      ))
                    ) : (
                      typeof item.verification_documents === 'string' ? <a href={item.verification_documents} target="_blank" rel="noreferrer" className="text-blue-600 underline">View doc</a> : null
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary">{item.verification_status}</Badge>
                  <Button size="sm" onClick={() => handleReview(item.user_id, 'approve')}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview(item.user_id, 'reject')}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerVerificationsTab;
