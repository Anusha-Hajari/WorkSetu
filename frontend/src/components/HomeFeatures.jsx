import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

function FeatureCard3D({ f, i }) {
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
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      viewport={{ once: true }}
      className="relative h-full"
    >
      <div className="glass-card p-10 h-full border-white/5 relative group overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
        {/* Floating Icon with extra depth */}
        <div 
           className="absolute top-0 right-0 p-8 text-6xl opacity-[0.03] group-hover:opacity-10 transition-all"
           style={{ transform: "translateZ(100px)" }}
        >
          {f.icon}
        </div>
        
        <div 
          className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center text-2xl font-black border shadow-2xl"
          style={{ 
            borderColor: `${f.color}40`, 
            backgroundColor: `${f.color}10`, 
            color: f.color,
            transform: "translateZ(40px)"
          }}
        >
          {f.icon}
        </div>

        <h3 
           className="text-lg font-black tracking-[0.2em] text-white mb-4 uppercase"
           style={{ transform: "translateZ(30px)" }}
        >
          {f.title}
        </h3>
        
        <p 
           className="text-sm text-[var(--text-muted)] leading-relaxed font-medium mb-8"
           style={{ transform: "translateZ(20px)" }}
        >
          {f.desc}
        </p>

        <div 
           className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between"
           style={{ transform: "translateZ(10px)" }}
        >
          <span className="text-[10px] font-black tracking-widest text-[var(--text-hint)] uppercase">Engine v2.4</span>
          <motion.span 
            whileHover={{ x: 5 }}
            className="text-[var(--gold)] text-xl cursor-pointer"
          >
            →
          </motion.span>
        </div>

        {/* Dynamic Light Reflection */}
        <motion.div 
           style={{
             background: `radial-gradient(circle at 50% 50%, ${f.color}15 0%, transparent 70%)`,
             x: useTransform(mouseXSpring, [-0.5, 0.5], ["-50%", "50%"]),
             y: useTransform(mouseYSpring, [-0.5, 0.5], ["-50%", "50%"]),
           }}
           className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </motion.div>
  );
}

const FEATURES = [
  {
    title: "INSTANT SETTLEMENTS",
    desc: "Experience the speed of gold. Payments are cryptographically secured and released the moment work is approved.",
    icon: "₹",
    color: "var(--gold)"
  },
  {
    title: "ELITE VERIFICATION",
    desc: "Our neural identity network ensures every node is verified via Aadhar and professional background checks.",
    icon: "🛡️",
    color: "#34d399"
  },
  {
    title: "NEURAL MATCHMAKING",
    desc: "AI-powered precision matching that connects the top 1% of talent with the most exclusive opportunities.",
    icon: "🧠",
    color: "#60a5fa"
  }
];

export default function HomeFeatures() {
  return (
    <section className="px-6 py-32 relative overflow-hidden bg-[#080807]">
      {/* Background Depth Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,rgba(197,160,89,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-[10px] font-black tracking-[0.5em] text-[var(--gold)] uppercase mb-6"
            >
              The Architecture of Excellence
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
              DESIGNED FOR <br />
              THE <span className="text-shine">UNSTOPPABLE.</span>
            </h2>
          </div>
          <p className="text-[var(--text-muted)] max-w-sm text-base font-medium leading-relaxed opacity-80">
            WorkSetu is a high-fidelity ecosystem engineered for those who demand absolute speed, total trust, and elite results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {FEATURES.map((f, i) => (
            <FeatureCard3D key={i} f={f} i={i} />
          ))}
        </div>
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
}
