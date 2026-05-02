import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import { Trade } from "@/hooks/use-trades";
import { useSettings, computeDisciplineScore, isWeekend, type AppSettings } from "@/lib/settings";
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
  const [drillDay, setDrillDay] = useState<string | null>(null);
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

  // Vantablack-tier scale: deep neutral charcoal → vibrant emerald
  const getCellStyle = (dateStr: string, date?: Date): React.CSSProperties => {
    if (date && settings.excludeWeekends && isWeekend(date)) {
      return { backgroundColor: "hsl(var(--muted) / 0.08)" };
    }
    const data = dayData[dateStr];
    if (!data || data.count === 0) {
      return { backgroundColor: "hsl(220 6% 10%)" };
    }
    if (mode === "pnl") {
      if (data.pnl >= 0) {
        const i = Math.min(data.pnl / 4, 1);
        return { backgroundColor: `hsl(var(--primary) / ${0.18 + i * 0.82})` };
      }
      const neg = Math.min(Math.abs(data.pnl) / 4, 1);
      return { backgroundColor: `hsl(var(--destructive) / ${0.18 + neg * 0.7})` };
    }
    const avgDisc = data.discipline / data.count;
    const i = Math.min(avgDisc / Math.max(dailyTarget, 0.1), 1);
    if (i < 0.05) return { backgroundColor: "hsl(220 6% 14%)" };
    return { backgroundColor: `hsl(var(--primary) / ${0.18 + i * 0.82})` };
  };

  const todayStr = new Date().toISOString().slice(0, 10);

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

  // Month drill-down view — rendered as a larger modal
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

    // Monthly stats
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalR = monthTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const wins = monthTrades.filter((t) => (t.result_r ?? 0) > 0).length;
    const avgDisc = monthTrades.length > 0
      ? monthTrades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0) / monthTrades.length
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
        onClick={() => { setDrillMonth(null); setDrillDay(null); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated max-w-2xl w-full max-h-[80vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {drillDay ? (
              <motion.div
                key="day-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderDayDetail(drillDay)}
              </motion.div>
            ) : (
              <motion.div
                key="month-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-foreground">{getMonthLabel(month)} {year}</span>
                  <button onClick={() => setDrillMonth(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 border border-border rounded-lg">
                    ← Back
                  </button>
                </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Trades", value: monthTrades.length.toString() },
              { label: "Win Rate", value: monthTrades.length > 0 ? `${Math.round((wins / monthTrades.length) * 100)}%` : "—" },
              { label: "Total R", value: `${totalR > 0 ? "+" : ""}${totalR.toFixed(1)}R` },
              { label: "Avg Discipline", value: avgDisc.toFixed(1) },
            ].map((s) => (
              <div key={s.label} className="glass-card !p-3 text-center">
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
                <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1 justify-center">
            <div className="flex flex-col gap-1 mr-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="text-[10px] text-muted-foreground h-10 leading-10 w-5 text-center">{d}</span>
              ))}
            </div>
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, di) => {
                  const day = week[di];
                  if (!day) return <div key={di} className="w-10 h-10" />;
                  const dateStr = day.toISOString().slice(0, 10);
                  const data = dayData[dateStr];
                  const isWknd = isWeekend(day);
                  const isToday = dateStr === todayStr;
                  return (
                    <div
                      key={di}
                      style={getCellStyle(dateStr, day)}
                      className={`w-10 h-10 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 aspect-square ${isWknd && settings.excludeWeekends ? "opacity-30" : ""} ${isToday ? "ring-2 ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]" : ""}`}
                      onClick={() => setDrillDay(dateStr)}
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
                      <span className="text-[10px] text-muted-foreground/80">{day.getDate()}</span>
                      {data && data.count > 0 && (
                        <span className="text-[8px] text-foreground/60">{data.count}t</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  // Day detail — replaces month grid in-place inside the same modal
  const renderDayDetail = (dateStr: string) => {
    const dayTrades = trades.filter((t) => t.date === dateStr);
    const totalR = dayTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const wins = dayTrades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalDiscipline = dayTrades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0);
    const avgDisc = dayTrades.length > 0 ? totalDiscipline / dayTrades.length : 0;
    const dateObj = new Date(dateStr + "T00:00:00");
    const formatted = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setDrillDay(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 border border-border rounded-lg"
          >
            <ArrowLeft className="h-3 w-3" /> Back to month
          </button>
          <span className="text-sm font-semibold text-foreground">{formatted}</span>
        </div>

        {/* Day summary */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Trades", value: dayTrades.length.toString() },
            { label: "Win Rate", value: dayTrades.length > 0 ? `${Math.round((wins / dayTrades.length) * 100)}%` : "—" },
            { label: "Total R", value: `${totalR > 0 ? "+" : ""}${totalR.toFixed(1)}R` },
            { label: "Discipline", value: `${totalDiscipline.toFixed(1)} pts` },
          ].map((s) => (
            <div key={s.label} className="glass-card !p-3 text-center">
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
              <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Trades list */}
        {dayTrades.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            No trades recorded on this day.
          </div>
        ) : (
          <div className="space-y-2">
            <span className="stat-label text-primary">Trades</span>
            {dayTrades.map((t) => {
              const r = t.result_r ?? 0;
              const disc = computeDisciplineScore(t as any, settings);
              return (
                <div key={t.id} className="glass-card !p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] text-muted-foreground w-6">#{t.trade_number}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.symbol || "—"}</p>
                      <span className="text-[10px] text-muted-foreground truncate block">{t.strategy || "No strategy"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Discipline</span>
                      <p className="text-xs font-semibold text-foreground">{disc.toFixed(1)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Result</span>
                      <p className={`text-xs font-bold ${r >= 0 ? "text-primary" : "text-destructive"}`}>
                        {t.status === "open" ? "Open" : `${r > 0 ? "+" : ""}${r.toFixed(2)}R`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Discipline breakdown */}
            <div className="mt-4 pt-3 border-t border-border">
              <span className="stat-label text-primary">Discipline Breakdown</span>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average per trade</span>
                <span className="font-semibold text-foreground">{avgDisc.toFixed(2)} pts</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily target</span>
                <span className="font-semibold text-foreground">{(settings.dailyPointAvg || 0).toFixed(1)} pts</span>
              </div>
              <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((totalDiscipline / Math.max(settings.dailyPointAvg || 1, 0.1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
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

      {drillMonth !== null && renderMonthDrill(drillMonth)}

      {/* Heatmap Grid */}
      <div className="overflow-x-auto relative">
        <div className="flex gap-0 mb-1 ml-6">
          {monthPositions.map(({ month, weekIndex }) => (
            <span
              key={month}
              className="text-[9px] text-muted-foreground absolute cursor-pointer hover:text-primary transition-colors"
              style={{ left: `${weekIndex * 14 + 24}px` }}
              onClick={() => setDrillMonth(month)}
            >
              {getMonthLabel(month)}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px] mt-4">
          <div className="flex flex-col gap-[3px] mr-1">
            {["", "M", "", "W", "", "F", ""].map((d, i) => (
              <span key={i} className="text-[8px] text-muted-foreground h-3 leading-3">{d}</span>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-3 h-3" />;
                const dateStr = day.toISOString().slice(0, 10);
                const data = dayData[dateStr];
                const isWknd = isWeekend(day);
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={di}
                    style={getCellStyle(dateStr, day)}
                    className={`w-3 h-3 rounded-[3px] aspect-square cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${isWknd && settings.excludeWeekends ? "opacity-20" : ""} ${isToday ? "ring-2 ring-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]" : ""}`}
                    onClick={() => day && setDrillMonth(day.getMonth())}
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
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {[null, 0.25, 0.45, 0.7, 1].map((a, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-[3px] aspect-square"
            style={{ backgroundColor: a == null ? "hsl(220 6% 10%)" : `hsl(var(--primary) / ${a})` }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
        <span className="text-[9px] text-muted-foreground ml-2">|</span>
        <div
          className="w-3 h-3 rounded-[3px] aspect-square ring-2 ring-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]"
          style={{ backgroundColor: "hsl(220 6% 10%)" }}
        />
        <span className="text-[9px] text-muted-foreground">Today</span>
        {settings.excludeWeekends && (
          <>
            <span className="text-[9px] text-muted-foreground ml-2">|</span>
            <div className="w-3 h-3 rounded-[3px] aspect-square opacity-30" style={{ backgroundColor: "hsl(var(--muted) / 0.08)" }} />
            <span className="text-[9px] text-muted-foreground">Weekend</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
