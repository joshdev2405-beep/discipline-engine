import { motion } from "framer-motion";

interface DisciplineScoreProps {
  label: string;
  score: number;
  trades: number;
  wins: number;
}

export default function DisciplineScore({ label, score, trades, wins }: DisciplineScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-primary";
    if (s >= 50) return "text-accent";
    return "text-destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col gap-3"
    >
      <span className="stat-label">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`stat-value ${getScoreColor(score)}`}>{score}%</span>
        <span className="text-[10px] font-mono text-muted-foreground">discipline</span>
      </div>
      <div className="flex gap-4 mt-1">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground">Trades</span>
          <p className="text-sm font-mono font-semibold text-foreground">{trades}</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground">Wins</span>
          <p className="text-sm font-mono font-semibold text-profit">{wins}</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground">Win Rate</span>
          <p className="text-sm font-mono font-semibold text-foreground">
            {trades > 0 ? Math.round((wins / trades) * 100) : 0}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
