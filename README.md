# Welloh: Global Trading Simulator & Talent Identifier

Welloh is an advanced stock market simulation platform designed to train the next generation of financial talent. It offers a comprehensive, risk-free environment to trade on all international markets with a unique and powerful focus on the emerging markets of Africa.

The platform's dual mission is to provide an unparalleled educational tool for aspiring traders and to serve as a talent identification pipeline for financial institutions seeking to recruit top performers.

## Core Features

The application is structured around four main pillars, providing a complete journey from learning the basics to executing complex strategies.

### 1. 📈 Dashboard (Simulation)
The heart of the platform, where users can actively trade and manage their virtual portfolio.
- **Virtual Portfolio**: Start with a $100,000 virtual portfolio to buy and sell stocks.
- **Global Market Access**: Search for and trade stocks from major global exchanges (NYSE, NASDAQ) and key African markets (BRVM, JSE, etc.).
- **AI-Powered Data**: Get realistic (yet simulated) stock data and AI-driven buy/sell recommendations for any ticker.
- **Performance Tracking**: Monitor your portfolio's total value, gains/losses, and allocation.
- **Transaction History**: Keep a detailed log of all your buy and sell orders.

### 2. 🔬 Analyse
A dedicated suite of tools for deep-diving into financial analysis, powered by the Gemini API.
- **In-Depth Company Analysis**: Generate comprehensive reports on any company, including key metrics, financial projections, strengths, and weaknesses.
- **Competitive Comparison**: Directly compare two companies side-by-side across all key financial indicators.
- **Persistent History & Alerts**: Your analysis history is saved locally, and you can set custom alerts on key metrics that trigger notifications.
- **Latest News**: Pulls in recent news articles relevant to the analyzed company.
- **Customizable Charts**: Adjust chart colors, line types, and grid visibility to suit your preferences.

### 3. 💡 Mentor IA
A personalized AI-powered mentor to guide your investment journey.
- **Conversational Strategy Building**: Ask complex questions about investment strategies, market conditions, risk management, or specific sectors.
- **Streaming Responses**: The AI provides detailed, structured advice in a conversational, streaming format.
- **Focus on Africa**: Ideal for exploring the nuances of investing in diverse African markets.

### 4. 📚 Apprendre (Education Hub)
A structured learning center to build financial literacy from the ground up.
- **Curated Learning Paths**: Content is organized for Beginners, Intermediate users, and those wanting a specific Focus on Africa.
- **Practical Topics**: Covers everything from "What is a stock?" to "Understanding the ZLECAF and its impact."

## Technical Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for a utility-first, modern design inspired by Finary.
- **Backend & Auth**: **Supabase** is used for user authentication and database storage (user profiles, portfolios, etc.).
- **AI & Data Generation**: Google Gemini API (`@google/genai`) is used for all financial analysis, data simulation, and AI mentorship.
- **Charting**: `Recharts` for creating responsive and interactive financial charts.
- **State Management**: React's native `useState`, `useCallback`, and `Context` API for managing application state.
- **Client-Side Storage**: `localStorage` is used for non-critical persistence like analysis history and chart settings.

## How to Run

This application is designed to run in a web-based development environment where environment variables can be securely managed.

1.  **Environment Variables**: The application requires API keys for Google Gemini and Supabase. These must be set as environment variables in the execution environment:
    *   `API_KEY`: Your Google Gemini API key.
    *   `SUPABASE_URL`: Your Supabase project URL.
    *   `SUPABASE_ANON_KEY`: Your Supabase project's anonymous key.
2.  **Supabase Setup (IMPORTANT):**
    *   Create a new project in Supabase.
    *   Navigate to the **SQL Editor** in your Supabase dashboard.
    *   Copy the **ENTIRE** SQL script below and paste it into the editor.
    *   Click **Run** to execute the script. This will create all necessary tables, policies, and a trigger to automatically set up new user accounts. This script is safe to run multiple times.

3.  **Installation**: No `npm install` is necessary as all dependencies (`react`, `@google/genai`, `@supabase/supabase-js`, etc.) are loaded via an `importmap` in `index.html` from a CDN.
4.  **Run**: Serve the `index.html` file through a local development server. The application will mount and run.

### Supabase SQL Setup Script

