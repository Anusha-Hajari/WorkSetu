import React from "react";
import { useFetch } from "../hooks/useFetch";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  pending: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", label: "Pending" },
  accepted: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "Accepted" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" },
};

function MyApplications() {
  const { data: apps, loading, error } = useFetch("/api/applications/my-applications");

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          My Applications
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Jobs you have applied to — track your status here.
        </p>
      </div>

      {loading && <Loader />}
      {error && (
        <div className="card p-4 text-sm" style={{ color: "#ef4444" }}>
          Could not load applications. Make sure you're logged in.
        </div>
      )}

      {!loading && !error && (
        <>
          {apps?.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-3xl mb-3">📭</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>No applications yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Browse jobs and hit Apply to get started.
              </p>
              <Link to="/jobs" className="btn-primary inline-block mt-4 text-sm">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps?.map((app) => {
                const s = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                return (
                  <div key={app._id} className="card p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {app.job_title || "Untitled Job"}
                        </div>
                        {app.is_urgent && (
                          <span className="text-[9px] font-black uppercase tracking-tighter bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {app.job_skill && (
                          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <span className="text-slate-500">Skill:</span> {app.job_skill}
                          </div>
                        )}
                        {app.rate && (
                          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <span className="text-slate-500">Bid/Rate:</span> ₹{app.rate}
                          </div>
                        )}
                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <span className="text-slate-500">Type:</span> {app.job_type}
                        </div>
                      </div>

                      <div className="text-[10px] mt-2" style={{ color: "var(--text-hint)" }}>
                        Applied {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <Link to={app.is_urgent ? `/jobs` : `/jobs/${app.job_id}`} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">
                        View Details →
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

export default MyApplications;