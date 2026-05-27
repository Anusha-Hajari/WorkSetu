import { useState } from "react";
import { Link } from "react-router-dom";

export default function AIMatchBanner() {
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");

  return (
    <section style={{
      margin: "0 24px",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderRadius: 4,
      padding: "36px 40px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
        opacity: 0.4,
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 9, fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: "var(--gold)",
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            AI-Powered Smart Matching
          </div>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 22, fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "1px", marginBottom: 6,
          }}>
            Find Your Perfect Match
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
            Our AI scores workers based on skill, rating, location, and history — then ranks the best for your job.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-hint)", display: "block", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
              Skill
            </label>
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. Cook, Coder..."
              style={{
                padding: "9px 14px", fontSize: 13,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: 2, outline: "none",
                fontFamily: "'Inter', sans-serif",
                width: 160,
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
            />
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-hint)", display: "block", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or Remote"
              style={{
                padding: "9px 14px", fontSize: 13,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: 2, outline: "none",
                fontFamily: "'Inter', sans-serif",
                width: 160,
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
            />
          </div>
          <Link
            to={`/jobs?skill=${skill}&location=${location}`}
            className="btn-primary"
            style={{ padding: "10px 24px", fontSize: 12, letterSpacing: "0.8px" }}>
            Find Match →
          </Link>
        </div>
      </div>
    </section>
  );
}