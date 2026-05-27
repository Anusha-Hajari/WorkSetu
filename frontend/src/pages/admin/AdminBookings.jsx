import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getBookings()
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Bookings</h1>
      {loading ? <Loader /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                {["Booking ID", "Job", "Date", "Time", "Status", "Amount"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-hint)" }}>
                    {b._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{b.job?.title || "—"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{b.date || "—"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{b.time || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: b.status === "completed" ? "#f0fdf4" : "var(--bg-card)",
                        color: b.status === "completed" ? "#22c55e" : "var(--text-muted)",
                      }}>
                      {b.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--accent-text)" }}>
                    {b.amount ? `₹${b.amount}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>No bookings yet.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminBookings;