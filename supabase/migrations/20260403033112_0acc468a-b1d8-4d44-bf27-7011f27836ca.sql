
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS end_date date NOT NULL DEFAULT CURRENT_DATE;

-- Backfill existing trades: copy date into both start_date and end_date
UPDATE public.trades SET start_date = date, end_date = date WHERE start_date = CURRENT_DATE OR end_date = CURRENT_DATE;
