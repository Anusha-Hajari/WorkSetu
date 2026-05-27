import React from "react";
import { motion } from "framer-motion";

export default function SkillRadar({ skills }) {
  // Mock data if no skills provided
  const displaySkills = skills?.length > 0 
    ? skills.map(s => ({ name: s, value: 60 + Math.random() * 40 }))
    : [
        { name: "Reliability", value: 85 },
        { name: "Speed", value: 70 },
        { name: "Accuracy", value: 90 },
        { name: "Communication", value: 75 },
        { name: "Craftsmanship", value: 80 }
      ];

  const size = 300;
  const center = size / 2;
  const radius = center - 40;
  const angleStep = (Math.PI * 2) / displaySkills.length;

  // Calculate points for the radar
  const points = displaySkills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (skill.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      name: skill.name,
      labelX: center + (radius + 20) * Math.cos(angle),
      labelY: center + (radius + 20) * Math.sin(angle)
    };
  });

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-black tracking-[0.4em] text-[var(--gold)] uppercase mb-6">
        Neural Skill Distribution
      </div>
      
      <div className="relative w-[300px] h-[300px]">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Concentric Circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * scale}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              className="opacity-20"
            />
          ))}

          {/* Axes */}
          {points.map((p, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)}
              y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)}
              stroke="var(--gold)"
              strokeWidth="0.5"
              className="opacity-20"
            />
          ))}

          {/* Data Polygon */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d={pathData}
            fill="var(--gold)"
            className="fill-[var(--gold)]/20"
            stroke="var(--gold)"
            strokeWidth="2"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 + i * 0.1 }}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--gold)"
              className="shadow-[0_0_10px_var(--gold)]"
            />
          ))}

          {/* Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              className="text-[8px] font-black fill-[var(--text-muted)] uppercase tracking-tighter"
            >
              {p.name.length > 10 ? p.name.slice(0, 8) + ".." : p.name}
            </text>
          ))}
        </svg>

        {/* Glow behind the graph */}
        <div className="absolute inset-0 bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />
      </div>
      
      <div className="mt-8 flex gap-4">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--gold)] shadow-[0_0_5px_var(--gold)]" />
            <span className="text-[9px] font-black text-[var(--text-hint)] uppercase tracking-widest">Active Capability</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <span className="text-[9px] font-black text-[var(--text-hint)] uppercase tracking-widest">Potential</span>
         </div>
      </div>
    </div>
  );
}
