import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { Trade } from "@/hooks/use-trades";
import { useSettings, computeDisciplineScore, isWeekend } from "@/lib/settings";
import { useNavigate } from "react-router-dom";

type HeatmapMode = "pnl" | "discipline";

function getDaysInYear(year: number) {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getDaysInMonth(year: number, month: number) {
  const days: Date[] = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getMonthLabel(month: number) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month];
}

export default function PerformanceHeatmap({ trades }: { trades: Trade[] }) {
  const [mode, setMode] = useState<HeatmapMode>("pnl");
  const [expanded, setExpanded] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; value: number; x: number; y: number } | null>(null);
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const { settings } = useSettings();

  const year = new Date().getFullYear();

  // Build lookup
  const dayData: Record<string, { pnl: number; discipline: number; count: number }> = {};
  for (const trade of trades) {
    const key = trade.date;
    if (!dayData[key]) dayData[key] = { pnl: 0, discipline: 0, count: 0 };
    dayData[key].pnl += trade.result_r ?? 0;
    dayData[key].discipline += computeDisciplineScore(trade as any, settings);
    dayData[key].count += 1;
  }

  const dailyTarget = settings.dailyPointAvg || 3;

  const getCellColor = (dateStr: string, date?: Date) => {
    // Weekend handling
    if (date && settings.excludeWeekends && isWeekend(date)) {
      return "bg-muted/10"; // Gray/null for weekends
    }

    const data = dayData[dateStr];
    if (!data || data.count === 0) return "bg-muted/30";

    if (mode === "pnl") {
      if (data.pnl > 2) return "bg-primary/80";
      if (data.pnl > 0) return "bg-primary/40";
      if (data.pnl === 0) return "bg-muted-foreground/20";
      if (data.pnl > -2) return "bg-destructive/40";
      return "bg-destructive/80";
    } else {
      const avgDisc = data.discipline / data.count;
      if (avgDisc >= dailyTarget) return "bg-primary/70";
      if (avgDisc >= dailyTarget * 0.7) return "bg-primary/35";
      if (avgDisc >= dailyTarget * 0.4) return "bg-accent/40";
      return "bg-destructive/50";
    }
  };

  // Year view
  const days = getDaysInYear(year);
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const firstDay = days[0].getDay();
  for (let i = 0; i < firstDay; i++) currentWeek.push(null as any);
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const monthPositions: { month: number; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    for (const day of week) {
      if (day && day.getMonth() !== lastMonth) {
        lastMonth = day.getMonth();
        monthPositions.push({ month: lastMonth, weekIndex: wi });
        break;
      }
    }
  });

  // Monthly summary
  const monthlySummary = Array.from({ length: 12 }, (_, m) => {
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === m;
    });
    const totalR = monthTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const avgDisc = monthTrades.length > 0
      ? monthTrades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0) / monthTrades.length
      : 0;
    return { month: m, trades: monthTrades.length, pnl: totalR, discipline: avgDisc };
  });

  // Month drill-down view
  const renderMonthDrill = (month: number) => {
    const monthDays = getDaysInMonth(year, month);
    const monthWeeks: Date[][] = [];
    let mWeek: Date[] = [];
    const mFirstDay = monthDays[0].getDay();
    for (let i = 0; i < mFirstDay; i++) mWeek.push(null as any);
    for (const day of monthDays) {
      mWeek.push(day);
      if (mWeek.length === 7) {
        monthWeeks.push(mWeek);
        mWeek = [];
      }
    }
    if (mWeek.length > 0) monthWeeks.push(mWeek);

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">{getMonthLabel(month)} {year} — Detailed View</span>
          <button onClick={() => setDrillMonth(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Back to Year</button>
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-[9px] text-muted-foreground h-[18px] leading-[18px] w-4 text-center">{d}</span>
            ))}
          </div>
          {monthWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-[18px] h-[18px]" />;
                const dateStr = day.toISOString().slice(0, 10);
                const data = dayData[dateStr];
                const isWknd = isWeekend(day);
                return (
                  <div
                    key={di}
                    className={`w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${getCellColor(dateStr, day)} ${isWknd && settings.excludeWeekends ? "opacity-30" : ""}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredDay({
                        date: dateStr,
                        value: data ? (mode === "pnl" ? data.pnl : data.discipline / Math.max(data.count, 1)) : 0,
                        x: rect.left, y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <span className="text-muted-foreground/60">{day.getDate()}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      layout
      className={`glass-card-elevated ${expanded ? "fixed inset-4 z-50 overflow-auto" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="stat-label text-primary">{year} Performance Heatmap</span>
          <div className="flex gap-1">
            {(["pnl", "discipline"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
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
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {drillMonth !== null ? (
        renderMonthDrill(drillMonth)
      ) : (
        <>
          {/* Heatmap Grid */}
          <div className="overflow-x-auto relative">
            <div className="flex gap-0 mb-1 ml-6">
              {monthPositions.map(({ month, weekIndex }) => (
                <span
                  key={month}
                  className="text-[9px] text-muted-foreground absolute"
                  style={{ left: `${weekIndex * 14 + 24}px` }}
                >
                  {getMonthLabel(month)}
                </span>
              ))}
            </div>

            <div className="flex gap-[2px] mt-4">
              <div className="flex flex-col gap-[2px] mr-1">
                {["", "M", "", "W", "", "F", ""].map((d, i) => (
                  <span key={i} className="text-[8px] text-muted-foreground h-[11px] leading-[11px]">{d}</span>
                ))}
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }, (_, di) => {
                    const day = week[di];
                    if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                    const dateStr = day.toISOString().slice(0, 10);
                    const data = dayData[dateStr];
                    const isWknd = isWeekend(day);
                    return (
                      <div
                        key={di}
                        className={`w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${getCellColor(dateStr, day)} ${isWknd && settings.excludeWeekends ? "opacity-20" : ""}`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: dateStr,
                            value: data ? (mode === "pnl" ? data.pnl : data.discipline / Math.max(data.count, 1)) : 0,
                            x: rect.left, y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredDay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed z-[60] px-2 py-1 rounded-lg bg-card border border-border text-xs shadow-xl pointer-events-none"
                  style={{ left: hoveredDay.x + 16, top: hoveredDay.y - 8 }}
                >
                  <span className="text-muted-foreground">{hoveredDay.date}</span>
                  <span className={`ml-2 font-semibold ${hoveredDay.value >= 0 ? "text-primary" : "text-destructive"}`}>
                    {mode === "pnl" ? `${hoveredDay.value > 0 ? "+" : ""}${hoveredDay.value.toFixed(1)}R` : `${hoveredDay.value.toFixed(1)} pts`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Monthly Overview (click to drill) */}
      {expanded && drillMonth === null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-4 md:grid-cols-6 gap-2"
        >
          {monthlySummary.map((m) => (
            <button
              key={m.month}
              onClick={() => setDrillMonth(m.month)}
              className={`p-3 rounded-lg border transition-all text-left hover:ring-1 hover:ring-primary/30 ${
                m.trades > 0
                  ? mode === "pnl"
                    ? m.pnl >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
                    : m.discipline >= dailyTarget ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{getMonthLabel(m.month)}</span>
              <p className={`text-sm font-bold ${m.pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                {mode === "pnl" ? `${m.pnl > 0 ? "+" : ""}${m.pnl.toFixed(1)}R` : `${m.discipline.toFixed(1)}`}
              </p>
              <span className="text-[9px] text-muted-foreground">{m.trades} trades</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {["bg-muted/30", mode === "pnl" ? "bg-destructive/40" : "bg-accent/40", "bg-muted-foreground/20", mode === "pnl" ? "bg-primary/40" : "bg-primary/35", mode === "pnl" ? "bg-primary/80" : "bg-primary/70"].map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
        {settings.excludeWeekends && (
          <>
            <span className="text-[9px] text-muted-foreground ml-2">|</span>
            <div className="w-[11px] h-[11px] rounded-sm bg-muted/10 opacity-30" />
            <span className="text-[9px] text-muted-foreground">Weekend</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
