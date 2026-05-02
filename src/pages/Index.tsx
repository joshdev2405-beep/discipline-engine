import { motion } from "framer-motion";
import DisciplineScore from "@/components/DisciplineScore";
import GaugeChart from "@/components/GaugeChart";
import PerformanceHeatmap from "@/components/PerformanceHeatmap";
import { useTrades, Trade } from "@/hooks/use-trades";
import { MOOD_LABELS } from "@/lib/types";
import { useSettings, computeDisciplineScore, computeRuleStreak } from "@/lib/settings";
import { AlertTriangle, TrendingUp, Brain, Shield, Flame, Camera, Target, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function computeStats(trades: Trade[], days?: number) {
  let filtered = trades.filter((t) => t.status === "closed");
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    filtered = filtered.filter((t) => new Date(t.date) >= cutoff);
  }
  const total = filtered.length;
  const followed = filtered.filter((t) => t.followed_rules).length;
  const wins = filtered.filter((t) => (t.result_r ?? 0) > 0).length;
  const discipline = total > 0 ? Math.round((followed / total) * 100) : 0;
  return { total, wins, discipline };
}

export default function Dashboard() {
  const { settings } = useSettings();
  const { trades, tags, isLoading } = useTrades();

  const today = computeStats(trades, 1);
  const week = computeStats(trades, 7);
  const allTime = computeStats(trades);

  const closedTrades = trades.filter((t) => t.status === "closed");

  const todayTrades = trades.filter(
    (t) => (t.end_date || t.date) === new Date().toISOString().slice(0, 10) && t.status === "closed"
  );
  const todayPoints = todayTrades.reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0);
  // Daily Discipline Score ceiling is driven directly by the Daily Avg Points setting
  const maxPossiblePoints = settings.dailyPointAvg || 1;
  const dailyScorePercent = maxPossiblePoints > 0
    ? Math.min(Math.round((todayPoints / maxPossiblePoints) * 100), 100)
    : 0;

  const streak = computeRuleStreak(closedTrades, settings.excludeWeekends);

  const photosThisMonth = closedTrades.filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() &&
      (t.before_screenshot_url || t.after_screenshot_url);
  }).length;
  const photoProgress = settings.monthlyPhotoQuota > 0
    ? Math.min(Math.round((photosThisMonth / settings.monthlyPhotoQuota) * 100), 100) : 0;

  const tradesThisMonth = closedTrades.filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const tradeProgress = settings.monthlyTradeTarget > 0
    ? Math.min(Math.round((tradesThisMonth / settings.monthlyTradeTarget) * 100), 100) : 0;

  // Monthly points progress
  const monthlyPointTarget = (settings as any).monthlyPointTarget ?? 90;
  const monthlyPoints = closedTrades
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + computeDisciplineScore(t as any, settings), 0);
  const pointsProgress = monthlyPointTarget > 0
    ? Math.min(Math.round((monthlyPoints / monthlyPointTarget) * 100), 100) : 0;

  const adherence = allTime.discipline;

  const moodGroups = [1, 2, 3, 4, 5].map((mood) => {
    const moodTrades = closedTrades.filter((t) => t.mood_score === mood);
    const avgR = moodTrades.length > 0
      ? moodTrades.reduce((s, t) => s + (t.result_r ?? 0), 0) / moodTrades.length
      : 0;
    return { mood, label: MOOD_LABELS[mood], trades: moodTrades.length, avgR: +avgR.toFixed(2) };
  });

  const ruleBreaks = trades
    .filter((t) => !t.followed_rules && t.status === "closed")
    .slice(0, 3);

  // AI Insights
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (closedTrades.length > 0) {
      fetchAiInsights();
    }
  }, [closedTrades.length]);

  const fetchAiInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          trades: closedTrades.map((t) => ({
            date: t.date, symbol: t.symbol, followed_rules: t.followed_rules,
            result_r: t.result_r, mood_score: t.mood_score, strategy: t.strategy,
            trade_number: t.trade_number,
          })),
        },
      });
      if (error) throw error;
      if (data?.insights) setAiInsights(data.insights);
    } catch {
      setAiInsights([
        "Discipline consistency is higher when mood score ≥ 4.",
        "Rule adherence drops on Trade #3 — consider reducing daily cap.",
        "Best R-multiple performance comes from Breakout strategies.",
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
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated glow-emerald flex flex-col items-center justify-center py-8">
          <span className="stat-label mb-3">Daily Discipline Score</span>
          <div className="relative">
            <span className="text-6xl font-black text-primary">{dailyScorePercent}</span>
            <span className="text-lg text-primary/60 ml-1">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{todayPoints.toFixed(1)} / {maxPossiblePoints.toFixed(1)} pts</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {dailyScorePercent >= 80 ? "🔥 Elite execution" : dailyScorePercent >= 50 ? "⚡ Room to improve" : "⚠ Needs attention"}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="glass-card-elevated flex flex-col items-center justify-center py-8">
          <span className="stat-label mb-3">Rule Consistency Streak</span>
          <div className="flex items-center gap-2">
            <Flame className={`h-8 w-8 ${streak >= 5 ? "text-accent animate-pulse-glow" : "text-muted-foreground"}`} />
            <span className="text-5xl font-black text-foreground">{streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {streak >= 10 ? "🏆 Unstoppable!" : streak >= 5 ? "🔥 On fire!" : "Keep building momentum"}
          </p>
        </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card-elevated flex flex-col items-center justify-center py-6">
          <span className="stat-label mb-4">Monthly Progress</span>
          <div className="flex items-center gap-5">
            <ProgressRing value={tradeProgress} label="Trades" icon={Target} color="primary" />
            <ProgressRing value={pointsProgress} label="Points" icon={Flame} color="primary" />
            <ProgressRing value={photoProgress} label="Audits" icon={Camera} color="accent" />
          </div>
        </motion.div>
      </div>

      {/* AI Insights Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card-elevated ai-shimmer">
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

      {/* Performance Heatmap */}
      <PerformanceHeatmap
        trades={closedTrades}
        selectedDate={selectedHeatmapDate}
        onSelectDate={setSelectedHeatmapDate}
      />

      {/* Discipline Scores Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DisciplineScore label="Today" score={today.discipline} trades={today.total} wins={today.wins} />
        <DisciplineScore label="Last 7 Days" score={week.discipline} trades={week.total} wins={week.wins} />
        <DisciplineScore label="All Time" score={allTime.discipline} trades={allTime.total} wins={allTime.wins} />
      </div>

      {/* Gauge + Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card-elevated flex flex-col items-center justify-center py-6">
          <GaugeChart value={adherence} label="Process Adherence" size={200} />
          <p className="text-xs text-muted-foreground mt-3">
            {adherence >= 80 ? "✓ Operating within process parameters" : adherence >= 50 ? "⚠ Discipline degradation detected" : "✗ Critical: Process breakdown"}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-accent" />
            <span className="stat-label">Mood → Profit Correlation</span>
          </div>
          <div className="space-y-3">
            {moodGroups.map((g) => (
              <div key={g.mood} className="flex items-center gap-3">
                <span className="text-xs w-16 text-muted-foreground">{g.label}</span>
                <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative">
                  {g.trades > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.abs(g.avgR) * 25, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className={`h-full rounded-full ${g.avgR >= 0 ? "bg-primary/50" : "bg-destructive/50"}`}
                    />
                  )}
                </div>
                <span className={`text-xs w-12 text-right ${g.avgR >= 0 ? "text-profit" : "text-loss"}`}>
                  {g.trades > 0 ? `${g.avgR > 0 ? "+" : ""}${g.avgR}R` : "—"}
                </span>
                <span className="text-xs text-muted-foreground w-6">({g.trades})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Rule Break Alerts */}
      {ruleBreaks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card-elevated neon-border-gold">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span className="stat-label text-accent">Recent Rule Violations</span>
          </div>
          <div className="space-y-2">
            {ruleBreaks.map((t) => {
              const tradeTags = tags.filter((tt) => tt.trade_id === t.id);
              return (
                <div key={t.id} className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{t.date}</span>
                  <span className="text-foreground font-semibold">{t.symbol}</span>
                  <span className="text-loss">{t.result_r != null ? `${t.result_r}R` : "—"}</span>
                  <div className="flex gap-1">
                    {tradeTags.map((tag) => (
                      <span key={tag.id} className="tag-chip border-accent/40 text-accent">{tag.tag}</span>
                    ))}
                  </div>
                  <span className="text-muted-foreground flex-1 text-right truncate">{t.intent_notes}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total R", value: closedTrades.reduce((s, t) => s + (t.result_r ?? 0), 0).toFixed(1), icon: TrendingUp, color: "text-primary" },
          { label: "Avg R/Trade", value: (closedTrades.reduce((s, t) => s + (t.result_r ?? 0), 0) / (closedTrades.length || 1)).toFixed(2), icon: TrendingUp, color: "text-primary" },
          { label: "Open Intents", value: trades.filter((t) => t.status === "open").length.toString(), icon: Shield, color: "text-accent" },
          { label: "Rule Breaks", value: trades.filter((t) => !t.followed_rules).length.toString(), icon: AlertTriangle, color: "text-accent" },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card">
            <div className="flex items-center gap-2">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="stat-label">{stat.label}</span>
            </div>
            <p className={`stat-value mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProgressRing({ value, label, icon: Icon, color }: { value: number; label: string; icon: any; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const colorClass = color === "primary" ? "stroke-primary" : "stroke-accent";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} className="stroke-muted fill-none" strokeWidth="5" />
          <motion.circle
            cx="38" cy="38" r={r}
            className={`${colorClass} fill-none progress-ring`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
