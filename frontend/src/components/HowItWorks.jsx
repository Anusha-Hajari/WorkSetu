const STEPS = [
  {
    num: "01",
    title: "One Account",
    desc: "Sign up once. Works for both hiring people and finding work — switch views anytime from your profile.",
    icon: <svg width="16" height="16" fill="none" stroke="var(--gold)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  },
  {
    num: "02",
    title: "Book a Slot",
    desc: "Pick exact date and time. Hourly sessions or long-term contracts — flexible to your schedule.",
    icon: <svg width="16" height="16" fill="none" stroke="var(--gold)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  },
  {
    num: "03",
    title: "Track & Pay",
    desc: "Real-time updates as work happens. Secure payment released only after you confirm completion.",
    icon: <svg width="16" height="16" fill="none" stroke="var(--gold)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
];

const TRUST = [
  ["₹0", "Platform fee to join"],
  ["24hr", "Dispute resolution"],
  ["SSL", "Secure payments"],
  ["AI", "Smart matching"],
];

export default function HowItWorksSection() {
  return (
    <section style={{ padding: "60px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 8, opacity: 0.8 }}>
          The Path
        </div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: 2 }}>
          How WorkSetu Works
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "var(--border-color)" }}>
        {STEPS.map((s) => (
          <div key={s.num} style={{ background: "var(--bg-surface)", padding: "28px 24px", position: "relative" }}>
            <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "'Cinzel', serif", fontSize: 40, fontWeight: 900, color: "var(--gold)", opacity: 0.06, lineHeight: 1 }}>{s.num}</div>
            <div style={{ width: 36, height: 36, border: "1px solid rgba(201,168,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, borderRadius: 2 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "0.3px" }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 20 }}>
        {TRUST.map(([val, label]) => (
          <div key={label} className="card-soft" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 900, color: "var(--gold)", marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.8px" }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}