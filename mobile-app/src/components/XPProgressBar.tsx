import { getRankProgress } from "@/lib/xp-math";

interface XPProgressBarProps {
  totalXP: number;
}

export default function XPProgressBar({ totalXP }: XPProgressBarProps) {
  const { current, next, progress, xpNeeded } = getRankProgress(totalXP);

  return (
    <div className="glass-elevated p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">Current Rank</p>
          <p className="text-lg font-bold text-foreground flex items-center gap-1">
            <span>{current.emoji}</span>
            {current.name}
          </p>
        </div>
        <div className="text-right">
          <p className="stat-label">Total XP</p>
          <p className="text-xl font-bold text-primary">{totalXP}</p>
        </div>
      </div>

      {next && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="stat-label text-xs">Progress to {next.name}</p>
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-profit to-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {xpNeeded} XP needed
          </p>
        </div>
      )}
    </div>
  );
}
