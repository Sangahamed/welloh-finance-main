import React from 'react';

export interface Metric {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export interface Projection {
  year: string;
  revenue: number;
  profit: number;
}

export interface AnalysisData {
  companyName: string;
  ticker: string;
  summary: string;
  keyMetrics: Metric[];
  projections: Projection[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Acheter' | 'Conserver' | 'Vendre';
  confidenceScore: number;
}

export interface NewsArticle {
  title: string;
  uri: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  companyIdentifier: string;
  comparisonIdentifier?: string;
  currency: string;
  analysisData: {
    main: AnalysisData;
    comparison: AnalysisData | null;
  };
  news: NewsArticle[];
}

export interface Alert {
  id:string;
  metricLabel: string;
  condition: 'gt' | 'lt';
  threshold: number;
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  percentChange: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface StockHolding {
  ticker: string;
  exchange: string;
  companyName: string;
  shares: number;
  purchasePrice: number;
  currentValue?: number;
}

export interface Portfolio {
  cash: number;
  holdings: StockHolding[];
  initialValue: number;
  winRate?: string;
  avgGainLoss?: string;
  sharpeRatio?: string;
}

export interface StockData {
  companyName: string;
  ticker: string;
  exchange: string;
  price: number;
  change: number;
  percentChange: string;
  volume: string;
  summary: string;
  recommendation: 'Acheter' | 'Conserver' | 'Vendre';
  confidenceScore: number;
  marketCap?: string;
  country?: string;
}

export interface Transaction {
    id: string;
    type: 'buy' | 'sell';
    ticker: string;
    exchange: string;
    companyName: string;
    shares: number;
    price: number;
    timestamp: number;
}

// New type for stock price chart
export interface HistoricalPricePoint {
    date: string; // "YYYY-MM-DD"
    price: number;
}

// New type for Public Tenders
export interface PublicTender {
  id: string;
  title: string;
  country: string;
  sector: string;
  issuingEntity: string;
  summary: string;
  deadline: string;
  uri: string;
}


// Prediction Market types (Phase 2)
export interface PredictionOption {
  id: string;
  label: string;
  probability: number; // 0-100
}

export interface Prediction {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: 'stocks' | 'crypto' | 'macro' | 'africa' | 'other';
  options: PredictionOption[];
  expiresAt: string; // ISO date string
  resolvedOptionId: string | null;
  status: 'pending' | 'active' | 'resolved' | 'expired' | 'rejected';
  totalPool: number; // total tokens bet
  createdAt: string;
  analysisProof: string; // required analysis rationale
  participantsCount: number;
}

export interface Bet {
  id: string;
  predictionId: string;
  userId: string;
  optionId: string;
  amount: number;
  createdAt: string;
}

export interface League {
  name: string;
  minScore: number;
  color: 'cyan' | 'green' | 'violet' | 'magenta' | 'orange' | 'yellow';
  icon: string;
}

// New types for authentication
export interface User {
  id: string;
  email?: string;
  fullName: string;
  role: 'user' | 'admin';
}

export interface WatchlistItem {
  ticker: string;
  exchange: string;
}

// This is the structure stored in the database for a user's profile
export interface UserAccount extends User {
    portfolio: Portfolio;
    transactions: Transaction[];
    watchlist: WatchlistItem[];
    analysisHistory: HistoryItem[];
    alerts: Alert[];
    createdAt?: string; // ISO date string, used for cohort grouping
    isSuspended?: boolean;
    followingCount?: number;
    followersCount?: number;
    isVerified?: boolean;
}


// Admin action types
export type AdminActionType = 'suspend' | 'unsuspend' | 'promote_admin' | 'revoke_admin' | 'reset_portfolio';

// Badge system types
export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'trading' | 'performance' | 'education' | 'prediction' | 'social';
    color: 'cyan' | 'green' | 'violet' | 'magenta' | 'orange' | 'yellow';
    condition: (account: UserAccount) => boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface EarnedBadge {
    id: string;
    earnedAt: number;
}

// Post-trade AI feedback
export interface TradeFeedback {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    strengths: string[];
    improvements: string[];
    advice: string;
}

// Quiz IA
export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

// ─── Phase 2+: Social & Engagement ───────────────────────────────────────────
export interface PredictionComment {
    id: string;
    predictionId: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}

// ─── Phase 5: Moderation & Certification ───────────────────────────────────
export interface Report {
    id: string;
    reporterId: string;
    targetId: string;
    targetType: 'user' | 'comment' | 'prediction';
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
}

export interface Certificate {
    id: string;
    userId: string;
    type: string;
    issuedAt: string;
    metadata: any;
}

export interface AdminLog {
    id: string;
    adminId: string;
    action: string;
    targetId?: string;
    details: any;
    timestamp: string;
}