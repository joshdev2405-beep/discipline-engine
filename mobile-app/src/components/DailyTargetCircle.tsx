interface DailyTargetCircleProps {
  currentTrades: number;
  dailyTarget: number;
}

export default function DailyTargetCircle({ currentTrades, dailyTarget }: DailyTargetCircleProps) {
  const percentage = (currentTrades / dailyTarget) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <p className="stat-label mb-2">Daily Target</p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="hsl(var(--profit))"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-profit">{currentTrades}</p>
            <p className="text-xs text-muted-foreground">/{dailyTarget}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
