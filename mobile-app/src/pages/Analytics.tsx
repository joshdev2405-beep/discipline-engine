import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/lib/types";
import { calculateDisciplineScore } from "@/lib/discipline-score";

export default function Analytics() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [disciplineScore, setDisciplineScore] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchTrades = async () => {
      try {
        const { data } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false });

        const tradeList = data || [];
        setTrades(tradeList);

        const { score } = calculateDisciplineScore(tradeList);
        setDisciplineScore(score);
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  if (loading) {
    return (
      <div className="mobile-screen pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const winRate = trades.length > 0 ? (trades.filter((t) => t.pnl > 0).length / trades.length) * 100 : 0;
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const avgPnL = trades.length > 0 ? totalPnL / trades.length : 0;

  return (
    <div className="mobile-screen pb-20">
      <div className="px-4 pt-4 space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>

        <div className="glass-elevated p-4 space-y-3">
          <div className="space-y-2">
            <p className="stat-label">Discipline Score</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-primary">{disciplineScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mb-1">/5.0</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Measures consistency: recording, rule adherence, journaling, and trade decay
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <p className="stat-label">Win Rate</p>
            <p className="text-2xl font-bold text-profit">{winRate.toFixed(1)}%</p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
              ${totalPnL.toFixed(0)}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Avg P&L</p>
            <p className={`text-2xl font-bold ${avgPnL >= 0 ? "text-profit" : "text-loss"}`}>
              ${avgPnL.toFixed(2)}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Total Trades</p>
            <p className="text-2xl font-bold text-foreground">{trades.length}</p>
          </div>
        </div>

        <div className="glass-card p-3">
          <p className="stat-label mb-2">Recent Trades</p>
          <div className="space-y-2">
            {trades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{trade.symbol}</span>
                <span className={trade.pnl >= 0 ? "text-profit" : "text-loss"}>
                  {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
