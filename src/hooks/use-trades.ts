import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export type Trade = {
  id: string;
  user_id: string;
  date: string;
  start_date: string;
  end_date: string;
  trade_number: number;
  symbol: string;
  strategy: string;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  followed_rules: boolean;
  result_r: number | null;
  mood_score: number;
  intent_notes: string | null;
  status: string;
  before_screenshot_url: string | null;
  after_screenshot_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TradeTag = {
  id: string;
  trade_id: string;
  tag: string;
};

export function useTrades() {
  const { user } = useAuth();

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false })
        .order("trade_number", { ascending: true });
      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ["trade_tags", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_tags").select("*");
      if (error) throw error;
      return data as TradeTag[];
    },
    enabled: !!user,
  });

  return { trades, tags, isLoading: tradesLoading || tagsLoading };
}
