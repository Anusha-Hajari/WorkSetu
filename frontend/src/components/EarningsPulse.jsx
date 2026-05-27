import React from "react";
import { motion } from "framer-motion";

export default function EarningsPulse({ total, active }) {
  // Mock data if not provided
  const valTotal = total || 42800;
  const valActive = active || 8400;

  return (
    <div className="glass-card p-8 relative overflow-hidden border-t-4 border-green-500/30">
      <div className="absolute top-0 right-0 p-4">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"
         />
      </div>

      <h3 className="text-[10px] font-black tracking-[0.3em] text-green-400 mb-8 uppercase">Capital Pulse Dashboard</h3>
      
      <div className="space-y-8">
         <div className="flex justify-between items-end">
            <div>
               <div className="text-[9px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Lifetime Impact</div>
               <div className="text-3xl font-black text-white tracking-tighter">₹{valTotal.toLocaleString()}</div>
            </div>
            <div className="text-right">
               <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">↑ 12% Month</div>
               <div className="text-[8px] font-bold text-[var(--text-muted)]">Verified Transactions</div>
            </div>
         </div>

         {/* Waveform Pulse Visualizer */}
         <div className="h-16 flex items-center gap-1">
            {[...Array(20)].map((_, i) => (
               <motion.div
                 key={i}
                 animate={{ 
                   height: [10, 40, 15, 60, 20],
                   opacity: [0.2, 0.5, 0.2]
                 }}
                 transition={{ 
                   duration: 1.5, 
                   repeat: Infinity, 
                   delay: i * 0.1,
                   ease: "easeInOut"
                 }}
                 className="flex-1 bg-gradient-to-t from-green-500/40 to-green-300 rounded-full"
               />
            ))}
         </div>

         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
               <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Pending Streams</div>
               <div className="text-lg font-black text-green-400">₹{valActive.toLocaleString()}</div>
            </div>
            <div className="text-right">
               <div className="text-[8px] font-black text-[var(--text-hint)] uppercase tracking-widest mb-1">Settlement Speed</div>
               <div className="text-lg font-black text-white">4.2 <span className="text-[10px] text-[var(--text-muted)]">HRS</span></div>
            </div>
         </div>
      </div>

      {/* Decorative background glow */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
