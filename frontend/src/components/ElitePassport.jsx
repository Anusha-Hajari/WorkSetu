import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

export default function ElitePassport({ user }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="py-10 flex flex-col items-center">
      <div className="text-[10px] font-black tracking-[0.4em] text-[var(--gold)] uppercase mb-8">
        Your Digital Identity
      </div>
      
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
        className="relative w-full max-w-[400px] aspect-[1.586/1] group cursor-pointer"
      >
        {/* The Card Body */}
        <div className="absolute inset-0 bg-[#1a1a18] rounded-2xl border border-white/10 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
          
          {/* Holographic Foil Layer */}
          <motion.div 
            style={{
               background: "linear-gradient(135deg, transparent 0%, rgba(197,160,89,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(197,160,89,0.1) 55%, transparent 100%)",
               backgroundSize: "200% 200%",
               x: useTransform(mouseXSpring, [-0.5, 0.5], ["-50%", "50%"]),
               y: useTransform(mouseYSpring, [-0.5, 0.5], ["-50%", "50%"]),
            }}
            className="absolute inset-0 z-10 opacity-30 group-hover:opacity-60 transition-opacity"
          />

          {/* Background Textures */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <svg width="100%" height="100%">
                <pattern id="card-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                   <circle cx="2" cy="2" r="1" fill="var(--gold)" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#card-pattern)" />
             </svg>
          </div>

          <div className="relative z-20 h-full p-8 flex flex-col justify-between" style={{ transform: "translateZ(50px)" }}>
             {/* Header */}
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-xl font-black tracking-widest text-white leading-none">WORKSETU</h3>
                   <p className="text-[7px] font-black tracking-[0.3em] text-[var(--gold)] mt-1 uppercase">Elite Artisan Passport</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--gold)] to-[#8a6d29] rounded-lg flex items-center justify-center text-black font-black text-xs">
                   ⟡
                </div>
             </div>

             {/* User Info */}
             <div className="flex items-end justify-between">
                <div className="space-y-4">
                   <div>
                      <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Passport Holder</div>
                      <div className="text-sm font-black text-white uppercase tracking-wider">{user?.name || "RECRUIT"}</div>
                   </div>
                   <div className="flex gap-6">
                      <div>
                         <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Node ID</div>
                         <div className="text-[10px] font-mono text-white tracking-tighter">WS-{user?.id?.slice(-8).toUpperCase() || "PENDING"}</div>
                      </div>
                      <div>
                         <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Issue Date</div>
                         <div className="text-[10px] font-mono text-white">04 / 2026</div>
                      </div>
                   </div>
                </div>

                {/* QR Section */}
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 bg-white p-1 rounded-lg">
                      {/* Placeholder for QR - styled to look real */}
                      <div className="w-full h-full bg-black flex items-center justify-center text-[6px] text-white font-mono p-1 text-center">
                         TRUST<br/>SCAN<br/>V2.4
                      </div>
                   </div>
                   <div className="text-[6px] font-black text-[var(--gold)] mt-2 tracking-widest">VERIFIED AUTH</div>
                </div>
             </div>
          </div>

          {/* Bottom Security Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />
        </div>

        {/* Card Shadow/Glow */}
        <div className="absolute -inset-4 bg-[var(--gold)]/5 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>

      <p className="mt-8 text-[9px] text-[var(--text-hint)] font-medium max-w-xs text-center leading-relaxed">
        This passport is your cryptographically signed key to the WorkSetu network. Present it to visionary employers for instant verification.
      </p>
    </div>
  );
}
