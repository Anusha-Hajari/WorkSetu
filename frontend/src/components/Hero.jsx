import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const SKILLS = ["Cook", "Cleaner", "Coder", "Video Editor", "HR", "Tutor", "Plumber", "Designer", "Driver"];

export default function Hero() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  // Mouse Parallax Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 pt-28 pb-32 overflow-hidden bg-[#080807]"
    >
      {/* Background Kinetic Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--gold)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <motion.div 
        style={{ rotateX, rotateY, perspective: 1000 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* THE WORKSETU 3D HUB (TOP POSITION) */}
        <div className="relative mb-24" style={{ transform: "translateZ(100px)" }}>
           <div className="relative w-80 h-80 flex flex-col items-center justify-center">
              
              {/* Revolving Outer Circle (ONLY THIS REVOLVES) */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-[var(--gold)]/20 rounded-full" 
              />

              {/* Static Middle Circle */}
              <div className="absolute inset-16 border border-[var(--gold)]/30 rounded-full" />
              
              {/* Static Central Power Icon */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-44 h-44 bg-[var(--gold)] rounded-full flex items-center justify-center text-black font-black shadow-[0_0_120px_rgba(197,160,89,0.8)] z-10"
              >
                 <span className="text-7xl">⟡</span>
              </motion.div>

              {/* STATIC BRAND NAME (Perfectly centered between circles) */}
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                 <div className="relative w-full h-full">
                    <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                       <path 
                         id="static-brand-path" 
                         d="M 160, 160 m -124, 0 a 124,124 0 1,1 248,0" 
                         fill="none"
                       />
                       <text className="text-[28px] font-black uppercase tracking-[0.25em]" fill="white" style={{ fontFamily: "'Cinzel', serif" }}>
                          <textPath href="#static-brand-path" startOffset="50%" textAnchor="middle">
                             WORK<tspan fill="var(--gold)">SETU</tspan>
                          </textPath>
                       </text>
                    </svg>
                 </div>
              </div>

              {/* Background WS Glow - FULL VISIBILITY */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-60">
                 <h1 className="text-[200px] font-black text-[var(--gold)]/40 tracking-tighter shadow-[0_0_100px_rgba(197,160,89,0.2)]" style={{ fontFamily: "'Cinzel', serif" }}>WS</h1>
              </div>
           </div>
        </div>

        {/* Tagline / Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ transform: "translateZ(50px)" }}
          className="max-w-2xl mx-auto mb-16"
        >
          <p className="text-[clamp(16px,1.5vw,20px)] text-[var(--text-muted)] font-medium leading-relaxed">
            Connecting India’s most skilled artisans with visionary employers. <br/>
            <span className="text-white font-black uppercase tracking-tighter">Verified Nodes. Instant Settlements. Absolute Trust.</span>
          </p>
        </motion.div>

        {/* MAIN CTAs (BELOW HUB) */}
        <div 
          style={{ transform: "translateZ(80px)" }}
          className="flex flex-col sm:flex-row items-center gap-8 mb-24"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to={user ? "/jobs" : "/register"} 
              className="btn-primary px-16 py-6 text-sm font-black uppercase tracking-[0.3em] min-w-[260px] shadow-[0_30px_60px_-12px_rgba(var(--accent-rgb),0.5)]"
            >
              {user ? "Hire Talent" : "Join The Elite"}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to="/jobs" 
              className="btn-secondary border-white/10 text-white px-16 py-6 text-sm font-black uppercase tracking-[0.3em] min-w-[260px] hover:border-[var(--gold)]/50 transition-all"
            >
              Browse Missions
            </Link>
          </motion.div>
        </div>

        {/* Floating Stats or Particles */}
        <div className="flex gap-12 opacity-30">
           {["ISO 27001", "SECURE VAULT", "NEURAL AI"].map(tag => (
              <span key={tag} className="text-[9px] font-black tracking-[0.4em] uppercase text-[var(--gold)]">{tag}</span>
           ))}
        </div>
      </motion.div>

      {/* Floating Skill Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {SKILLS.slice(0, 6).map((skill, i) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.1, 0],
              y: [0, -300],
              x: Math.sin(i) * 150
            }}
            transition={{ 
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
            className="absolute text-[8px] font-black uppercase tracking-widest text-[var(--gold)] border border-[var(--gold)]/20 px-4 py-1.5 rounded-full"
            style={{ 
              left: `${10 + (i * 16)}%`,
              bottom: '-10%'
            }}
          >
            {skill}
          </motion.div>
        ))}
      </div>
    </section>
  );
}