import { motion } from "framer-motion";

interface GaugeChartProps {
  value: number; // 0-100
  label: string;
  size?: number;
}

export default function GaugeChart({ value, label, size = 160 }: GaugeChartProps) {
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return "hsl(var(--teal-glow))";
    if (v >= 50) return "hsl(var(--gold))";
    return "hsl(var(--loss))";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.65} viewBox="0 0 160 100">
        {/* Track */}
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          className="gauge-track"
          strokeWidth="8"
        />
        {/* Fill */}
        <motion.path
          d="M 20 90 A 60 60 0 0 1 140 90"
          stroke={getColor(value)}
          strokeWidth="8"
          className="gauge-fill"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Value text */}
        <text
          x="80"
          y="78"
          textAnchor="middle"
          className="fill-foreground font-mono text-2xl font-bold"
          fontSize="28"
        >
          {value}%
        </text>
      </svg>
      <span className="stat-label">{label}</span>
    </div>
  );
}
