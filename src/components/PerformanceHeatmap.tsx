import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Trade } from "@/hooks/use-trades";
import { useSettings, computeDisciplineScore, isWeekend, AppSettings } from "@/lib/settings";

type HeatmapMode = "pnl" | "discipline";

function getDaysInMonth(year: number, month: number) {
  const days: Date[] = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Props {
  trades: Trade[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}

export default function PerformanceHeatmap({ trades, selectedDate, onSelectDate }: Props) {
  const [mode, setMode] = useState<HeatmapMode>("discipline");
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const { settings } = useSettings();

  const dayData = useMemo(() => {
    const map: Record<string, { pnl: number; discipline: number; count: number; wins: number }> = {};
    for (const trade of trades) {
      const key = trade.date;
      if (!map[key]) map[key] = { pnl: 0, discipline: 0, count: 0, wins: 0 };
      map[key].pnl += trade.result_r ?? 0;
      map[key].discipline += computeDisciplineScore(trade as any, settings);
      map[key].count += 1;
      if ((trade.result_r ?? 0) > 0) map[key].wins += 1;
    }
    return map;
  }, [trades, settings]);

  const dailyTarget = settings.dailyPointAvg || 3;
  const todayStr = today.toISOString().slice(0, 10);

  const monthDays = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = monthDays[0].getDay();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
  for (const d of monthDays) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const getCellStyle = (date: Date | null): React.CSSProperties => {
    if (!date) return { backgroundColor: "transparent" };
    if (settings.excludeWeekends && isWeekend(date)) {
      return { backgroundColor: "hsl(var(--muted) / 0.06)" };
    }
    const data = dayData[date.toISOString().slice(0, 10)];
    if (!data || data.count === 0) {
      return { backgroundColor: "hsl(220 6% 9%)" };
    }
    if (mode === "pnl") {
      if (data.pnl >= 0) {
        const i = Math.min(data.pnl / 4, 1);
        return { backgroundColor: `hsl(var(--primary) / ${0.2 + i * 0.8})` };
      }
      const neg = Math.min(Math.abs(data.pnl) / 4, 1);
      return { backgroundColor: `hsl(var(--destructive) / ${0.2 + neg * 0.7})` };
    }
    const avgDisc = data.discipline / data.count;
    const i = Math.min(avgDisc / Math.max(dailyTarget, 0.1), 1);
    if (i < 0.05) return { backgroundColor: "hsl(220 6% 13%)" };
    return { backgroundColor: `hsl(var(--primary) / ${0.2 + i * 0.8})` };
  };

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Month aggregate
  const monthTrades = trades.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const monthR = monthTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
  const monthDisc = monthTrades.length > 0
    ? monthTrades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0) / monthTrades.length
    : 0;

  return (
    <motion.div layout className="glass-card-elevated">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="stat-label text-primary">Performance Heatmap</span>
        </div>
        <div className="flex items-center gap-2">
          {(["pnl", "discipline"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
                mode === m
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {m === "pnl" ? "P/L" : "Discipline"}
            </button>
          ))}
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="h-11 w-11 flex items-center justify-center rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground tracking-tight">
            {MONTH_LABELS[viewMonth]} {viewYear}
          </span>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
            <span>{monthTrades.length} trades</span>
            <span>•</span>
            <span className={monthR >= 0 ? "text-primary" : "text-destructive"}>
              {monthR > 0 ? "+" : ""}{monthR.toFixed(1)}R
            </span>
            <span>•</span>
            <span>{monthDisc.toFixed(1)} avg pts</span>
          </div>
        </div>
        <button
          onClick={goNext}
          className="h-11 w-11 flex items-center justify-center rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — large clickable tiles */}
      <div className="grid grid-cols-7 gap-2">
        {grid.map((date, idx) => {
          if (!date) return <div key={idx} className="aspect-square" />;
          const dateStr = date.toISOString().slice(0, 10);
          const data = dayData[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isWknd = isWeekend(date);
          const isDimmed = isWknd && settings.excludeWeekends;
          const handleClick = () => {
            if (!onSelectDate) return;
            onSelectDate(isSelected ? null : dateStr);
          };
          return (
            <motion.button
              key={idx}
              type="button"
              onClick={handleClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={getCellStyle(date)}
              className={`relative aspect-square rounded-xl flex flex-col items-start justify-between p-2 text-left transition-all border ${
                isSelected
                  ? "border-primary ring-2 ring-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                  : isToday
                  ? "border-primary/70 ring-1 ring-primary/40 shadow-[0_0_14px_hsl(var(--primary)/0.45)]"
                  : "border-border/40 hover:border-primary/40"
              } ${isDimmed ? "opacity-30" : ""}`}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground/85"}`}>
                {date.getDate()}
              </span>
              {data && data.count > 0 && (
                <div className="flex flex-col items-start w-full">
                  {mode === "pnl" ? (
                    <span className={`text-[10px] font-bold ${data.pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                      {data.pnl > 0 ? "+" : ""}{data.pnl.toFixed(1)}R
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-primary">
                      {data.discipline.toFixed(1)}p
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground">{data.count}t</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day breakdown — in-place */}
      <AnimatePresence initial={false}>
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <DayBreakdown
              date={selectedDate}
              trades={trades.filter((t) => t.date === selectedDate)}
              settings={settings}
              onClose={() => onSelectDate?.(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {[null, 0.25, 0.45, 0.7, 1].map((a, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-[3px]"
            style={{ backgroundColor: a == null ? "hsl(220 6% 9%)" : `hsl(var(--primary) / ${a})` }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
        <span className="text-[9px] text-muted-foreground ml-2">•</span>
        <span className="text-[9px] text-muted-foreground">Click any day for details</span>
      </div>
    </motion.div>
  );
}

function DayBreakdown({
  date,
  trades,
  settings,
  onClose,
}: {
  date: string;
  trades: Trade[];
  settings: AppSettings;
  onClose: () => void;
}) {
  const totalR = trades.reduce((s, t) => s + (t.result_r ?? 0), 0);
  const wins = trades.filter((t) => (t.result_r ?? 0) > 0).length;
  const totalPts = trades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0);
  const followed = trades.filter((t) => t.followed_rules).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="mt-5 pt-5 border-t border-border/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-bold text-foreground">{dateLabel}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {trades.length === 0 ? "No trades on this day" : `${trades.length} trade${trades.length === 1 ? "" : "s"} logged`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border transition-colors"
        >
          Close
        </button>
      </div>

      {trades.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Total R", value: `${totalR > 0 ? "+" : ""}${totalR.toFixed(2)}R`, color: totalR >= 0 ? "text-primary" : "text-destructive" },
              { label: "Win Rate", value: `${winRate}%`, color: "text-foreground" },
              { label: "Discipline", value: `${totalPts.toFixed(1)}p`, color: "text-primary" },
              { label: "Rules Followed", value: `${followed}/${trades.length}`, color: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="glass-card !p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {trades.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs"
              >
                <span className="text-foreground font-semibold w-16 truncate">{t.symbol}</span>
                <span className={`font-bold w-16 ${(t.result_r ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                  {t.result_r != null ? `${t.result_r > 0 ? "+" : ""}${t.result_r}R` : "—"}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.followed_rules ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {t.followed_rules ? "✓ Rules" : "✗ Broke"}
                </span>
                {t.strategy && (
                  <span className="text-[10px] text-muted-foreground truncate flex-1">{t.strategy}</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {computeDisciplineScore(t as any, settings).toFixed(1)}p
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}