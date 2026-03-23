# Welloh: Global Trading Simulator

## Overview
A React + TypeScript + Vite single-page application for stock market simulation with a focus on African and global markets. Users can practice trading with real-like conditions (fees, slippage, advanced orders), analyze markets via AI, get post-trade feedback, compete on a leaderboard with leagues, earn badges, and participate in prediction markets.

## Architecture
- **Frontend**: React 18 + TypeScript, built with Vite
- **Auth & Database**: Supabase (authentication, user accounts, trade history, predictions, bets)
- **AI**: Google Gemini API (market analysis, strategy, education, post-trade feedback, prediction ideas)
- **Charts**: Recharts for financial data visualization
- **Styling**: Tailwind CSS (loaded via CDN in index.html)

## Project Structure
```
/
├── App.tsx                    # Root component with hash-based routing
├── index.tsx                  # Entry point
├── index.html                 # HTML shell (includes Tailwind CDN)
├── vite.config.ts             # Vite config (port 5000, host 0.0.0.0)
├── types.ts                   # Shared TypeScript types (incl. BadgeDefinition, TradeFeedback)
├── WELLOH_TASKS.md            # Project task tracker (done / to-do / suggestions)
├── components/
│   ├── icons/Icons.tsx        # Custom SVG icon components
│   ├── ui/                    # Reusable UI primitives (NeonCard, NeonBadge, NeonButton, etc.)
│   ├── LandingView.tsx        # Public landing page
│   ├── LoginView.tsx          # Login form
│   ├── SignUpView.tsx         # Registration form
│   ├── DashboardView.tsx      # Main simulation dashboard (CSV export)
│   ├── StockChartView.tsx     # Stock chart + 4 order types + fees/slippage + AI feedback modal
│   ├── BadgesView.tsx         # Badges & achievements system (15 badges, 4 rarity tiers)
│   ├── AnalysisView.tsx       # Market analysis (Gemini)
│   ├── ComparisonView.tsx     # Side-by-side company comparison
│   ├── StrategyView.tsx       # Mentor IA - trading strategies (Gemini streaming)
│   ├── EducationView.tsx      # Educational content (Gemini streaming)
│   ├── PredictionsView.tsx    # Prediction markets - create/browse/bet
│   ├── LeaderboardView.tsx    # Rankings with 6-tier league system + composite score
│   ├── AdminDashboardView.tsx # Admin dashboard with KPIs, search, league breakdown, top 5, CSV export
│   ├── PublicTendersView.tsx  # Business opportunities (Gemini)
│   └── ProfileView.tsx        # User profile
├── contexts/
│   └── AuthContext.tsx        # Authentication state and methods
├── lib/
│   ├── supabaseClient.ts      # Supabase client (reads from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
│   └── database.ts            # Database helpers (predictions, bets, analysis history, alerts)
└── services/
    └── geminiService.ts       # Gemini AI service (analysis, stock data, post-trade feedback, etc.)
```

## Routing
Hash-based routing (`window.location.hash`). Pages:
`landing` | `login` | `signup` | `simulation` | `analysis` | `strategy` | `education` | `predictions` | `badges` | `tenders` | `leaderboard` | `admin` | `profile/:id`

## Phase 2 Features (Implemented)
- **4 Order Types**: Market (with slippage), Limit, Stop-Loss, Take-Profit
- **Fees & Slippage**: 0.1% commission + 0.05% slippage on market orders
- **AI Post-Trade Feedback**: Gemini analyzes each trade and returns a grade (A–F) + advice
- **Badges System** (`#badges`): 15 badges across 4 rarity tiers (Common/Rare/Epic/Legendary)
- **Prediction Markets** (`#predictions`): AI-generated ideas, creation, betting
- **League System**: Bronze → Silver → Gold → Sapphire → Diamond → Legend (composite score)
- **CSV Export**: Transactions (Dashboard) + Users (Admin)
- **Admin Dashboard**: KPI cards, league breakdown chart, top-5 traders, user search + sort

## Environment Variables
- `GEMINI_API_KEY` — Replit Secret. Used for all AI features.
- `VITE_SUPABASE_URL` — Replit env var (shared). Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — Replit env var (shared). Supabase anonymous key.

## Development
- Run: `npm run dev` (starts Vite on port 5000)
- Build: `npm run build`

## Deployment
- Configured as a static site deployment
- Build command: `npm run build`
- Output directory: `dist`
