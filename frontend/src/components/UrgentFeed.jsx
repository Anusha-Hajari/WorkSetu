import { useState, useEffect, useCallback } from "react";
import { urgentService } from "../services/urgentService";
import { useAuth } from "../hooks/useAuth";
import socket from "../services/socket";
import UrgentJobCard from "./UrgentJobCard";
import PostUrgentJob from "./PostUrgentJob";

export default function UrgentFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const data = await urgentService.getActive();
      setJobs(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);

    // Listen for real-time status updates
    const handleStatusChange = ({ job_id, status }) => {
      setJobs((prev) => 
        prev.map(j => j._id === job_id ? { ...j, status } : j)
      );
    };

    socket.on("job_status_change", handleStatusChange);
    socket.on("new_urgent_job", load); // Also refresh on new jobs

    return () => {
      clearInterval(interval);
      socket.off("job_status_change", handleStatusChange);
      socket.off("new_urgent_job", load);
    };
  }, [load]);

  const filtered = jobs.filter((j) => {
    if (filter === "remote") return j.work_mode === "remote";
    if (filter === "onsite") return j.work_mode === "onsite";
    return true;
  });

  return (
    <div style={{ marginBottom: 48 }}>

      {/* Section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 3,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#ef4444",
              animation: "pulse 1.2s infinite",
            }} />
            <span style={{
              fontSize: 9, fontWeight: 800,
              letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#ef4444", fontFamily: "'Inter', sans-serif",
            }}>
              Live
            </span>
          </div>

          <div>
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 20, fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "1px", margin: 0,
            }}>
              Urgent Requests
            </h2>
            <p style={{
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "'Inter', sans-serif",
              margin: "2px 0 0",
            }}>
              {filtered.length} active · refreshes every 30s ·{" "}
              <span style={{ color: "var(--text-hint)" }}>
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter tabs */}
          <div style={{
            display: "flex",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 3,
            padding: 3,
            gap: 2,
          }}>
            {["all", "remote", "onsite"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "5px 12px",
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "capitalize",
                borderRadius: 2, border: "none",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                background: filter === f ? "var(--bg-surface)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                borderBottom: filter === f ? "1px solid var(--accent)" : "1px solid transparent",
                transition: "all 0.15s",
              }}>
                {f}
              </button>
            ))}
          </div>

          <button onClick={load} style={{
            padding: "7px 12px",
            fontSize: 11, fontWeight: 600,
            background: "transparent",
            border: "1px solid var(--border-color)",
            borderRadius: 3, cursor: "pointer",
            color: "var(--text-muted)",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
            ↻ Refresh
          </button>

          {user && (
            <button onClick={() => setShowPost(true)} style={{
              padding: "7px 16px",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.5px",
              background: "#ef4444",
              border: "none", borderRadius: 3,
              color: "#fff", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}>
              <span style={{ fontSize: 13 }}>⚡</span>
              Post Urgent
            </button>
          )}
        </div>
      </div>

      {/* Post modal */}
      {showPost && (
        <PostUrgentJob
          onClose={() => setShowPost(false)}
          onPosted={(job) => { setJobs((p) => [job, ...p]); setShowPost(false); }}
        />
      )}

      {/* Feed content */}
      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 10,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 160,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 4,
              animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "40px 24px",
          textAlign: "center",
          background: "var(--bg-surface)",
          border: "1px dashed var(--border-color)",
          borderRadius: 4,
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: "50%",
            border: "1px solid var(--border-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
            color: "var(--text-hint)", fontSize: 18,
          }}>⟡</div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 14, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 6,
          }}>
            No Urgent Requests
          </div>
          <p style={{
            fontSize: 12, color: "var(--text-muted)",
            fontFamily: "'Inter', sans-serif", marginBottom: 16,
          }}>
            Be the first — post an urgent request and get matched in minutes
          </p>
          {user && (
            <button onClick={() => setShowPost(true)} style={{
              padding: "9px 20px", fontSize: 12, fontWeight: 700,
              background: "#ef4444", color: "#fff",
              border: "none", borderRadius: 3, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}>
              ⚡ Post Urgent Request
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 10,
        }}>
          {filtered.map((job, i) => (
            <UrgentJobCard key={job._id} job={job} index={i} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  );
}