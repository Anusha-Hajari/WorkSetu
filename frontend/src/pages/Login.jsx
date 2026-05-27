import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // 3D Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Transform mouse position into rotation
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid credentials. Please check your email/password.");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);

      if (data.user?.is_admin) {
        navigate("/admin");
      } else {
        navigate("/jobs");
      }

    } catch (err) {
      setError("Network error. The WorkSetu gateway is currently unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-[#080807]">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Floating Ring 1 */}
        <motion.div 
          animate={{ 
            rotate: 360,
            y: [0, -40, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border border-[var(--gold)]/10"
        />
        {/* Floating Ring 2 */}
        <motion.div 
          animate={{ 
            rotate: -360,
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full border border-[var(--gold)]/5"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--gold)] mb-4"
          >
            Terminal Login
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 drop-shadow-2xl">
             Work<span className="text-shine">Setu</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase opacity-60">Authorize your session</p>
        </div>

        <motion.div 
          style={{ 
            rotateX, 
            rotateY,
            perspective: 1000,
            transformStyle: "preserve-3d" 
          }}
          className="glass-card p-8 border-white/5 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* Holographic Scan Effect */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 z-20 pointer-events-none"
          />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10" style={{ transform: "translateZ(50px)" }}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-wider"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block group-focus-within:text-[var(--gold)] transition-colors">
                  Identity (Email)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="name@access.com"
                  className="input-field bg-white/5 border-white/10 focus:border-[var(--gold)]/40 focus:bg-white/[0.08] tracking-wide"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                    Access Code
                  </label>
                  <span className="text-[9px] opacity-30 hover:opacity-100 transition-opacity cursor-pointer text-[var(--gold)] uppercase font-black">Forgot?</span>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="input-field bg-white/5 border-white/10 focus:border-[var(--gold)]/40 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-[11px] font-black tracking-[0.3em] uppercase relative overflow-hidden group/btn shadow-[0_15px_30px_-5px_rgba(var(--accent-rgb),0.3)]"
            >
              <span className="relative z-10">{loading ? "Authenticating..." : "Establish Connection"}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </motion.button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Access Path</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <p className="text-center text-[10px] font-bold text-[var(--text-hint)] uppercase tracking-widest">
              New Recruit?{" "}
              <Link to="/register" className="text-[var(--gold)] hover:text-white transition-colors underline decoration-[var(--gold)]/30 underline-offset-4">
                Initialize Account
              </Link>
            </p>
          </form>
        </motion.div>

        {/* Security Notice */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-center text-[8px] font-black uppercase tracking-[0.5em] text-[var(--text-hint)]"
        >
          End-to-End Encrypted Node v2.0
        </motion.div>
      </motion.div>
    </div>
  );
}