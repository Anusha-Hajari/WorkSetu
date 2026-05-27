import { useFetch } from "../hooks/useFetch";
import { Link } from "react-router-dom";
import Loader from "./Loader";

export default function News() {
  const { data: jobs, loading } = useFetch("/api/jobs?limit=3&sort=recent");

  return (
    <section style={{ padding: "60px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent-text)", padding: "4px 12px", border: "1px solid rgba(201,168,92,0.25)", borderRadius: 2, background: "var(--accent-soft)", marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", animation: "pulse 1.5s infinite" }} />
            Live Opportunities
          </div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900, color: "var(--text-primary)", letterSpacing: 2 }}>
            Latest Jobs
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Fresh opportunities posted in the last 24 hours</p>
        </div>
        <Link to="/jobs" style={{ fontSize: 12, color: "var(--accent-text)", fontWeight: 700, letterSpacing: "0.5px", textDecoration: "none" }}>
          View all →
        </Link>
      </div>

      {loading ? <Loader /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {jobs?.map((job) => (
            <Link to={`/jobs/${job._id}`} key={job._id} className="card" style={{ padding: 20, textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: 2, background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid rgba(201,168,92,0.25)" }}>
                  {job.type || "Hourly"}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>
                  ₹{job.rate}<span style={{ fontSize: 10, color: "var(--text-hint)", fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>/{job.type === "hourly" ? "hr" : "mo"}</span>
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5, letterSpacing: "0.3px" }}>{job.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{job.skill} · {job.location || "Remote"}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}