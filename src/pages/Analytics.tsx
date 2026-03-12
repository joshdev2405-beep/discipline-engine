import { motion } from "framer-motion";
import { mockTrades, mockTradeTags } from "@/lib/mock-data";
import { MOOD_LABELS, AVAILABLE_TAGS } from "@/lib/types";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

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
    return {
      tag, count: trades.length,
      winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
      avgR: trades.length > 0 ? +(totalR / trades.length).toFixed(2) : 0,
    };
  }).filter((t) => t.count > 0);

  const strategies = [...new Set(closedTrades.map((t) => t.strategy))];
  const strategyAnalysis = strategies.map((strat) => {
    const trades = closedTrades.filter((t) => t.strategy === strat);
    const wins = trades.filter((t) => (t.result_r ?? 0) > 0).length;
    const totalR = trades.reduce((s, t) => s + (t.result_r ?? 0), 0);
    return { strategy: strat, count: trades.length, winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0, totalR: +totalR.toFixed(2) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated">
          <span className="stat-label">Mood → Win Rate & Avg R</span>
          <div className="mt-4 space-y-4">
            {moodAnalysis.map((m) => (
              <div key={m.mood} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{m.mood}. {m.label}</span>
                  <div className="flex gap-4 text-xs font-mono">
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-elevated">
          <span className="stat-label">Tag → Win Rate & Avg R</span>
          <div className="mt-4 space-y-4">
            {tagAnalysis.length === 0 && <p className="text-xs font-mono text-muted-foreground">No tag data yet</p>}
            {tagAnalysis.map((t) => (
              <div key={t.tag} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{t.tag}</span>
                  <div className="flex gap-4 text-xs font-mono">
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-elevated lg:col-span-2">
          <span className="stat-label">Strategy Performance</span>
          <div className="mt-4">
            <div className="grid grid-cols-[1fr_60px_60px_80px] gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 px-1">
              <span>Strategy</span><span className="text-right">Trades</span><span className="text-right">Win %</span><span className="text-right">Total R</span>
            </div>
            {strategyAnalysis.map((s) => (
              <div key={s.strategy} className="grid grid-cols-[1fr_60px_60px_80px] gap-2 items-center py-2.5 px-1 border-t border-border/30 text-xs font-mono">
                <span className="text-foreground">{s.strategy}</span>
                <span className="text-right text-muted-foreground">{s.count}</span>
                <span className="text-right text-foreground">{s.winRate}%</span>
                <span className={`text-right font-semibold flex items-center justify-end gap-1 ${s.totalR >= 0 ? "text-profit" : "text-loss"}`}>
                  {s.totalR >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.totalR > 0 ? "+" : ""}{s.totalR}R
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
