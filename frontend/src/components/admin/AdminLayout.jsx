import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

const NAV = [
  { label: "Overview",  to: "/admin",           icon: "◉" },
  { label: "Users",     to: "/admin/users",      icon: "👥" },
  { label: "Jobs",      to: "/admin/jobs",       icon: "💼" },
  { label: "Bookings",  to: "/admin/bookings",   icon: "📅" },
  { label: "Payments",  to: "/admin/payments",   icon: "💳" },
  { label: "Disputes",  to: "/admin/disputes",   icon: "⚠" },
  { label: "AI Audit",  to: "/admin/ai-audit",   icon: "⚡" },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentPage = NAV.find((n) => n.to === location.pathname)?.label || "Admin";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* Sidebar */}
      <aside className="flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: sidebarOpen ? 220 : 56,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-color)",
        }}>

        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 py-4"
          style={{ borderBottom: "1px solid var(--border-color)", minHeight: 56 }}>
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "var(--accent)" }}>WS</div>
              <div>
                <div className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>WorkSetu</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Admin</div>
              </div>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              marginLeft: sidebarOpen ? 0 : "auto",
              marginRight: sidebarOpen ? 0 : "auto",
            }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={sidebarOpen
                  ? "M11 19l-7-7 7-7M18 19l-7-7 7-7"
                  : "M13 5l7 7-7 7M6 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className="flex items-center rounded-lg text-sm font-medium transition-colors"
                style={{
                  gap: sidebarOpen ? 10 : 0,
                  padding: sidebarOpen ? "8px 12px" : "8px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  color: active ? "var(--accent-text)" : "var(--text-muted)",
                  background: active ? "var(--accent-soft)" : "transparent",
                }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 space-y-0.5" style={{ borderTop: "1px solid var(--border-color)" }}>
          <button onClick={toggle} title="Toggle theme"
            className="flex items-center rounded-lg text-sm w-full transition-colors"
            style={{
              gap: sidebarOpen ? 10 : 0,
              padding: sidebarOpen ? "8px 12px" : "8px 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              color: "var(--text-muted)",
            }}>
            <span style={{ fontSize: 15 }}>{theme === "dark" ? "☀" : "🌙"}</span>
            {sidebarOpen && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
          </button>

          <Link to="/" title="Back to site"
            className="flex items-center rounded-lg text-sm transition-colors"
            style={{
              gap: sidebarOpen ? 10 : 0,
              padding: sidebarOpen ? "8px 12px" : "8px 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              color: "var(--text-muted)",
            }}>
            <span style={{ fontSize: 15 }}>←</span>
            {sidebarOpen && <span>Back to site</span>}
          </Link>

          <button onClick={() => { logout(); navigate("/admin/login"); }}
            title="Logout"
            className="flex items-center rounded-lg text-sm w-full transition-colors"
            style={{
              gap: sidebarOpen ? 10 : 0,
              padding: sidebarOpen ? "8px 12px" : "8px 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              color: "#ef4444",
            }}>
            <span style={{ fontSize: 15 }}>→</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{
            borderBottom: "1px solid var(--border-color)",
            background: "var(--bg-surface)",
          }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {currentPage}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--accent)" }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{user?.name}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}