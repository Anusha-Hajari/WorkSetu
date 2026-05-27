import { useState, useEffect } from "react";

const MOCK = [
  { title: "React Developer needed", skill: "Coder",    rate: "₹800/hr", time: "2m ago" },
  { title: "Cook for weekend event", skill: "Cook",     rate: "₹350/hr", time: "5m ago" },
  { title: "Home deep cleaning",     skill: "Cleaner",  rate: "₹200/hr", time: "8m ago" },
  { title: "Logo design project",    skill: "Designer", rate: "₹1200/hr",time: "12m ago"},
  { title: "HR consultant needed",   skill: "HR",       rate: "₹600/hr", time: "15m ago"},
  { title: "Maths tutor for Class 10", skill: "Tutor",  rate: "₹400/hr", time: "18m ago"},
];

export default function LiveJobTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((o) => o + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const items = [...MOCK, ...MOCK];

  return (
    <div style={{
      borderTop: "1px solid var(--border-color)",
      borderBottom: "1px solid var(--border-color)",
      background: "var(--bg-surface)",
      padding: "12px 0",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Left fade */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 1,
        background: "linear-gradient(90deg, var(--bg-surface), transparent)",
        pointerEvents: "none",
      }} />
      {/* Right fade */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 1,
        background: "linear-gradient(270deg, var(--bg-surface), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex",
        gap: 32,
        width: "max-content",
        transform: `translateX(-${(offset % MOCK.length) * 220}px)`,
        transition: "transform 0.8s ease",
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            minWidth: 210, flexShrink: 0,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--gold)", opacity: 0.7,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
              {item.title}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: "var(--gold)", flexShrink: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              {item.rate}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-hint)", flexShrink: 0 }}>
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}