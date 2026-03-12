export interface Trade {
  id: string;
  user_id: string;
  date: string;
  trade_number: 1 | 2 | 3;
  symbol: string;
  strategy: string;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  followed_rules: boolean;
  result_r: number | null;
  mood_score: 1 | 2 | 3 | 4 | 5;
  intent_notes: string;
  status: "open" | "closed";
  before_screenshot_url: string | null;
  after_screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeTag {
  id: string;
  trade_id: string;
  tag: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  date: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  created_at: string;
}

export const MOOD_LABELS: Record<number, string> = {
  1: "Anxious",
  2: "Uneasy",
  3: "Neutral",
  4: "Focused",
  5: "Calm",
};

export const AVAILABLE_TAGS = [
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
] as const;
