import { supabase } from "@/integrations/supabase/client";
import { isWeekend } from "@/lib/settings";

const SYMBOLS = ["AMD", "MSFT", "GOOG", "AMZN", "NVDA", "AAPL", "TSLA", "SPY", "QQQ", "META"];
const STRATEGIES = ["Momentum", "Mean Reversion", "Trend Follow", "Breakout Long", "Pullback Short"];

interface MockDataOptions {
  startDate: Date;
  endDate: Date;
  tradeCount: number;
  winRate: number;
  excludeWeekends: boolean;
}

function getTradingDays(start: Date, end: Date, excludeWeekends: boolean): string[] {
  const days: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    if (!excludeWeekends || !isWeekend(d)) {
      days.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export async function injectMockTrades(
  userId: string,
  options?: MockDataOptions
): Promise<{ inserted: number; error?: string }> {
  // Default: March 2026 if no options
  const startDate = options?.startDate ?? new Date(2026, 2, 11);
  const endDate = options?.endDate ?? new Date(2026, 2, 31);
  const tradeCount = options?.tradeCount ?? 30;
  const winRate = (options?.winRate ?? 80) / 100;
  const excludeWeekends = options?.excludeWeekends ?? true;

  const tradingDays = getTradingDays(startDate, endDate, excludeWeekends);
  if (tradingDays.length === 0) return { inserted: 0, error: "No trading days in range" };

  // Distribute trades across days
  const tradesPerDay: Record<string, number> = {};
  for (const day of tradingDays) tradesPerDay[day] = 0;

  for (let i = 0; i < tradeCount; i++) {
    const day = tradingDays[i % tradingDays.length];
    tradesPerDay[day]++;
  }

  const rows: any[] = [];
  for (const [date, count] of Object.entries(tradesPerDay)) {
    if (count === 0) continue;
    for (let t = 1; t <= count; t++) {
      const isWin = Math.random() < winRate;
      const resultR = isWin
        ? +(Math.random() * 3 + 0.5).toFixed(1)
        : +(-Math.random() * 2 - 0.3).toFixed(1);
      rows.push({
        user_id: userId,
        date,
        start_date: date,
        end_date: date,
        trade_number: t,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        strategy: STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)],
        followed_rules: Math.random() > 0.1,
        result_r: resultR,
        mood_score: Math.floor(Math.random() * 3) + 3, // 3-5
        intent_notes: `Mock trade generated for ${date}`,
        status: "closed",
      });
    }
  }

  const { error } = await supabase.from("trades").insert(rows as any);
  if (error) return { inserted: 0, error: error.message };
  return { inserted: rows.length };
}
