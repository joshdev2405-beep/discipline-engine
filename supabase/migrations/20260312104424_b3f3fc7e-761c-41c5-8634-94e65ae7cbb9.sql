-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  trade_number SMALLINT NOT NULL CHECK (trade_number BETWEEN 1 AND 3),
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT '',
  entry_price NUMERIC,
  stop_price NUMERIC,
  target_price NUMERIC,
  followed_rules BOOLEAN NOT NULL DEFAULT true,
  result_r NUMERIC,
  mood_score SMALLINT NOT NULL DEFAULT 3 CHECK (mood_score BETWEEN 1 AND 5),
  intent_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  before_screenshot_url TEXT,
  after_screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trade tags table
CREATE TABLE public.trade_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE (trade_id, tag)
);

ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags of own trades" ON public.trade_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trades WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()));
CREATE POLICY "Users can insert tags on own trades" ON public.trade_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.trades WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()));
CREATE POLICY "Users can delete tags on own trades" ON public.trade_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.trades WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()));

-- Mood logs table
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs" ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood logs" ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood logs" ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trades_user_date ON public.trades (user_id, date DESC);
CREATE INDEX idx_trades_status ON public.trades (status);
CREATE INDEX idx_trade_tags_trade_id ON public.trade_tags (trade_id);
CREATE INDEX idx_mood_logs_user_date ON public.mood_logs (user_id, date DESC);