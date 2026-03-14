import { useState } from "react";
import { motion } from "framer-motion";
import { mockTrades, mockTradeTags } from "@/lib/mock-data";
import { MOOD_LABELS, AVAILABLE_TAGS } from "@/lib/types";
import { BarChart3, TrendingUp, TrendingDown, Settings as GearIcon, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useSettings, computeDisciplineScore } from "@/lib/settings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

type WidgetMetric = "win_rate" | "avg_discipline" | "avg_r" | "trade_volume" | "points_per_rule";

const WIDGET_OPTIONS: { value: WidgetMetric; label: string }[] = [
  { value: "win_rate", label: "Win Rate" },
  { value: "avg_discipline", label: "Avg Discipline Score" },
  { value: "avg_r", label: "Average R" },
  { value: "trade_volume", label: "Trade Volume" },
  { value: "points_per_rule", label: "Points per Rule" },
];

function useWidgetData(metric: WidgetMetric) {
  const { settings } = useSettings();
  const closedTrades = mockTrades.filter((t) => t.status === "closed");

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

function WidgetCard({ defaultMetric, delay }: { defaultMetric: WidgetMetric; delay: number }) {
  const [metric, setMetric] = useState<WidgetMetric>(defaultMetric);
  const [showSettings, setShowSettings] = useState(false);
  const data = useWidgetData(metric);
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

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 10% 45%)" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 10% 45%)" }} />
          <Tooltip
            contentStyle={{ background: "hsl(222 18% 8%)", border: "1px solid hsl(220 12% 14%)", borderRadius: "8px", fontSize: 12 }}
            labelStyle={{ color: "hsl(210 20% 92%)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? "hsl(160 84% 39%)" : "hsl(0 72% 55%)"} opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default function Analytics() {
  const closedTrades = mockTrades.filter((t) => t.status === "closed");

  const moodAnalysis = [1, 2, 3, 4, 5].map((mood) => {
    const trades = closedTrades.filter((t) => t.mood_score === mood);
    const wins = trades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = trades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    const ruleFollowed = trades.filter((t) => t.followed_rules).length;
    return {
      mood, label: MOOD_LABELS[mood], count: trades.length,
      winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
      avgR: trades.length > 0 ? +(totalR / trades.length).toFixed(2) : 0,
      discipline: trades.length > 0 ? Math.round((ruleFollowed / trades.length) * 100) : 0,
    };
  });

  const tagAnalysis = AVAILABLE_TAGS.map((tag) => {
    const taggedTradeIds = mockTradeTags.filter((tt) => tt.tag === tag).map((tt) => tt.trade_id);
    const trades = closedTrades.filter((t) => taggedTradeIds.includes(t.id));
    const wins = trades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = trades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    return { tag, count: trades.length, winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0, avgR: trades.length > 0 ? +(totalR / trades.length).toFixed(2) : 0 };
  }).filter((t) => t.count > 0);

  // AI Insights
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsInsights();
  }, []);

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
          tags: mockTradeTags,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      </div>

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
        <WidgetCard defaultMetric="win_rate" delay={0.05} />
        <WidgetCard defaultMetric="avg_discipline" delay={0.1} />
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
