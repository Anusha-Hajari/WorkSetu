import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

const NAV = [
  { label: "Overview",  to: "/admin",            icon: "◉" },
  { label: "Users",     to: "/admin/users",       icon: "👥" },
  { label: "Jobs",      to: "/admin/jobs",        icon: "💼" },
  { label: "Bookings",  to: "/admin/bookings",    icon: "📅" },
  { label: "Payments",  to: "/admin/payments",    icon: "💳" },
  { label: "Disputes",  to: "/admin/disputes",    icon: "⚠" },
  { label: "AI Audit",  to: "/admin/ai-audit",    icon: "⚡" },
];

export default function AdminLayout({ children }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const currentPage = NAV.find((n) => n.to === location.pathname)?.label || "Admin";

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-base)",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 56 : 220,
        minHeight: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}>

        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "14px 12px",
          borderBottom: "1px solid var(--border-color)",
          minHeight: 56,
          gap: 8,
        }}>
          {!collapsed && (
            <Link to="/admin" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>WS</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>WorkSetu</div>
                <div style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 2 }}>Admin Panel</div>
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: 28, height: 28, borderRadius: 7,
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            color: "var(--text-muted)",
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? "M13 5l7 7-7 7M6 5l7 7-7 7" : "M11 19l-7-7 7-7M18 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "9px 0" : "9px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: active ? "var(--accent-text)" : "var(--text-muted)",
                  background: active ? "var(--accent-soft)" : "transparent",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: 8, borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: 2 }}>
          <button onClick={toggle} style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "9px 0" : "9px 12px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: "none", background: "transparent",
            color: "var(--text-muted)", cursor: "pointer", width: "100%",
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{theme === "dark" ? "☀" : "🌙"}</span>
            {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
          </button>

          <Link to="/" style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "9px 0" : "9px 12px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            textDecoration: "none", color: "var(--text-muted)",
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>←</span>
            {!collapsed && <span>Back to site</span>}
          </Link>

          <button onClick={() => { logout(); navigate("/admin/login"); }} style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "9px 0" : "9px 12px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: "none", background: "transparent",
            color: "#ef4444", cursor: "pointer", width: "100%",
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>→</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px", height: 56, flexShrink: 0,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-color)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {currentPage}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--accent)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 700,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.name}</span>
          </div>
        </div>

        {/* Page */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}