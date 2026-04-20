import { Trade } from "./types";

const DECAY_MULTIPLIERS = [1.0, 0.8, 0.5, 0.3, 0.2];

export function calculateTradeScore(
  trade: Trade,
  index: number
): { score: number; breakdown: Record<string, number> } {
  let points = 0;
  const breakdown: Record<string, number> = {};

  points += 1;
  breakdown["recording"] = 1;

  if (trade.followed_rules) {
    points += 2;
    breakdown["rules"] = 2;
  }

  if (trade.intent_notes && trade.intent_notes.trim().length > 0) {
    points += 1;
    breakdown["journaling"] = 1;
  }

  const decayIndex = Math.min(index, DECAY_MULTIPLIERS.length - 1);
  const multiplier = DECAY_MULTIPLIERS[decayIndex];

  const maxPoints = 4;
  const finalScore = Math.round(((points * multiplier) / maxPoints) * 5 * 10) / 10;

  return { score: Math.min(finalScore, 5), breakdown };
}

export function calculateDisciplineScore(trades: Trade[]): {
  score: number;
  breakdown: Array<{ tradeIndex: number; score: number }>;
} {
  if (trades.length === 0) {
    return { score: 0, breakdown: [] };
  }

  const scores = trades.map((trade, index) => ({
    tradeIndex: index + 1,
    score: calculateTradeScore(trade, index).score,
  }));

  const avgScore = scores.reduce((sum, item) => sum + item.score, 0) / scores.length;

  return {
    score: Math.round(avgScore * 10) / 10,
    breakdown: scores,
  };
}

export function getTradingDaysInMonth(excludeWeekends: boolean): number {
  if (!excludeWeekends) return 30;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let tradingDays = 0;
  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      tradingDays++;
    }
  }

  return tradingDays;
}
