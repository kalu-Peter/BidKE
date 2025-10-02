import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";
import { Trophy, Trash2, Printer } from "lucide-react";

const WonAuctionsAdmin: React.FC = () => {
  const [rows, setRows] = React.useState<any[]>([]);
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
              className="border rounded px-2 py-1"
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
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>

        <div id="won-admin-print">
          <table className="w-full text-sm">
            <thead>
              <tr>
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
                <tr key={r.winner_record_id}>
                  <td>{r.winner_record_id}</td>
                  <td>
                    {r.auction_title} ({r.auction_id})
                  </td>
                  <td>{r.winner_username ?? "—"}</td>
                  <td>{r.seller_name ?? "—"}</td>
                  <td>Ksh {Number(r.winning_amount).toLocaleString()}</td>
                  <td>{r.won_at}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(r.winner_record_id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
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
    </Card>
  );
};

export default WonAuctionsAdmin;
