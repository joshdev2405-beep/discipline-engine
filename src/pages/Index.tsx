import { motion } from "framer-motion";
import DisciplineScore from "@/components/DisciplineScore";
import GaugeChart from "@/components/GaugeChart";
import { mockTrades, mockTradeTags } from "@/lib/mock-data";
import { MOOD_LABELS } from "@/lib/types";
import { AlertTriangle, TrendingUp, Brain, Shield } from "lucide-react";

function computeStats(trades: typeof mockTrades, days?: number) {
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
  const today = computeStats(mockTrades, 1);
  const week = computeStats(mockTrades, 7);
  const allTime = computeStats(mockTrades);

  const closedTrades = mockTrades.filter((t) => t.status === "closed");
  const adherence = allTime.discipline;

  // Mood-to-profit placeholder data
  const moodGroups = [1, 2, 3, 4, 5].map((mood) => {
    const trades = closedTrades.filter((t) => t.mood_score === mood);
    const avgR = trades.length > 0
      ? trades.reduce((s, t) => s + (t.result_r ?? 0), 0) / trades.length
      : 0;
    return { mood, label: MOOD_LABELS[mood], trades: trades.length, avgR: +avgR.toFixed(2) };
  });

  // Recent rule breaks
  const ruleBreaks = mockTrades
    .filter((t) => !t.followed_rules && t.status === "closed")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Discipline Command Center</h1>
          <p className="text-xs font-mono text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </motion.div>

      {/* Discipline Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DisciplineScore label="Today" score={today.discipline} trades={today.total} wins={today.wins} />
        <DisciplineScore label="Last 7 Days" score={week.discipline} trades={week.total} wins={week.wins} />
        <DisciplineScore label="All Time" score={allTime.discipline} trades={allTime.total} wins={allTime.wins} />
      </div>

      {/* Gauge + Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Process Adherence Gauge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="terminal-card flex flex-col items-center justify-center py-6"
        >
          <GaugeChart value={adherence} label="Process Adherence" size={200} />
          <p className="text-xs font-mono text-muted-foreground mt-3">
            {adherence >= 80
              ? "✓ Operating within process parameters"
              : adherence >= 50
              ? "⚠ Discipline degradation detected"
              : "✗ Critical: Process breakdown"}
          </p>
        </motion.div>

        {/* Mood-to-Profit Correlation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="terminal-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-accent" />
            <span className="stat-label">Mood → Profit Correlation</span>
          </div>
          <div className="space-y-3">
            {moodGroups.map((g) => (
              <div key={g.mood} className="flex items-center gap-3">
                <span className="text-xs font-mono w-16 text-muted-foreground">{g.label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                  {g.trades > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.abs(g.avgR) * 25, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className={`h-full rounded ${g.avgR >= 0 ? "bg-primary/60" : "bg-destructive/60"}`}
                    />
                  )}
                </div>
                <span className={`text-xs font-mono w-12 text-right ${g.avgR >= 0 ? "text-profit" : "text-loss"}`}>
                  {g.trades > 0 ? `${g.avgR > 0 ? "+" : ""}${g.avgR}R` : "—"}
                </span>
                <span className="text-xs font-mono text-muted-foreground w-6">({g.trades})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Rule Break Alerts */}
      {ruleBreaks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="terminal-card border-accent/30 glow-gold"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span className="stat-label text-accent">Recent Rule Violations</span>
          </div>
          <div className="space-y-2">
            {ruleBreaks.map((t) => {
              const tags = mockTradeTags.filter((tt) => tt.trade_id === t.id);
              return (
                <div key={t.id} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-muted-foreground">{t.date}</span>
                  <span className="text-foreground font-semibold">{t.symbol}</span>
                  <span className="text-loss">{t.result_r != null ? `${t.result_r}R` : "—"}</span>
                  <div className="flex gap-1">
                    {tags.map((tag) => (
                      <span key={tag.id} className="tag-chip border-accent/40 text-accent">
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-muted-foreground flex-1 text-right truncate">{t.intent_notes}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total R", value: closedTrades.reduce((s, t) => s + (t.result_r ?? 0), 0).toFixed(1), icon: TrendingUp, positive: true },
          { label: "Avg R/Trade", value: (closedTrades.reduce((s, t) => s + (t.result_r ?? 0), 0) / (closedTrades.length || 1)).toFixed(2), icon: TrendingUp, positive: true },
          { label: "Open Intents", value: mockTrades.filter((t) => t.status === "open").length.toString(), icon: Shield, positive: false },
          { label: "Rule Breaks", value: mockTrades.filter((t) => !t.followed_rules).length.toString(), icon: AlertTriangle, positive: false },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="terminal-card"
          >
            <div className="flex items-center gap-2">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="stat-label">{stat.label}</span>
            </div>
            <p className={`stat-value mt-1 ${stat.positive ? "text-primary" : "text-accent"}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
