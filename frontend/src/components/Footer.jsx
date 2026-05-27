import { Link } from "react-router-dom";

const LINKS = [
  { head: "Platform", items: [["Browse Jobs","/jobs"],["Post a Job","/post-job"],["How it Works","/how-it-works"],["AI Matching","/"]] },
  { head: "Account",  items: [["Login","/login"],["Register","/register"],["Dashboard","/dashboard"],["Payments","/payments"]] },
  { head: "Legal",    items: [["Privacy Policy","/"],["Terms of Use","/"],["Refund Policy","/"]] },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border-color)", padding: "48px 24px 24px", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg,transparent,var(--gold),transparent)", opacity: 0.2 }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900, color: "var(--text-primary)", letterSpacing: 2, marginBottom: 10 }}>
              Work<span style={{ color: "var(--gold)" }}>Setu</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              Connecting skilled professionals with people who need them — hourly or long-term, across India.
            </p>
          </div>
          {LINKS.map(({ head, items }) => (
            <div key={head}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 14, opacity: 0.8 }}>{head}</div>
              {items.map(([text, to]) => (
                <Link key={text} to={to} style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.target.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}>
                  {text}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 10, color: "var(--text-hint)", letterSpacing: "0.8px" }}>© 2025 WorkSetu · Built in India</div>
          <div style={{ fontSize: 10, color: "var(--text-hint)", letterSpacing: 1 }}>⟡ · ⟡ · ⟡</div>
        </div>
      </div>
    </footer>
  );
}