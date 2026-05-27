import { Link } from "react-router-dom";

const WORKERS = [
  { name: "Rahul Sharma",  skill: "Full Stack Dev",    rate: "₹800/hr", jobs: 142, rating: 5, initial: "R" },
  { name: "Priya Nair",    skill: "Professional Cook", rate: "₹400/hr", jobs: 89,  rating: 4, initial: "P" },
  { name: "Amit Verma",    skill: "UI / UX Designer",  rate: "₹650/hr", jobs: 67,  rating: 5, initial: "A" },
  { name: "Sunita Devi",   skill: "House Cleaner",     rate: "₹250/hr", jobs: 203, rating: 4, initial: "S" },
];

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 6 }}>
      {[1,2,3,4,5].map((i) => (
        <div key={i} style={{
          width: 8, height: 8,
          clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
          background: i <= rating ? "var(--gold)" : "var(--border-color)",
        }} />
      ))}
    </div>
  );
}

export default function FeaturedWorkers() {
  return (
    <section style={{ padding: "60px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 8, opacity: 0.8 }}>
          Top Talent
        </div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: 2, marginBottom: 6 }}>
          Featured Workers
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Verified professionals ready to work</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {WORKERS.map((w) => (
          <div key={w.name} className="card" style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--gold)", display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "'Cinzel', serif",
              fontSize: 20, fontWeight: 900, color: "var(--bg-base)",
              margin: "0 auto 12px",
            }}>{w.initial}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, letterSpacing: "0.3px" }}>{w.name}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>{w.skill}</div>
            <Stars rating={w.rating} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{w.rate}</div>
            <div style={{ fontSize: 10, color: "var(--text-hint)", letterSpacing: "0.5px", marginTop: 3 }}>{w.jobs} jobs done</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <Link to="/jobs" className="btn-outline" style={{ fontSize: 12, letterSpacing: "1px" }}>
          View All Workers →
        </Link>
      </div>
    </section>
  );
}