import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PremiumCTA() {
  return (
    <section className="px-6 py-20 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto glass-card border-[var(--gold)]/20 p-12 md:p-20 text-center relative overflow-hidden group"
      >
        {/* Animated Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div 
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-4xl mb-8 opacity-40"
          >
            ✧
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-none uppercase">
            READY TO JOIN THE <br />
            <span className="text-shine">ELITE WORKFORCE?</span>
          </h2>
          
          <p className="text-[var(--text-muted)] text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Stop searching and start evolving. Create your secure profile today and unlock the most exclusive opportunities in India.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="btn-primary px-12 py-5 text-sm font-black tracking-[0.2em] shadow-[0_25px_50px_-12px_rgba(var(--accent-rgb),0.5)]">
                GET STARTED NOW
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/jobs" className="btn-secondary border-white/20 text-white px-12 py-5 text-sm font-black tracking-[0.2em] hover:border-[var(--gold)]/40 transition-all">
                BROWSE THE NETWORK
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative corner ornaments */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-[var(--gold)]/10 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-[var(--gold)]/10 rounded-bl-3xl" />
      </motion.div>
    </section>
  );
}
