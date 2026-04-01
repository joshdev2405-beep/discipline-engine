import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTrades, Trade } from "@/hooks/use-trades";
import { MOOD_LABELS, AVAILABLE_TAGS } from "@/lib/types";
import { BarChart3, Settings as GearIcon, Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useSettings, computeDisciplineScore } from "@/lib/settings";
import { supabase } from "@/integrations/supabase/client";

type WidgetMetric = "win_rate" | "avg_discipline" | "avg_r" | "trade_volume" | "points_per_rule";

const WIDGET_OPTIONS: { value: WidgetMetric; label: string }[] = [
  { value: "win_rate", label: "Win Rate" },
  { value: "avg_discipline", label: "Avg Discipline Score" },
  { value: "avg_r", label: "Average R" },
  { value: "trade_volume", label: "Trade Volume" },
  { value: "points_per_rule", label: "Points per Rule" },
];

function useWidgetData(metric: WidgetMetric, closedTrades: Trade[]) {
  const { settings } = useSettings();
  const strategies = [...new Set(closedTrades.map((t) => t.strategy))];

  return strategies.map((strat) => {
    const trades = closedTrades.filter((t) => t.strategy === strat);
    const wins = trades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = trades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const ruleFollowed = trades.filter((t) => t.followed_rules).length;
    const avgDiscipline = trades.length > 0
      ? trades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0) / trades.length
      : 0;

    let value = 0;
    switch (metric) {
      case "win_rate": value = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0; break;
      case "avg_discipline": value = +avgDiscipline.toFixed(1); break;
      case "avg_r": value = trades.length > 0 ? +(totalR / trades.length).toFixed(2) : 0; break;
      case "trade_volume": value = trades.length; break;
      case "points_per_rule": value = ruleFollowed > 0 ? +(totalR / ruleFollowed).toFixed(2) : 0; break;
    }

    return { name: strat, value };
  });
}

