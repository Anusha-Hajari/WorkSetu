import React from "react";
export default function Loader({ fullPage = false }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: fullPage ? "100vh" : "160px",
      background: fullPage ? "var(--bg-base)" : "transparent",
      gap: 20,
    }}>
      <div style={{ position: "relative" }}>
        {/* Glowing background */}
        <div style={{
          position: "absolute",
          inset: -15,
          background: "var(--accent)",
          filter: "blur(30px)",
          opacity: 0.15,
          borderRadius: "50%",
          animation: "pulse 2s infinite"
        }} />
        
        {/* Branded Icon */}
        <div style={{
          width: 60,
          height: 60,
          background: "var(--accent)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 900,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          boxShadow: "0 0 20px rgba(99,102,241,0.4)",
          animation: "float 3s ease-in-out infinite",
          zIndex: 1
        }}>
          ⟡
        </div>
      </div>

      {fullPage && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 18,
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: 2,
            margin: 0
          }}>
            WORK<span style={{ color: "var(--gold)" }}>SETU</span>
          </h2>
          <div style={{
            width: 100,
            height: 2,
            background: "var(--border-color)",
            margin: "12px auto",
            borderRadius: 1,
            overflow: "hidden",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "40%",
              background: "var(--gold)",
              animation: "loading-bar 1.5s infinite ease-in-out"
            }} />
          </div>
          <p style={{
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            margin: 0
          }}>
            Synchronizing Workspace
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loading-bar {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}