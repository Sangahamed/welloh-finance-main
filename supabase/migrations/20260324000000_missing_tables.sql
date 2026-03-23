-- MISSING TABLES FOR WELLOH PLATFORM

-- 1. WATCHLISTS SYSTEM
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  exchange TEXT NOT NULL,
  UNIQUE (watchlist_id, ticker, exchange)
);

-- 2. ANALYSIS HISTORY SYSTEM
CREATE TABLE IF NOT EXISTS public.analysis_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_identifier TEXT NOT NULL,
  comparison_identifier TEXT,
  currency TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  news_data JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. ALERTS SYSTEM
CREATE TABLE IF NOT EXISTS public.analysis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_label TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('gt', 'lt')),
  threshold NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. BETS SYSTEM
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  option_id TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. RPC FUNCTION: INCREMENT PREDICTION POOL
CREATE OR REPLACE FUNCTION public.increment_prediction_pool(p_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.predictions
  SET total_pool = total_pool + p_amount,
      participants_count = participants_count + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. UPDATE AUTO-SETUP TRIGGER: ADD WATCHLIST CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur Welloh'),
    'user'
  ) RETURNING id INTO profile_id;

  -- Create portfolio
  INSERT INTO public.portfolios (user_id)
  VALUES (NEW.id);

  -- Create watchlist
  INSERT INTO public.watchlists (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- RLS FOR NEW TABLES
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watchlists." ON public.watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own watchlist items." ON public.watchlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.watchlists WHERE public.watchlists.id = public.watchlist_items.watchlist_id AND public.watchlists.user_id = auth.uid())
);
CREATE POLICY "Users manage own analysis histories." ON public.analysis_histories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own alerts." ON public.analysis_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bets." ON public.bets FOR ALL USING (auth.uid() = user_id);
