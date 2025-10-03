import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";
import { Trophy, Trash2, Printer, Eye } from "lucide-react";

const WonAuctionsAdmin: React.FC = () => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = React.useState<any[]>([]);
  const [showPending, setShowPending] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<any | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const fetchPage = React.useCallback(
    async (p = page, l = limit) => {
      setLoading(true);
      try {
        const res = await apiService.adminGetWonAuctions({ page: p, limit: l });
        if (res && res.success) {
          setRows(res.data || []);
          setTotal(
            (res as any).total ?? (res.data ? (res.data as any).total ?? 0 : 0)
          );
        } else {
          setRows([]);
          setTotal(0);
        }
      } catch (e) {
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  React.useEffect(() => {
    fetchPage(1, limit);
  }, [limit]);

  React.useEffect(() => {
    if (showPending) {
      fetchPending(1, 50);
    }
  }, [showPending]);

  const fetchPending = React.useCallback(async (p = 1, l = 50) => {
    setLoading(true);
    try {
      const res = await apiService.adminListPendingPayments({
        page: p,
        limit: l,
      });
      if (res && res.success) {
        setPendingPayments(res.data || []);
      } else {
        setPendingPayments([]);
      }
    } catch (e) {
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete winner record #" + id + "?")) return;
    setLoading(true);
    const res = await apiService.adminDeleteWinner(id);
    setLoading(false);
    if (res && res.success) {
      fetchPage(page, limit);
    } else {
      alert("Delete failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit || 1));

  const handlePrint = () => {
    // Print only the table / card area
    const printContent = document.getElementById("won-admin-print")?.innerHTML;
    if (!printContent) return alert("Nothing to print");
    const w = window.open("", "_blank");
    if (!w) return alert("Unable to open print window");
    w.document.write("<html><head><title>Won Auctions</title>");
    w.document.write(
      "<style>body{font-family: Arial, sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f4f4f4;}</style>"
    );
    w.document.write("</head><body>");
    w.document.write(printContent);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Won Auctions (Admin)</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage recorded winners across auctions
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Per page:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border rounded bg-primary/20 px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => fetchPage(page, limit)}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant={showPending ? "secondary" : "ghost"}
              onClick={() => setShowPending(!showPending)}
            >
              Pending Payments
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>

        <div id="won-admin-print">
          {showPending && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Pending Payments</h4>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Auction</th>
                    <th>Winner</th>
                    <th>Amount</th>
                    <th>Txn Ref</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p) => (
                    <tr key={p.payment_id} className="align-top">
                      <td className="p-2">{p.payment_id}</td>
                      <td className="p-2">
                        {p.auction_title} ({p.auction_id})
                      </td>
                      <td className="p-2">{p.winner_username}</td>
                      <td className="p-2">
                        Ksh {Number(p.amount).toLocaleString()}
                      </td>
                      <td className="p-2">{p.transaction_ref}</td>
                      <td className="p-2">{p.created_at}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Confirm payment #" + p.payment_id + "?"
                                )
                              )
                                return;
                              setLoading(true);
                              const res = await apiService.adminConfirmPayment(
                                p.payment_id
                              );
                              setLoading(false);
                              if (res && res.success) {
                                alert("Payment confirmed");
                                fetchPending(1, 50);
                                fetchPage(page, limit);
                              } else {
                                alert(
                                  "Confirm failed: " + (res?.message || "error")
                                );
                              }
                            }}
                          >
                            Confirm
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Auction</th>
                <th>Winner</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Won At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.winner_record_id} className="align-top">
                  <td className="p-2 w-16">
                    {r.primary_image ? (
                      <img
                        src={r.primary_image}
                        alt={r.auction_title}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-primary/20 rounded flex items-center justify-center text-xs text-gray-400">
                        No
                      </div>
                    )}
                  </td>
                  <td className="p-2">{r.winner_record_id}</td>
                  <td className="p-2">
                    {r.auction_title} ({r.auction_id})
                  </td>
                  <td className="p-2">{r.winner_username ?? "—"}</td>
                  <td className="p-2">{r.seller_name ?? "—"}</td>
                  <td className="p-2">
                    Ksh {Number(r.winning_amount).toLocaleString()}
                  </td>
                  <td className="p-2">{r.won_at}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setDetailRow(r)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(r.winner_record_id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            Page {page} of {totalPages} — {total} records
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                  fetchPage(page - 1, limit);
                }
              }}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (page < totalPages) {
                  setPage(page + 1);
                  fetchPage(page + 1, limit);
                }
              }}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Details Modal */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Auction Winner Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailRow(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                {detailRow.primary_image ? (
                  <img
                    src={detailRow.primary_image}
                    alt={detailRow.auction_title}
                    className="w-full h-56 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-56 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <h4 className="text-xl font-bold mb-2">
                  {detailRow.auction_title}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Auction ID: {detailRow.auction_id}
                </p>
                <p className="mb-2">
                  <strong>Winner:</strong> {detailRow.winner_username ?? "—"}{" "}
                  (ID: {detailRow.winner_id ?? "—"})
                </p>
                <p className="mb-2">
                  <strong>Seller:</strong> {detailRow.seller_name ?? "—"} (ID:{" "}
                  {detailRow.seller_id ?? "—"})
                </p>
                <p className="mb-2">
                  <strong>Winning Amount:</strong> Ksh{" "}
                  {Number(detailRow.winning_amount).toLocaleString()}
                </p>
                <p className="mb-2">
                  <strong>Won At:</strong> {detailRow.won_at}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WonAuctionsAdmin;
