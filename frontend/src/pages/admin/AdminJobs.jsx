import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    adminService.getJobs()
      .then((res) => setJobs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (fn, id) => { await fn(id); load(); };

  const filtered = jobs.filter((j) => {
    if (filter === "approved") return j.is_approved === true;
    if (filter === "pending")  return !j.is_approved && j.is_active !== false;
    if (filter === "rejected") return j.is_approved === false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Job Posts</h1>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-full capitalize transition-colors"
              style={{
                background: filter === f ? "var(--accent)" : "var(--bg-card)",
                color: filter === f ? "white" : "var(--text-muted)",
                border: "1px solid var(--border-color)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job._id} className="card p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                    {job.skill || "General"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: job.is_approved ? "#f0fdf4" : job.is_approved === false ? "#fef2f2" : "var(--bg-card)",
                      color: job.is_approved ? "#22c55e" : job.is_approved === false ? "#ef4444" : "var(--text-muted)",
                    }}>
                    {job.is_approved ? "Approved" : job.is_approved === false ? "Rejected" : "Pending"}
                  </span>
                </div>
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{job.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  ₹{job.rate}/{job.type === "hourly" ? "hr" : "mo"} · {job.location || "Remote"}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {job.is_approved !== true && (
                  <button onClick={() => action(adminService.approveJob, job._id)}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ color: "#22c55e", border: "1px solid #22c55e" }}>
                    Approve
                  </button>
                )}
                {job.is_approved !== false && (
                  <button onClick={() => action(adminService.rejectJob, job._id)}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ color: "#f97316", border: "1px solid #f97316" }}>
                    Reject
                  </button>
                )}
                <button onClick={() => { if (confirm("Delete this job?")) action(adminService.deleteJob, job._id); }}
                  className="text-xs px-3 py-1.5 rounded transition-colors"
                  style={{ color: "#ef4444", border: "1px solid #ef4444" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>No jobs found.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminJobs;