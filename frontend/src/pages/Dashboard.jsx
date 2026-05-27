import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

function Dashboard() {
  const { user } = useAuth();
  const cards = [
    { label: "My Applications", to: "/my-applications", icon: "📨", desc: "Jobs you applied to" },
    { label: "My Job Posts", to: "/my-posts", icon: "📌", desc: "Jobs you have posted" },
    { label: "My Bookings", to: "/my-bookings", icon: "📅", desc: "Scheduled sessions" },
    { label: "Payments", to: "/payments", icon: "💳", desc: "Transaction history" },
    { label: "Schedule", to: "/schedule", icon: "🗓", desc: "Your work calendar" },
    { label: "Profile", to: "/profile", icon: "👤", desc: "Edit your profile" },
  ];

  return (
    <div className="pt-24 px-4 max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your work, bookings, and payments from here.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card p-5 hover:border-[var(--accent)] transition-colors group">
            <div className="text-2xl mb-3">{c.icon}</div>
            <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{c.label}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
export default Dashboard;