import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../components/admin/AdminLayout";
import Loader from "../../components/Loader";

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ background: "var(--accent-soft)" }}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
        <div className="text-2xl font-black" style={{ color: color || "var(--accent-text)" }}>{value ?? "—"}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ data, valueKey, labelKey, color }) {
  if (!data?.length) return (
    <p className="text-xs py-6 text-center" style={{ color: "var(--text-hint)" }}>No data yet</p>
  );
  const max = Math.max(...data.map((d) => d[valueKey])) || 1;
  return (
    <div className="flex items-end gap-1.5 h-20 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm"
            style={{ height: `${Math.max((d[valueKey] / max) * 64, 3)}px`, background: color || "var(--accent)" }} />
          <span style={{ color: "var(--text-hint)", fontSize: 9 }}>{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><Loader /></AdminLayout>;

  const maxSkill = stats?.skills?.[0]?.count || 1;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Platform snapshot — live from your database
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon="👥" label="Total Users"    value={stats?.total_users}    sub="registered accounts" />
        <StatCard icon="💼" label="Total Jobs"     value={stats?.total_jobs}     sub="all time" />
        <StatCard icon="📅" label="Total Bookings" value={stats?.total_bookings} sub="all time" />
        <StatCard icon="✅" label="Completion Rate" value={`${stats?.completion_rate ?? 0}%`} sub="bookings completed" color="#10b981" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon="💳" label="Total Payments" value={stats?.total_payments} sub="transactions" />
        <StatCard icon="🟢" label="Active Jobs"    value={stats?.active_jobs}    sub="currently live" color="#10b981" />
        <StatCard icon="🚫" label="Banned Users"   value={stats?.banned_users}   sub="suspended" color="#ef4444" />
        <StatCard icon="⚠" label="Open Disputes"  value={stats?.open_disputes}  sub="need attention" color="#f59e0b" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            User growth — last 7 days
          </div>
          <MiniBar data={stats?.user_growth} valueKey="count" labelKey="date" color="var(--accent)" />
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Jobs posted — last 7 days
          </div>
          <MiniBar data={stats?.job_growth} valueKey="count" labelKey="date" color="#10b981" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Revenue — last 7 days (₹)
          </div>
          <MiniBar data={stats?.revenue_data} valueKey="amount" labelKey="date" color="#a855f7" />
        </div>

        <div className="card p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Booking completion
          </div>
          <div className="flex items-center gap-5 mt-3">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-card)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke="#10b981" strokeWidth="3.5"
                  strokeDasharray="100"
                  strokeDashoffset={100 - (stats?.completion_rate || 0)}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                  {stats?.completion_rate ?? 0}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {stats?.total_bookings} bookings total
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Completed vs pending ratio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top skills */}
      {stats?.skills?.length > 0 && (
        <div className="card p-5">
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Top skills in demand
          </div>
          <div className="space-y-3">
            {stats.skills.map((s) => (
              <div key={s.skill}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{s.skill}</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.count} jobs</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--bg-card)" }}>
                  <div className="h-1.5 rounded-full"
                    style={{ width: `${Math.round((s.count / maxSkill) * 100)}%`, background: "var(--accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}