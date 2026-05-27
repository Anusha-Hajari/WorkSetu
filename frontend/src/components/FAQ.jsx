import { useState } from "react";

const FAQS = [
  { q: "How does booking work?", a: "Browse professionals, select a date and time slot, confirm your booking, and pay securely through the platform. You get real-time updates once work starts." },
  { q: "Can I hire hourly or long-term?", a: "Yes — WorkSetu supports both hourly gigs and long-term contracts for any skill category, from 1 hour to 12 months." },
  { q: "How does AI matching work?", a: "Our AI analyzes your job requirements and worker profiles — skills, ratings, location, and availability — to rank the best matches for you automatically." },
  { q: "Is payment secure?", a: "All payments are processed through Razorpay with end-to-end encryption. Funds are released to workers only after you confirm the job is complete." },
  { q: "Can I track work in real time?", a: "Yes. Once a booking is active, you get live status updates as the worker checks in, starts, and completes the job." },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 10, opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>
          Questions
        </div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 900, color: "var(--text-primary)", letterSpacing: 2 }}>
          Frequently Asked
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {FAQS.map((f, i) => (
          <div key={i}
            style={{
              background: "var(--bg-surface)",
              border: `1px solid ${open === i ? "rgba(201,168,92,0.3)" : "var(--border-color)"}`,
              borderRadius: 3,
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%", textAlign: "left",
                padding: "16px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{f.q}</span>
              <span style={{
                color: open === i ? "var(--gold)" : "var(--text-hint)",
                fontSize: 16, transition: "transform 0.2s, color 0.2s",
                transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                flexShrink: 0, lineHeight: 1,
              }}>+</span>
            </button>
            {open === i && (
              <div style={{
                padding: "0 20px 16px",
                borderTop: "1px solid var(--border-color)",
                paddingTop: 14,
              }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, fontFamily: "'Inter', sans-serif", margin: 0 }}>
                  {f.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}