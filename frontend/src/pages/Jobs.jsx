import React, { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import UrgentFeed from "../components/UrgentFeed";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SKILLS = ["All","Cook","Cleaner","Coder","Video Editor","HR","Tutor","Plumber","Designer"];

export default function Jobs() {
  const [skill, setSkill] = useState("All");
  const [type, setType]   = useState("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const query = `?skill=${skill !== "All" ? skill : ""}&type=${type !== "all" ? type : ""}&search=${search}`;
  const { data: jobs, loading } = useFetch(`/api/jobs${query}`);

  return (
    <div style={{
      paddingTop: 80,
      paddingBottom: 64,
      paddingLeft: 24,
      paddingRight: 24,
      maxWidth: 1280,
      margin: "0 auto",
    }}>

      {/* ── URGENT FEED ── */}
      <div style={{ marginBottom: 48 }}>
        <UrgentFeed />
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: "linear-gradient(90deg,transparent,var(--gold),transparent)",
        opacity: 0.2,
        marginBottom: 40,
      }} />

      {/* ── REGULAR JOBS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 22, fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: 1, marginBottom: 4,
          }}>
            Browse Jobs
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
            Find your next opportunity or the perfect person for the job.
          </p>
        </div>
        {user && (
          <Link
            to="/post-job"
            className="btn-primary"
            style={{
              padding: "8px 20px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              borderRadius: 3,
            }}
          >
            <span>📋</span> Post a Job
          </Link>
        )}
      </div>

      {/* Search + type filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs, skills..."
          className="input-field"
          style={{ maxWidth: 300, flex: 1 }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-field"
          style={{ width: 140 }}
        >
          <option value="all">All Types</option>
          <option value="hourly">Hourly</option>
          <option value="longterm">Long-term</option>
        </select>
      </div>

      {/* Skill filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
        {SKILLS.map((s) => (
          <button key={s} onClick={() => setSkill(s)} style={{
            padding: "6px 14px",
            fontSize: 11, fontWeight: 600,
            borderRadius: 2, border: "1px solid",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.5px",
            cursor: "pointer",
            borderColor: skill === s ? "var(--accent)" : "var(--border-color)",
            background: skill === s ? "var(--accent-soft)" : "transparent",
            color: skill === s ? "var(--accent-text)" : "var(--text-muted)",
            transition: "all 0.15s",
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      {loading ? <Loader /> : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}>
          {jobs?.length ? (
            jobs.map((job) => <JobCard key={job._id} job={job} />)
          ) : (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px 24px",
              color: "var(--text-muted)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
            }}>
              No jobs found. Try different filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}