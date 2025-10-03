import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tx = searchParams.get("tx");
  const auctionId = searchParams.get("auction_id");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const completePayment = async () => {
    if (!tx) return setMessage("Missing transaction reference");
    setLoading(true);
    try {
      const res = await fetch("/payments/webhook.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_ref: tx,
          status: "success",
          amount: null,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setMessage(
          "Payment completed successfully. You may close this window."
        );
      } else {
        setMessage(
          "Webhook call failed: " + (data?.message || JSON.stringify(data))
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
