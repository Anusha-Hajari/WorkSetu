import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  confirmed:  { bg: "rgba(16,185,129,0.1)",  color: "#10b981", label: "Confirmed" },
  pending:    { bg: "rgba(251,191,36,0.1)",   color: "#fbbf24", label: "Pending"   },
  cancelled:  { bg: "rgba(239,68,68,0.1)",    color: "#ef4444", label: "Cancelled" },
  completed:  { bg: "rgba(107,114,128,0.1)",  color: "#9ca3af", label: "Completed" },
};

function MyBookings() {
  const { data: bookings, loading, error } = useFetch("/api/bookings/my-bookings");

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          My Bookings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Your scheduled sessions and bookings.
        </p>
      </div>

      {loading && <Loader />}
      {error && (
        <div className="card p-4 text-sm" style={{ color: "#ef4444" }}>
          Could not load bookings.
        </div>
      )}

      {!loading && !error && (
        <>
          {bookings?.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">📅</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No bookings yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Browse jobs and book a service to get started.
              </p>
              <Link to="/jobs" className="btn-primary inline-block mt-4 text-sm">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings?.map((b) => {
                const s = STATUS_COLORS[b.status] || STATUS_COLORS.confirmed;
                return (
                  <div key={b._id} className="card p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {b.job_title || "Untitled Job"}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {b.date && <span>📅 {b.date}</span>}
                        {b.time && <span>🕐 {b.time}</span>}
                      </div>
                      {b.notes && (
                        <div className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>
                          Note: {b.notes}
                        </div>
                      )}
                      <div className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                        Booked {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyBookings;