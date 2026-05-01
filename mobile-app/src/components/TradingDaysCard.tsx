import { getTradingDaysInMonth } from "@/lib/discipline-score";
import { Calendar } from "lucide-react";

export default function TradingDaysCard() {
  const tradingDays = getTradingDaysInMonth(true);
  const today = new Date().getDate();

  return (
    <div className="glass-elevated p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <p className="stat-label">Trading Days This Month</p>
        </div>
        <p className="text-2xl font-bold text-accent">{tradingDays}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Day {today} • Weekends excluded
      </p>
    </div>
  );
}