```sql
-- This script is idempotent and can be run multiple times safely.
-- It will create tables if they don't exist and update policies.

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  country text,
  institution text,
  role text default 'user'
);
-- RLS policies for profiles
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. PORTFOLIOS TABLE
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  cash_balance numeric(15, 2) not null default 100000.00,
  initial_capital numeric(15, 2) not null default 100000.00,
  created_at timestamp with time zone default now()
);
-- RLS policies for portfolios
alter table public.portfolios enable row level security;
drop policy if exists "Users can view their own portfolio." on public.portfolios;
create policy "Users can view their own portfolio." on public.portfolios for select using (auth.uid() = user_id);
drop policy if exists "Users can update their own portfolio." on public.portfolios;
create policy "Users can update their own portfolio." on public.portfolios for update using (auth.uid() = user_id);

-- 3. HOLDINGS TABLE
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios on delete cascade not null,
  ticker text not null,
  exchange text not null,
  shares numeric(15, 4) not null check (shares >= 0),
  purchase_price numeric(15, 4) not null,
  unique (portfolio_id, ticker, exchange)
);
-- RLS policies for holdings
alter table public.holdings enable row level security;
drop policy if exists "Users can view their own holdings." on public.holdings;
create policy "Users can view their own holdings." on public.holdings for select using (exists (select 1 from public.portfolios where public.portfolios.id = public.holdings.portfolio_id and public.portfolios.user_id = auth.uid()));
drop policy if exists "Users can insert holdings into their own portfolio." on public.holdings;
create policy "Users can insert holdings into their own portfolio." on public.holdings for insert with check (exists (select 1 from public.portfolios where public.portfolios.id = public.holdings.portfolio_id and public.portfolios.user_id = auth.uid()));
drop policy if exists "Users can update their own holdings." on public.holdings;
create policy "Users can update their own holdings." on public.holdings for update using (exists (select 1 from public.portfolios where public.portfolios.id = public.holdings.portfolio_id and public.portfolios.user_id = auth.uid()));
drop policy if exists "Users can delete their own holdings." on public.holdings;
create policy "Users can delete their own holdings." on public.holdings for delete using (exists (select 1 from public.portfolios where public.portfolios.id = public.holdings.portfolio_id and public.portfolios.user_id = auth.uid()));

-- 4. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios on delete cascade not null,
  ticker text not null,
  exchange text not null,
  type text not null check (type in ('BUY', 'SELL')),
  shares numeric(15, 4) not null,
  price numeric(15, 4) not null,
  timestamp timestamp with time zone default now()
);
-- RLS policies for transactions
alter table public.transactions enable row level security;
drop policy if exists "Users can view their own transactions." on public.transactions;
create policy "Users can view their own transactions." on public.transactions for select using (exists (select 1 from public.portfolios where public.portfolios.id = public.transactions.portfolio_id and public.portfolios.user_id = auth.uid()));
drop policy if exists "Users can insert their own transactions." on public.transactions;
create policy "Users can insert their own transactions." on public.transactions for insert with check (exists (select 1 from public.portfolios where public.portfolios.id = public.transactions.portfolio_id and public.portfolios.user_id = auth.uid()));

-- 5. WATCHLISTS TABLE
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique
);
-- RLS policies for watchlists
alter table public.watchlists enable row level security;
drop policy if exists "Users can manage their own watchlist." on public.watchlists;
create policy "Users can manage their own watchlist." on public.watchlists for all using (auth.uid() = user_id);

-- 6. WATCHLIST ITEMS TABLE
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.watchlists on delete cascade not null,
  ticker text not null,
  exchange text not null,
  unique (watchlist_id, ticker, exchange)
);
-- RLS policies for watchlist_items
alter table public.watchlist_items enable row level security;
drop policy if exists "Users can manage their own watchlist items." on public.watchlist_items;
create policy "Users can manage their own watchlist items." on public.watchlist_items for all using (exists (select 1 from public.watchlists where public.watchlists.id = public.watchlist_items.watchlist_id and public.watchlists.user_id = auth.uid()));

-- 7. DATABASE FUNCTION & TRIGGER
-- This function automatically creates a profile, portfolio, and watchlist for new users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_id uuid;
  portfolio_id uuid;
  watchlist_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, full_name, country, institution)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'institution'
  ) returning id into profile_id;

  -- Create portfolio
  insert into public.portfolios (user_id)
  values (new.id) returning id into portfolio_id;

  -- Create watchlist
  insert into public.watchlists (user_id)
  values (new.id) returning id into watchlist_id;

  return new;
end;
$$;

-- Drop the trigger if it exists, then recreate it to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. ANALYSIS HISTORY TABLE
create table if not exists public.analysis_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now(),
  company_identifier text not null,
  comparison_identifier text,
  currency text,
  analysis_data jsonb not null,
  news_data jsonb
);
-- RLS policies for analysis_histories
alter table public.analysis_histories enable row level security;
drop policy if exists "Users can manage their own analysis history." on public.analysis_histories;
create policy "Users can manage their own analysis history." on public.analysis_histories for all using (auth.uid() = user_id);

-- 9. ANALYSIS ALERTS TABLE
create table if not exists public.analysis_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now(),
  metric_label text not null,
  condition text not null check (condition in ('gt', 'lt')),
  threshold numeric not null
);
-- RLS policies for analysis_alerts
alter table public.analysis_alerts enable row level security;
drop policy if exists "Users can manage their own analysis alerts." on public.analysis_alerts;
create policy "Users can manage their own analysis alerts." on public.analysis_alerts for all using (auth.uid() = user_id);

```

---

*Disclaimer: This application is for demonstration and educational purposes only. It does not provide real financial advice, and all trading data is simulated.*