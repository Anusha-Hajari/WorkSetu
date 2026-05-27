import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const STATUS_COLORS = {
  open:            { bg: "rgba(16,185,129,0.1)",  color: "#10b981", label: "open" },
  assigned:        { bg: "rgba(99,102,241,0.1)",  color: "#818cf8", label: "Work Undergoing" },
  in_progress:     { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", label: "Work Undergoing" },
  work_undergoing: { bg: "rgba(99,102,241,0.1)",  color: "#818cf8", label: "Work Undergoing" },
  completed:       { bg: "rgba(107,114,128,0.1)", color: "#9ca3af", label: "completed" },
};

function MyPosts() {
  const { data: initialJobs, loading, error } = useFetch("/api/my-posts");
  const [localJobs, setLocalJobs] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (initialJobs) setLocalJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      setLocalJobs(prev => prev.map(j => 
        j._id === data.job_id ? { ...j, status: data.status } : j
      ));
    };

    socket.on("job_status_update", handleStatusUpdate);
    return () => socket.off("job_status_update", handleStatusUpdate);
  }, [socket]);

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            My Job Posts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Jobs you have posted — manage and track their status.
          </p>
        </div>
        <Link to="/post-job" className="btn-primary text-sm">
          + Post New Job
        </Link>
      </div>

      {loading && <Loader />}
      {error && (
        <div className="card p-4 text-sm" style={{ color: "#ef4444" }}>
          Could not load your job posts.
        </div>
      )}

      {!loading && !error && (
        <>
          {localJobs?.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">📭</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No jobs posted yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Post your first job and let the AI find you the best candidates.
              </p>
              <Link to="/post-job" className="btn-primary inline-block mt-4 text-sm">
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {localJobs?.map((job) => {
                const s = STATUS_COLORS[job.status] || STATUS_COLORS.open;
                return (
                  <div key={job._id} className="card p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {job.title || "Untitled Job"}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                          {job.requiredSkill}
                        </span>
                        {job.type && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                            {job.type}
                          </span>
                        )}
                        {job.rate && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                            ₹{job.rate}
                          </span>
                        )}
                      </div>
                      {job.location && (
                        <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                          📍 {job.location}
                        </div>
                      )}
                      <div className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                        Posted {job.created_at ? new Date(job.created_at).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {s.label || job.status || "open"}
                      </span>
                      <Link
                        to={`/jobs/${job._id}`}
                        className="text-xs"
                        style={{ color: "var(--accent-text)" }}
                      >
                        View →
                      </Link>
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

export default MyPosts;