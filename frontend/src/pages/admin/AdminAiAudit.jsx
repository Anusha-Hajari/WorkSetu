import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

export default function AdminAiAudit() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState("high");

  useEffect(() => {
    adminService.getAiAudit().then((r) => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  const sorted = [...jobs].sort((a, b) =>
    sort === "high" ? (b.ai_score || 0) - (a.ai_score || 0) : (a.ai_score || 0) - (b.ai_score || 0)
  );

  const avgScore = jobs.length
    ? Math.round(jobs.reduce((s, j) => s + (j.ai_score || 0), 0) / jobs.length)
    : 0;

  const scoreColor = (s) => {
    if (s >= 80) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>AI Score Audit</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {jobs.length} jobs scored · avg score{" "}
            <span style={{ color: scoreColor(avgScore), fontWeight: 600 }}>{avgScore}%</span>
          </p>
        </div>
        <div className="flex gap-2">
          {[["high", "Highest first"], ["low", "Lowest first"]].map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: sort === val ? "var(--accent)" : "var(--bg-card)",
                color: sort === val ? "white" : "var(--text-muted)",
                border: "1px solid var(--border-color)",
              }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No AI scores yet</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Scores will appear once jobs have been matched and scored.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((job) => {
            const score = job.ai_score || 0;
            return (
              <div key={job._id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                      {job.skill || "General"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-hint)" }}>{job.type || "hourly"}</span>
                  </div>
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{job.title}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>Score</span>
                      <span style={{ color: scoreColor(score), fontWeight: 600 }}>{score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--bg-card)" }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${score}%`, background: scoreColor(score) }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}