function WidgetCard({ defaultMetric, delay, closedTrades }: { defaultMetric: WidgetMetric; delay: number; closedTrades: Trade[] }) {
  const [metric, setMetric] = useState<WidgetMetric>(defaultMetric);
  const [showSettings, setShowSettings] = useState(false);
  const data = useWidgetData(metric, closedTrades);
  const label = WIDGET_OPTIONS.find((o) => o.value === metric)?.label ?? "";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card-elevated relative">
      <div className="flex items-center justify-between mb-4">
        <span className="stat-label">{label} by Strategy</span>
        <button onClick={() => setShowSettings(!showSettings)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <GearIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {showSettings && (
        <div className="absolute right-3 top-12 z-10 bg-card border border-border rounded-lg p-2 shadow-xl">
          {WIDGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setMetric(opt.value); setShowSettings(false); }}
              className={`block w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${metric === opt.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14% / 0.5)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 10% 45%)" }} axisLine={{ stroke: "hsl(220 12% 14%)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215 10% 45%)" }} axisLine={{ stroke: "hsl(220 12% 14%)" }} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(222 18% 8% / 0.95)", border: "1px solid hsl(220 12% 16%)", borderRadius: "8px", fontSize: 12, backdropFilter: "blur(12px)" }}
              labelStyle={{ color: "hsl(210 20% 92%)" }}
              cursor={{ fill: "hsl(220 12% 14% / 0.3)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? "hsl(160 84% 39% / 0.7)" : "hsl(0 72% 55% / 0.7)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

type DateRange = "week" | "month" | "quarter" | "all" | "custom";

function getDateCutoff(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "week") { now.setDate(now.getDate() - 7); return now; }
  if (range === "month") { now.setMonth(now.getMonth() - 1); return now; }
  if (range === "quarter") { now.setMonth(now.getMonth() - 3); return now; }
  return null;
}

export default function Analytics() {
  const { trades, tags, isLoading } = useTrades();
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const cutoff = getDateCutoff(dateRange);
  const filteredTrades = trades.filter((t) => {
    if (t.status !== "closed") return false;
    const d = new Date(t.date);
    if (dateRange === "custom") {
      if (customStart && d < new Date(customStart)) return false;
      if (customEnd && d > new Date(customEnd)) return false;
      return true;
    }
    if (cutoff && d < cutoff) return false;
    return true;
  });
  const closedTrades = filteredTrades;

  const moodAnalysis = [1, 2, 3, 4, 5].map((mood) => {
    const moodTrades = closedTrades.filter((t) => t.mood_score === mood);
    const wins = moodTrades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = moodTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const ruleFollowed = moodTrades.filter((t) => t.followed_rules).length;
    return {
      mood, label: MOOD_LABELS[mood], count: moodTrades.length,
      winRate: moodTrades.length > 0 ? Math.round((wins / moodTrades.length) * 100) : 0,
      avgR: moodTrades.length > 0 ? +(totalR / moodTrades.length).toFixed(2) : 0,
      discipline: moodTrades.length > 0 ? Math.round((ruleFollowed / moodTrades.length) * 100) : 0,
    };
  });

  const tagAnalysis = AVAILABLE_TAGS.map((tag) => {
    const taggedTradeIds = tags.filter((tt) => tt.tag === tag).map((tt) => tt.trade_id);
    const tagTrades = closedTrades.filter((t) => taggedTradeIds.includes(t.id));
    const wins = tagTrades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = tagTrades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    return { tag, count: tagTrades.length, winRate: tagTrades.length > 0 ? Math.round((wins / tagTrades.length) * 100) : 0, avgR: tagTrades.length > 0 ? +(totalR / tagTrades.length).toFixed(2) : 0 };
  }).filter((t) => t.count > 0);

  // AI Insights
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (closedTrades.length > 0) {
      fetchAnalyticsInsights();
    }
  }, [closedTrades.length]);

  const fetchAnalyticsInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          type: "analytics",
          trades: closedTrades.map((t) => ({
            date: t.date, symbol: t.symbol, followed_rules: t.followed_rules,
            result_r: t.result_r, mood_score: t.mood_score, strategy: t.strategy,
          })),
          tags: tags,
        },
      });
      if (error) throw error;
      if (data?.insights) setAiInsights(data.insights);
    } catch {
      setAiInsights([
        "Your best win rate comes from trades tagged 'Rule-Based' — keep it up.",
        "Mood score of 4 ('Focused') correlates with highest average R.",
        "Consider journaling more on losing trades to identify patterns.",
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {(["week", "month", "quarter", "all", "custom"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
                dateRange === r
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {r === "week" ? "1W" : r === "month" ? "1M" : r === "quarter" ? "3M" : r === "all" ? "All" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {dateRange === "custom" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-3">
          <div>
            <label className="stat-label">From</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="block mt-1 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="stat-label">To</label>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="block mt-1 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
          </div>
        </motion.div>
      )}

      {/* AI Insights Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated ai-shimmer">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="stat-label text-primary">AI Performance Coach</span>
        </div>
        {aiLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (<div key={i} className="h-4 bg-muted/50 rounded animate-pulse" />))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {aiInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary/50 mt-0.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Customizable Widget Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WidgetCard defaultMetric="win_rate" delay={0.05} closedTrades={closedTrades} />
        <WidgetCard defaultMetric="avg_discipline" delay={0.1} closedTrades={closedTrades} />
      </div>

      {/* Mood & Tag Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-elevated">
          <span className="stat-label">Mood → Win Rate & Avg R</span>
          <div className="mt-4 space-y-4">
            {moodAnalysis.map((m) => (
              <div key={m.mood} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{m.mood}. {m.label}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-foreground">{m.winRate}% WR</span>
                    <span className={m.avgR >= 0 ? "text-profit" : "text-loss"}>{m.avgR > 0 ? "+" : ""}{m.avgR}R</span>
                    <span className="text-muted-foreground">{m.discipline}% disc.</span>
                  </div>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.winRate}%` }} transition={{ duration: 0.8, delay: 0.1 * m.mood }} className="h-full rounded-full bg-primary/50" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-elevated">
          <span className="stat-label">Tag → Win Rate & Avg R</span>
          <div className="mt-4 space-y-4">
            {tagAnalysis.length === 0 && <p className="text-xs text-muted-foreground">No tag data yet</p>}
            {tagAnalysis.map((t) => (
              <div key={t.tag} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.tag}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-foreground">{t.winRate}% WR</span>
                    <span className={t.avgR >= 0 ? "text-profit" : "text-loss"}>{t.avgR > 0 ? "+" : ""}{t.avgR}R</span>
                    <span className="text-muted-foreground">({t.count})</span>
                  </div>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${t.winRate}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${t.avgR >= 0 ? "bg-primary/50" : "bg-destructive/50"}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
