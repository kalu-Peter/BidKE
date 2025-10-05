import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tx = searchParams.get("tx");
  const auctionId = searchParams.get("auction_id");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<number | null>(null);

  // Auto-close countdown effect
  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      try {
        window.close();
      } catch (_e) {}
      return;
    }
    const t = setTimeout(
      () => setCountdown((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(t);
  }, [countdown]);

  const completePayment = async () => {
    if (!tx) return setMessage("Missing transaction reference");
    setLoading(true);
    try {
      const { apiService } = await import("@/services/api");
      const res = await apiService.devConfirmPayment(
        tx || undefined,
        undefined
      );
      if (res && res.success) {
        setMessage("Payment completed successfully.");
        // Dispatch global event so WonAuctionsTab can update without reload
        try {
          const auctionIdNum = auctionId ? Number(auctionId) : undefined;
          const ev = new CustomEvent("payments:processed", {
            detail: {
              auction_id: auctionIdNum,
              payment_id: (res.data as any)?.payment_id,
            },
          });
          window.dispatchEvent(ev);
        } catch (_e) {}

        // show transient toast and start auto-close countdown
        setToast("Payment successful");
        setTimeout(() => setToast(null), 4000);
        setCountdown(5);
      } else {
        setMessage(
          "Webhook call failed: " + (res?.message || JSON.stringify(res))
        );
      }
    } catch (err: any) {
      setMessage("Error calling webhook: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Mock Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Transaction: <strong>{tx}</strong>
              </p>
              <p className="mb-4">
                Auction ID: <strong>{auctionId}</strong>
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                This is a development-only mock checkout page. Clicking
                "Complete Payment" will POST to the webhook endpoint to simulate
                gateway confirmation.
              </p>
              {message && <div className="mb-4">{message}</div>}
              {toast && (
                <div className="fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
                  {toast}
                </div>
              )}
              {countdown !== null && (
                <div className="fixed top-16 right-6 bg-gray-800 text-white px-3 py-1 rounded shadow-lg">
                  Closing in {countdown} second{countdown === 1 ? "" : "s"}...
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} variant="outline">
                  Back
                </Button>
                <Button onClick={completePayment} disabled={loading || !tx}>
                  {loading ? "Completing..." : "Complete Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
