import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

// Group bookings by date
function groupByDate(bookings) {
  const groups = {};
  for (const b of bookings || []) {
    const key = b.date || "No date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  return Object.entries(groups).sort((a, b) => new Date(a[0]) - new Date(b[0]));
}

function Schedule() {
  const { data: bookings, loading, error } = useFetch("/api/bookings/my-bookings");
  const grouped = groupByDate(bookings);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Schedule
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Your upcoming and past sessions in calendar view.
        </p>
      </div>

      {loading && <Loader />}
      {error && (
        <div className="card p-4 text-sm" style={{ color: "#ef4444" }}>
          Could not load schedule.
        </div>
      )}

      {!loading && !error && (
        <>
          {grouped.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">🗓</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No sessions scheduled</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Book a service from any job listing to add it to your schedule.
              </p>
              <Link to="/jobs" className="btn-primary inline-block mt-4 text-sm">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, items]) => {
                const isToday = date === today;
                const isPast = date < today;
                return (
                  <div key={date}>
                    {/* Date header */}
                    <div
                      className="flex items-center gap-3 mb-3"
                    >
                      <div
                        className="text-xs font-bold px-3 py-1.5 rounded"
                        style={{
                          background: isToday ? "var(--accent-soft)" : "var(--bg-card)",
                          color: isToday ? "var(--accent-text)" : "var(--text-muted)",
                          border: isToday ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                        }}
                      >
                        {isToday
                          ? "TODAY"
                          : new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric",
                            })}
                      </div>
                      {isPast && !isToday && (
                        <span className="text-xs" style={{ color: "var(--text-hint)" }}>Past</span>
                      )}
                    </div>

                    {/* Sessions */}
                    <div className="space-y-2 pl-2">
                      {items.map((b) => (
                        <div
                          key={b._id}
                          className="card p-4 flex items-center gap-4"
                          style={{ opacity: isPast ? 0.7 : 1 }}
                        >
                          <div
                            className="w-12 text-center text-xs font-bold rounded"
                            style={{ padding: "6px 4px", background: "var(--bg-surface)", color: "var(--accent-text)" }}
                          >
                            {b.time || "—"}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                              {b.job_title || "Session"}
                            </div>
                            {b.notes && (
                              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {b.notes}
                              </div>
                            )}
                          </div>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                            style={{
                              background: b.status === "confirmed" ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.1)",
                              color: b.status === "confirmed" ? "#10b981" : "#fbbf24",
                            }}
                          >
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
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

export default Schedule;