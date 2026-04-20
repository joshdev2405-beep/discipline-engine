export interface Trade {
  id: string;
  user_id: string;
  entry_price: number;
  exit_price: number;
  entry_date: string;
  exit_date: string;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  trade_type: "long" | "short";
  symbol: string;
  intent_notes: string | null;
  followed_rules: boolean;
  screenshots: string[];
  tags: string[];
  mood_before: number | null;
  mood_after: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  created_at: string;
  updated_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  xp_amount: number;
  reason: string;
  multiplier: number;
  created_at: string;
}

export interface DailyLogin {
  id: string;
  user_id: string;
  login_date: string;
  created_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: number;
  notes: string | null;
  log_date: string;
  created_at: string;
}

export interface TradeTag {
  id: string;
  name: string;
  color: string;
}

export const MOOD_LABELS: Record<number, string> = {
  1: "Anxious",
  2: "Uneasy",
  3: "Neutral",
  4: "Focused",
  5: "Calm",
};

export const TRADE_TAGS = [
  "Rule-Based",
  "FOMO",
  "Late Entry",
  "Revenge Trade",
  "Oversize",
  "A+ Setup",
  "News Driven",
  "Breakout",
  "Pullback",
  "Scalp",
];

export const RANK_TIERS = [
  { threshold: 0, name: "Novice Operator", emoji: "🌱" },
  { threshold: 1000, name: "Advanced Tech", emoji: "📈" },
  { threshold: 5000, name: "Elite Executor", emoji: "⚡" },
  { threshold: 15000, name: "Master Operative", emoji: "🎯" },
  { threshold: 50000, name: "Legendary Architect", emoji: "👑" },
];
