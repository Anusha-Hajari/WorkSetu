import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Mouse Parallax for Hologram
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

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

  // Password Strength Logic
  const strength = useMemo(() => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }, [form.password]);

  const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Invincible"];
  const strengthColors = ["#ef4444", "#f87171", "#fbbf24", "#34d399", "#c5a059"];

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength < 2) {
      setError("Security clearance denied. Please choose a stronger password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password.slice(0, 72),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Access denied. Registration protocol failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/jobs");

    } catch (err) {
      setError("Gateway Timeout. Neural link unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-[#080807]"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Neural Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--gold)_0%,transparent_70%)] opacity-10" />
        <svg className="w-full h-full">
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
           </pattern>
           <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10 max-w-6xl w-full">
        {/* Left Side: Onboarding Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block flex-1 space-y-8"
        >
          <div className="space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-1 bg-[var(--gold)]" 
            />
            <h2 className="text-5xl font-black text-white leading-none">
              BEGIN YOUR <br />
              <span className="text-[var(--gold)]">ASCENSION.</span>
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-md">
              Join the elite network of professional artisans and innovators. Your digital identity starts here.
            </p>
          </div>

          {/* Real-time Preview Card (The Improvisation) */}
          <motion.div 
            style={{ rotateX, rotateY, perspective: 1000 }}
            className="w-80 h-48 relative group"
          >
             <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-2xl blur-xl group-hover:bg-[var(--gold)]/30 transition-all" />
             <div className="absolute inset-0 glass-card rounded-2xl border-white/10 p-6 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="text-4xl">⟡</span>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-[var(--gold)]/20 flex items-center justify-center font-black text-xl text-[var(--gold)] border border-[var(--gold)]/30">
                      {form.name ? form.name[0].toUpperCase() : "?"}
                   </div>
                   <div>
                      <div className="text-sm font-black text-white tracking-wide truncate w-40">
                         {form.name || "UNIDENTIFIED USER"}
                      </div>
                      <div className="text-[10px] text-[var(--gold)] font-bold tracking-widest uppercase">
                         PROSPECTIVE MEMBER
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: form.name ? "100%" : "20%" }}
                        className="h-full bg-white/20" 
                      />
                   </div>
                   <div className="flex justify-between text-[8px] font-black uppercase text-[var(--text-hint)] tracking-widest">
                      <span>Status: {form.email ? "SYNCED" : "INITIALIZING"}</span>
                      <span>v2.0</span>
                   </div>
                </div>
             </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8 relative lg:hidden">
             <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
               Work<span className="text-shine">Setu</span>
             </h1>
          </div>

          <motion.div 
            className="glass-card p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-white/5 relative"
          >
            {/* Guardian Avatar inside the card for mobile focus */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
               <div className="relative w-24 h-24">
                  <motion.div 
                    animate={{ scale: isPasswordFocused ? 1.1 : 1, opacity: isPasswordFocused ? 0.3 : 0.15 }}
                    className="absolute inset-0 bg-[var(--gold)] rounded-full blur-2xl" 
                  />
                  <div className="relative w-full h-full rounded-full border-2 border-[var(--gold)]/30 bg-[#080807] flex flex-col items-center justify-center overflow-hidden">
                     {/* Hair/Head Top */}
                     <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
                     
                     {/* Face Container */}
                     <div className="relative w-16 h-16 mt-2">
                        {/* Eyes & Lids */}
                        <div className="flex justify-between items-center w-full mt-4 px-1">
                           {/* Left Eye */}
                           <div className="relative w-4 h-4 rounded-full bg-white/5 overflow-hidden">
                              <motion.div 
                                animate={{ height: isPasswordFocused ? "100%" : "0%" }}
                                className="absolute top-0 left-0 w-full bg-[var(--gold)] z-10"
                              />
                              <div className="absolute inset-1 bg-[var(--gold)] rounded-full opacity-30" />
                           </div>
                           {/* Right Eye */}
                           <div className="relative w-4 h-4 rounded-full bg-white/5 overflow-hidden">
                              <motion.div 
                                animate={{ height: isPasswordFocused ? "100%" : "0%" }}
                                className="absolute top-0 left-0 w-full bg-[var(--gold)] z-10"
                              />
                              <div className="absolute inset-1 bg-[var(--gold)] rounded-full opacity-30" />
                           </div>
                        </div>

                        {/* Nose */}
                        <div className="w-1.5 h-3 bg-white/10 mx-auto mt-1 rounded-full" />
                        
                        {/* Hands (Detailed Fingers) */}
                        <motion.div 
                          initial={{ y: 60 }}
                          animate={{ y: isPasswordFocused ? 5 : 60 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          className="absolute -inset-x-4 bottom-4 flex justify-between z-20"
                        >
                           {/* Left Hand */}
                           <div className="relative">
                              <div className="w-8 h-10 bg-[var(--gold)] rounded-xl border border-black/50 shadow-lg" />
                              <div className="absolute -top-1 left-1 w-1 h-3 bg-black/20 rounded-full" />
                              <div className="absolute -top-1 left-3 w-1 h-4 bg-black/20 rounded-full" />
                              <div className="absolute -top-1 left-5 w-1 h-3 bg-black/20 rounded-full" />
                           </div>
                           {/* Right Hand */}
                           <div className="relative">
                              <div className="w-8 h-10 bg-[var(--gold)] rounded-xl border border-black/50 shadow-lg" />
                              <div className="absolute -top-1 right-1 w-1 h-3 bg-black/20 rounded-full" />
                              <div className="absolute -top-1 right-3 w-1 h-4 bg-black/20 rounded-full" />
                              <div className="absolute -top-1 right-5 w-1 h-3 bg-black/20 rounded-full" />
                           </div>
                        </motion.div>

                        {/* Mouth */}
                        <motion.div 
                          animate={{ 
                            width: isPasswordFocused ? 14 : 24,
                            height: isPasswordFocused ? 2 : 4,
                            borderRadius: isPasswordFocused ? "10px" : "0 0 20px 20px"
                          }}
                          className="mx-auto bg-[var(--gold)]/40 mt-2" 
                        />
                     </div>
                  </div>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block group-focus-within:text-[var(--gold)] transition-colors">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Aryan Sharma"
                    className="input-field bg-white/5 border-white/10 focus:border-[var(--gold)]/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block group-focus-within:text-[var(--gold)] transition-colors">
                    Neural Address (Email)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="you@empire.com"
                    className="input-field bg-white/5 border-white/10 focus:border-[var(--gold)]/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div className="group">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                      Security Key
                    </label>
                    {form.password && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: strengthColors[strength] }}
                      >
                        {strengthLabels[strength]}
                      </motion.span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={form.password}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="input-field bg-white/5 border-white/10 focus:border-[var(--gold)]/50 focus:bg-white/[0.08]"
                  />
                  <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength / 4) * 100}%` }}
                      className="h-full"
                      style={{ backgroundColor: strengthColors[strength] }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-[11px] font-black tracking-[0.2em] relative overflow-hidden group/btn"
              >
                <span className="relative z-10">
                  {loading ? "ESTABLISHING LINK..." : "JOIN THE ELITE"}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </button>

              <p className="text-center text-[10px] font-bold text-[var(--text-hint)] uppercase tracking-widest">
                Already established?{" "}
                <Link to="/login" className="text-[var(--gold)] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}