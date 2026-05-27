import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function SetuBridge3D() {
  const containerRef = useRef(null);
  
  // Use a targeted scroll trigger based on this specific container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out the progress for more organic movement
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // Adjust transformation ranges to converge precisely in the center of the section
  const leftX = useTransform(smoothProgress, [0, 0.5], [-400, 0]);
  const rightX = useTransform(smoothProgress, [0, 0.5], [400, 0]);
  const bridgeScale = useTransform(smoothProgress, [0.1, 0.45], [0, 1]);
  const hubOpacity = useTransform(smoothProgress, [0.4, 0.5], [0, 1]);
  const hubScale = useTransform(smoothProgress, [0.4, 0.55], [0.5, 1]);

  return (
    <section ref={containerRef} className="py-60 relative overflow-hidden bg-[#080807] hidden md:block">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          className="text-[10px] font-black tracking-[0.6em] text-[var(--gold)] uppercase mb-24"
        >
          The Bridge Between Worlds
        </motion.div>

        <div className="relative h-[450px] flex items-center justify-center perspective-[2000px]">
          {/* Left World: The Talent */}
          <motion.div 
            style={{ x: leftX, rotateY: "30deg" }}
            className="absolute left-0 w-[320px] glass-card p-10 border-[var(--gold)]/20 z-30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
          >
             <div className="text-5xl mb-6">🧑‍💻</div>
             <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">The Talent</h4>
             <p className="text-[11px] text-[var(--text-muted)] leading-relaxed uppercase tracking-widest font-black opacity-60">
               Verified Artisans <br/>
               Expert Professionals <br/>
               India's Top 1%
             </p>
          </motion.div>

          {/* Right World: The Mission */}
          <motion.div 
            style={{ x: rightX, rotateY: "-30deg" }}
            className="absolute right-0 w-[320px] glass-card p-10 border-[var(--gold)]/20 z-30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
          >
             <div className="text-5xl mb-6">🏢</div>
             <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">The Mission</h4>
             <p className="text-[11px] text-[var(--text-muted)] leading-relaxed uppercase tracking-widest font-black opacity-60">
               Visionary Startups <br/>
               Global Enterprises <br/>
               Elite Private Clients
             </p>
          </motion.div>

          {/* The SETU (Bridge Connector) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <motion.div 
               style={{ scaleX: bridgeScale }}
               className="w-full max-w-4xl bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent h-[2px] opacity-40"
             />
          </div>
             
          {/* Central Hub - THE SETU ASSEMBLY */}
          <motion.div 
             style={{ 
                opacity: hubOpacity, 
                scale: hubScale,
                x: "-50%",
                y: "-50%"
             }}
             className="absolute top-1/2 left-1/2 z-40 flex items-center justify-center"
          >
             <div className="relative w-80 h-80 flex items-center justify-center">
                
                {/* Neural Pulse Glow (Improvisation) */}
                <motion.div 
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-[var(--gold)]/20 blur-[100px] rounded-full"
                />

                {/* Revolving Outer Circle */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-[var(--gold)]/20 rounded-full" 
                />

                {/* Static Middle Ring */}
                <div className="absolute inset-16 border border-[var(--gold)]/30 rounded-full" />
                
                {/* THE CORE HUB (Exactly Centered) */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-44 h-44 bg-[var(--gold)] rounded-full flex items-center justify-center text-black font-black shadow-[0_0_120px_rgba(197,160,89,0.8)] z-10 relative"
                >
                   <span className="text-7xl">⟡</span>
                   {/* Inner Core Reflection */}
                   <div className="absolute inset-2 border border-white/20 rounded-full" />
                </motion.div>

                {/* BRAND SIGNATURE (Perfectly Floating) */}
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                   <div className="relative w-full h-full">
                      <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                         <path 
                           id="bridge-hero-path" 
                           d="M 160, 160 m -124, 0 a 124,124 0 1,1 248,0" 
                           fill="none"
                         />
                         <text className="text-[28px] font-black uppercase tracking-[0.25em]" fill="white" style={{ fontFamily: "'Cinzel', serif" }}>
                            <textPath href="#bridge-hero-path" startOffset="50%" textAnchor="middle">
                               WORK<tspan fill="var(--gold)">SETU</tspan>
                            </textPath>
                         </text>
                      </svg>
                   </div>
                </div>

                {/* Background WS Watermark (Deep Glass Effect) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-40">
                   <h1 className="text-[180px] font-black text-[var(--gold)]/10 tracking-tighter blur-[1px]" style={{ fontFamily: "'Cinzel', serif" }}>WS</h1>
                </div>
                
                <div className="absolute bottom-[-20px] text-[10px] font-black text-[var(--gold)] tracking-[0.8em] uppercase opacity-60 whitespace-nowrap">
                   THE PROTOCOL OF TRUST
                </div>
             </div>
          </motion.div>

          {/* Kinetic Particles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
             {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    x: ["-500px", "500px"],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5 + (i * 0.2), 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "linear"
                  }}
                  className="absolute w-12 h-[1px] bg-white shadow-[0_0_20px_white]"
                />
             ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32"
        >
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-xl font-medium leading-relaxed">
            Through the <span className="text-white font-black">Setu</span>, trust is automated and excellence is guaranteed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
