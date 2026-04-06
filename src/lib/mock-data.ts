import { supabase } from "@/integrations/supabase/client";

export const MARCH_2026_MOCK_TRADES = [
  { date:"2026-03-11",start_date:"2026-03-11",end_date:"2026-03-11",trade_number:1,symbol:"AMD",strategy:"Momentum",followed_rules:true,result_r:1.4,mood_score:4,intent_notes:"Mock trade AMD Momentum",status:"closed" },
  { date:"2026-03-11",start_date:"2026-03-11",end_date:"2026-03-11",trade_number:2,symbol:"MSFT",strategy:"Mean Reversion",followed_rules:true,result_r:2.3,mood_score:5,intent_notes:"Mock trade MSFT Mean Reversion",status:"closed" },
  { date:"2026-03-12",start_date:"2026-03-12",end_date:"2026-03-12",trade_number:1,symbol:"GOOG",strategy:"Trend Follow",followed_rules:true,result_r:1.2,mood_score:5,intent_notes:"Mock trade GOOG Trend Follow",status:"closed" },
  { date:"2026-03-12",start_date:"2026-03-12",end_date:"2026-03-12",trade_number:2,symbol:"AMZN",strategy:"Breakout Long",followed_rules:true,result_r:0.7,mood_score:4,intent_notes:"Mock trade AMZN Breakout Long",status:"closed" },
  { date:"2026-03-13",start_date:"2026-03-13",end_date:"2026-03-13",trade_number:1,symbol:"AMZN",strategy:"Mean Reversion",followed_rules:true,result_r:-0.5,mood_score:3,intent_notes:"Mock trade AMZN Mean Reversion",status:"closed" },
  { date:"2026-03-13",start_date:"2026-03-13",end_date:"2026-03-13",trade_number:2,symbol:"GOOG",strategy:"Pullback Short",followed_rules:true,result_r:1.4,mood_score:4,intent_notes:"Mock trade GOOG Pullback Short",status:"closed" },
  { date:"2026-03-16",start_date:"2026-03-16",end_date:"2026-03-16",trade_number:1,symbol:"MSFT",strategy:"Trend Follow",followed_rules:true,result_r:-0.8,mood_score:3,intent_notes:"Mock trade MSFT Trend Follow",status:"closed" },
  { date:"2026-03-16",start_date:"2026-03-16",end_date:"2026-03-16",trade_number:2,symbol:"TSLA",strategy:"Mean Reversion",followed_rules:true,result_r:1.8,mood_score:4,intent_notes:"Mock trade TSLA Mean Reversion",status:"closed" },
  { date:"2026-03-17",start_date:"2026-03-17",end_date:"2026-03-17",trade_number:1,symbol:"NVDA",strategy:"Momentum",followed_rules:true,result_r:3.0,mood_score:5,intent_notes:"Mock trade NVDA Momentum",status:"closed" },
  { date:"2026-03-17",start_date:"2026-03-17",end_date:"2026-03-17",trade_number:2,symbol:"AAPL",strategy:"Momentum",followed_rules:true,result_r:2.4,mood_score:4,intent_notes:"Mock trade AAPL Momentum",status:"closed" },
  { date:"2026-03-18",start_date:"2026-03-18",end_date:"2026-03-18",trade_number:1,symbol:"GOOG",strategy:"Pullback Short",followed_rules:true,result_r:0.7,mood_score:5,intent_notes:"Mock trade GOOG Pullback Short",status:"closed" },
  { date:"2026-03-18",start_date:"2026-03-18",end_date:"2026-03-18",trade_number:2,symbol:"SPY",strategy:"Pullback Short",followed_rules:true,result_r:-1.3,mood_score:3,intent_notes:"Mock trade SPY Pullback Short",status:"closed" },
  { date:"2026-03-19",start_date:"2026-03-19",end_date:"2026-03-19",trade_number:1,symbol:"QQQ",strategy:"Momentum",followed_rules:true,result_r:1.1,mood_score:5,intent_notes:"Mock trade QQQ Momentum",status:"closed" },
  { date:"2026-03-20",start_date:"2026-03-20",end_date:"2026-03-20",trade_number:1,symbol:"META",strategy:"Momentum",followed_rules:true,result_r:1.6,mood_score:5,intent_notes:"Mock trade META Momentum",status:"closed" },
  { date:"2026-03-23",start_date:"2026-03-23",end_date:"2026-03-23",trade_number:1,symbol:"SPY",strategy:"Breakout Long",followed_rules:true,result_r:3.0,mood_score:5,intent_notes:"Mock trade SPY Breakout Long",status:"closed" },
  { date:"2026-03-23",start_date:"2026-03-23",end_date:"2026-03-23",trade_number:2,symbol:"TSLA",strategy:"Mean Reversion",followed_rules:true,result_r:2.7,mood_score:4,intent_notes:"Mock trade TSLA Mean Reversion",status:"closed" },
  { date:"2026-03-23",start_date:"2026-03-23",end_date:"2026-03-23",trade_number:3,symbol:"SPY",strategy:"Trend Follow",followed_rules:true,result_r:1.5,mood_score:5,intent_notes:"Mock trade SPY Trend Follow",status:"closed" },
  { date:"2026-03-24",start_date:"2026-03-24",end_date:"2026-03-24",trade_number:1,symbol:"MSFT",strategy:"Trend Follow",followed_rules:true,result_r:-1.1,mood_score:2,intent_notes:"Mock trade MSFT Trend Follow",status:"closed" },
  { date:"2026-03-24",start_date:"2026-03-24",end_date:"2026-03-24",trade_number:2,symbol:"MSFT",strategy:"Momentum",followed_rules:true,result_r:2.4,mood_score:4,intent_notes:"Mock trade MSFT Momentum",status:"closed" },
  { date:"2026-03-25",start_date:"2026-03-25",end_date:"2026-03-25",trade_number:1,symbol:"QQQ",strategy:"Pullback Short",followed_rules:true,result_r:1.6,mood_score:4,intent_notes:"Mock trade QQQ Pullback Short",status:"closed" },
  { date:"2026-03-25",start_date:"2026-03-25",end_date:"2026-03-25",trade_number:2,symbol:"AMZN",strategy:"Trend Follow",followed_rules:true,result_r:-1.8,mood_score:3,intent_notes:"Mock trade AMZN Trend Follow",status:"closed" },
  { date:"2026-03-26",start_date:"2026-03-26",end_date:"2026-03-26",trade_number:1,symbol:"QQQ",strategy:"Trend Follow",followed_rules:false,result_r:0.9,mood_score:4,intent_notes:"Mock trade QQQ Trend Follow",status:"closed" },
  { date:"2026-03-26",start_date:"2026-03-26",end_date:"2026-03-26",trade_number:2,symbol:"AAPL",strategy:"Breakout Long",followed_rules:false,result_r:-1.0,mood_score:3,intent_notes:"Mock trade AAPL Breakout Long",status:"closed" },
  { date:"2026-03-27",start_date:"2026-03-27",end_date:"2026-03-27",trade_number:1,symbol:"NVDA",strategy:"Breakout Long",followed_rules:true,result_r:2.7,mood_score:4,intent_notes:"Mock trade NVDA Breakout Long",status:"closed" },
  { date:"2026-03-27",start_date:"2026-03-27",end_date:"2026-03-27",trade_number:2,symbol:"MSFT",strategy:"Mean Reversion",followed_rules:true,result_r:1.9,mood_score:3,intent_notes:"Mock trade MSFT Mean Reversion",status:"closed" },
  { date:"2026-03-30",start_date:"2026-03-30",end_date:"2026-03-30",trade_number:1,symbol:"TSLA",strategy:"Pullback Short",followed_rules:true,result_r:2.9,mood_score:5,intent_notes:"Mock trade TSLA Pullback Short",status:"closed" },
  { date:"2026-03-30",start_date:"2026-03-30",end_date:"2026-03-30",trade_number:2,symbol:"AMZN",strategy:"Trend Follow",followed_rules:true,result_r:2.9,mood_score:4,intent_notes:"Mock trade AMZN Trend Follow",status:"closed" },
  { date:"2026-03-30",start_date:"2026-03-30",end_date:"2026-03-30",trade_number:3,symbol:"QQQ",strategy:"Pullback Short",followed_rules:true,result_r:1.6,mood_score:4,intent_notes:"Mock trade QQQ Pullback Short",status:"closed" },
  { date:"2026-03-31",start_date:"2026-03-31",end_date:"2026-03-31",trade_number:1,symbol:"SPY",strategy:"Trend Follow",followed_rules:true,result_r:1.5,mood_score:4,intent_notes:"Mock trade SPY Trend Follow",status:"closed" },
  { date:"2026-03-31",start_date:"2026-03-31",end_date:"2026-03-31",trade_number:2,symbol:"GOOG",strategy:"Breakout Long",followed_rules:true,result_r:1.1,mood_score:3,intent_notes:"Mock trade GOOG Breakout Long",status:"closed" },
];

export async function injectMockTrades(userId: string): Promise<{ inserted: number; error?: string }> {
  const rows = MARCH_2026_MOCK_TRADES.map((t) => ({
    user_id: userId,
    ...t,
  }));

  const { error } = await supabase.from("trades").insert(rows as any);
  if (error) return { inserted: 0, error: error.message };
  return { inserted: rows.length };
}
