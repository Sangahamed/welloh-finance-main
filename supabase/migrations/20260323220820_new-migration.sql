-- ==========================================
-- WELLOH FINANCE - COMPLETE DATABASE SETUP
-- ==========================================
-- This script creates all tables, policies, and triggers 
-- required for the Welloh trading platform.
-- Run this in the Supabase SQL Editor.

-- 1. PROFILES TABLE
-- Stores user account info and settings.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_suspended BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  following_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. PORTFOLIOS TABLE
-- Each user has one portfolio with cash balance.
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
  initial_capital NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own portfolio." ON public.portfolios;
CREATE POLICY "Users can view their own portfolio." ON public.portfolios FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own portfolio." ON public.portfolios;
CREATE POLICY "Users can update their own portfolio." ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);

-- 3. HOLDINGS TABLE
-- Tracks specific stocks owned by a user.
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  exchange TEXT NOT NULL,
  shares NUMERIC(15, 4) NOT NULL CHECK (shares >= 0),
  purchase_price NUMERIC(15, 4) NOT NULL,
  UNIQUE (portfolio_id, ticker, exchange)
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own holdings." ON public.holdings;
CREATE POLICY "Users manage own holdings." ON public.holdings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE public.portfolios.id = public.holdings.portfolio_id AND public.portfolios.user_id = auth.uid())
);

-- 4. TRANSACTIONS TABLE
-- Logs all buy/sell actions.
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  exchange TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  shares NUMERIC(15, 4) NOT NULL,
  price NUMERIC(15, 4) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view/add own transactions." ON public.transactions;
CREATE POLICY "Users view/add own transactions." ON public.transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE public.portfolios.id = public.transactions.portfolio_id AND public.portfolios.user_id = auth.uid())
);

-- 5. FOLLOWING TABLE
-- Social graph for user follows.
CREATE TABLE IF NOT EXISTS public.following (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_following CHECK (follower_id <> following_id)
);

ALTER TABLE public.following ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own follows." ON public.following;
CREATE POLICY "Users manage own follows." ON public.following FOR ALL USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Follows are viewable by everyone." ON public.following;
CREATE POLICY "Follows are viewable by everyone." ON public.following FOR SELECT USING (true);

-- 6. ACTIVITIES TABLE
-- Real-time feed of platform events.
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('trade', 'prediction', 'achievement', 'join')),
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are viewable by everyone." ON public.activities;
CREATE POLICY "Activities are viewable by everyone." ON public.activities FOR SELECT USING (true);

-- 7. PREDICTIONS TABLE
-- Prediction markets (stocks, crypto, macro).
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id),
  creator_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('stocks', 'crypto', 'macro', 'africa', 'other')),
  options JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'resolved', 'expired', 'rejected')),
  total_pool NUMERIC DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  resolved_option_id TEXT,
  analysis_proof TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Predictions are viewable by everyone." ON public.predictions;
CREATE POLICY "Predictions are viewable by everyone." ON public.predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create predictions." ON public.predictions;
CREATE POLICY "Users can create predictions." ON public.predictions FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 8. PREDICTION COMMENTS
CREATE TABLE IF NOT EXISTS public.prediction_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.prediction_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone." ON public.prediction_comments;
CREATE POLICY "Comments viewable by everyone." ON public.prediction_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can comment on predictions." ON public.prediction_comments;
CREATE POLICY "Users can comment on predictions." ON public.prediction_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. REPORTS TABLE
-- Moderation system.
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'comment', 'prediction')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Only admins can see reports
DROP POLICY IF EXISTS "Admins can view reports." ON public.reports;
CREATE POLICY "Admins can view reports." ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Users can submit reports." ON public.reports;
CREATE POLICY "Users can submit reports." ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 10. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates are public." ON public.certificates FOR SELECT USING (true);

-- 11. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins view logs." ON public.admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin')
);

-- 12. AUTOMATION: HANDLE NEW USER SIGNUP
-- Automatically creates profile and portfolio when a user signs up via Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur Welloh'),
    'user'
  );

  -- Create portfolio
  INSERT INTO public.portfolios (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. ENABLE REALTIME
-- Add tables to the supabase_realtime publication to enable subscriptions.
ALTER TABLE public.activities REPLICA IDENTITY FULL;
-- Note: You may need to run 'ALTER PUBLICATION supabase_realtime ADD TABLE ...' 
-- if things don't auto-enable in the dashboard.
