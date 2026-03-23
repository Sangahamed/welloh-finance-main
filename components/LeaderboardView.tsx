import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/geminiService';
import type { UserAccount } from '../types';
import { TrophyIcon, StarIcon, ChartBarIcon, SparklesIcon, FireIcon, BoltIcon, RocketLaunchIcon } from './icons/Icons';
import AnimatedBackground from './ui/AnimatedBackground';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import CountUp from './ui/CountUp';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

// Phase 2: Proper league system (Bronze → Silver → Gold → Sapphire → Diamond → Legend)
const LEAGUES = [
    { name: 'Bronze',   minScore: -Infinity, maxScore: 10,      badgeVariant: 'bronze' as const,  glow: '#FB923C', icon: StarIcon,           emoji: '🥉' },
    { name: 'Silver',   minScore: 10,        maxScore: 25,      badgeVariant: 'silver' as const,  glow: '#94A3B8', icon: ChartBarIcon,       emoji: '🥈' },
    { name: 'Gold',     minScore: 25,        maxScore: 50,      badgeVariant: 'gold' as const,    glow: '#FACC15', icon: TrophyIcon,         emoji: '🥇' },
    { name: 'Sapphire', minScore: 50,        maxScore: 100,     badgeVariant: 'violet' as const,  glow: '#8B5CF6', icon: SparklesIcon,       emoji: '💎' },
    { name: 'Diamond',  minScore: 100,       maxScore: 200,     badgeVariant: 'magenta' as const, glow: '#E879F9', icon: BoltIcon,           emoji: '⚡' },
    { name: 'Legend',   minScore: 200,       maxScore: Infinity, badgeVariant: 'orange' as const, glow: '#F97316', icon: RocketLaunchIcon,   emoji: '🚀' },
];

// Composite score: PnL return % (weighted 50%) + Sharpe proxy (30%) + winRate (20%)
function computeCompositeScore(returnPct: number, winRate: number, sharpe: number): number {
    const pnlScore = Math.max(-20, Math.min(100, returnPct));
    const sharpeScore = Math.max(0, Math.min(50, sharpe * 20));
    const winScore = Math.max(0, Math.min(30, winRate * 30));
    return pnlScore * 0.5 + sharpeScore * 0.3 + winScore * 0.2;
}

function getLeague(score: number) {
    return [...LEAGUES].reverse().find(l => score >= l.minScore) ?? LEAGUES[0];
}

// Keep old level system for backward compat
const levels = [
    { name: 'Novice', threshold: 0, color: 'cyan' as const, icon: StarIcon },
    { name: 'Apprenti', threshold: 110000, color: 'green' as const, icon: ChartBarIcon },
    { name: 'Trader', threshold: 150000, color: 'violet' as const, icon: SparklesIcon },
    { name: 'Investisseur', threshold: 250000, color: 'magenta' as const, icon: FireIcon },
    { name: 'Maestro', threshold: 500000, color: 'orange' as const, icon: TrophyIcon },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

interface LeaderboardViewProps {
    onNavigate: (page: string) => void;
}

type RankedUser = UserAccount & {
    portfolioValue: number;
    returnPercentage: number;
    compositeScore: number;
    league: typeof LEAGUES[number];
    winRate: number;
    level: { name: string; color: 'cyan' | 'green' | 'violet' | 'magenta' | 'orange'; icon: React.FC<any> };
    rank: number;
    cohortKey: string; // e.g. "2026-Q1"
};

// Helper to get cohort key from date string
function getCohortKey(dateStr?: string): string {
    if (!dateStr) return 'Inconnu';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
}

function formatCohortLabel(key: string): string {
    if (key === 'all') return 'Tous les traders';
    if (key === 'Inconnu') return 'Cohorte inconnue';
    const [year, q] = key.split('-');
    const labels: Record<string, string> = { Q1: 'Janv–Mars', Q2: 'Avr–Juin', Q3: 'Juil–Sept', Q4: 'Oct–Déc' };
    return `Cohorte ${labels[q] ?? q} ${year}`;
}

// Podium Component for Top 3
const Podium: React.FC<{ users: RankedUser[]; onNavigate: (page: string) => void }> = ({ users, onNavigate }) => {
    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
    const heights = ['h-32', 'h-44', 'h-24'];
    const delays = ['delay-300', 'delay-100', 'delay-500'];
    const glowColors = [
        'from-gray-400 to-gray-300', // Silver
        'from-yellow-400 to-amber-300', // Gold
        'from-orange-400 to-yellow-600', // Bronze
    ];

    return (
        <div className="flex items-end justify-center gap-4 mb-12 pt-8">
            {podiumOrder.map((orderIndex, visualIndex) => {
                const user = users[orderIndex];
                if (!user) return null;
                
                return (
                    <div 
                        key={user.id}
                        className={`flex flex-col items-center animate-slide-up ${delays[visualIndex]}`}
                        style={{ animationDelay: `${visualIndex * 150}ms` }}
                    >
                        {/* Avatar and Info */}
                        <div className="relative mb-4 group">
                            {/* Glow Ring for 1st place */}
                            {user.rank === 1 && (
                                <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 animate-spin-slow opacity-70 blur-md" />
                            )}
                            
                            {/* Avatar */}
                            <div 
                                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${glowColors[visualIndex]} p-0.5 cursor-pointer transform transition-transform hover:scale-110`}
                                onClick={() => onNavigate(`profile/${user.id}`)}
                            >
                                <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center text-2xl font-bold text-white font-display">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Rank Badge */}
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' : ''}
                                ${user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : ''}
                                ${user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-yellow-600 text-black' : ''}
                            `}>
                                {user.rank}
                            </div>

                            {/* Crown for 1st place */}
                            {user.rank === 1 && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 1l3 6 6 1-4.5 4 1.5 6-6-3-6 3 1.5-6L3 8l6-1z"/>
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <h3 
                            className="font-display text-sm md:text-base text-white text-center mb-1 cursor-pointer hover:text-neon-cyan transition-colors"
                            onClick={() => onNavigate(`profile/${user.id}`)}
                        >
                            {user.fullName}
                        </h3>

                        {/* Value */}
                        <div className="text-xs md:text-sm font-bold text-neon-green mb-2">
                            <CountUp end={user.portfolioValue} prefix="$" duration={1500} />
                        </div>

                        {/* Podium Bar */}
                        <div 
                            className={`w-24 md:w-32 ${heights[visualIndex]} rounded-t-lg relative overflow-hidden transition-all duration-500`}
                            style={{
                                background: `linear-gradient(180deg, 
                                    ${user.rank === 1 ? 'rgba(250, 204, 21, 0.3)' : user.rank === 2 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(251, 146, 60, 0.3)'} 0%,
                                    rgba(15, 15, 30, 0.8) 100%
                                )`,
                                boxShadow: user.rank === 1 
                                    ? '0 0 40px rgba(250, 204, 21, 0.4)' 
                                    : user.rank === 2 
                                    ? '0 0 30px rgba(156, 163, 175, 0.3)'
                                    : '0 0 25px rgba(251, 146, 60, 0.3)'
                            }}
                        >
                            {/* Animated lines */}
                            <div className="absolute inset-0 opacity-20">
                                {[...Array(5)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className="absolute w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"
                                        style={{ top: `${20 + i * 20}%` }}
                                    />
                                ))}
                            </div>

                            {/* Rank number */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl md:text-5xl font-display font-bold text-white/20">
                                    {user.rank}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Leaderboard Row Component
const LeaderboardRow: React.FC<{ 
    user: RankedUser; 
    isCurrentUser: boolean; 
    onNavigate: (page: string) => void;
    index: number;
}> = ({ user, isCurrentUser, onNavigate, index }) => {
    return (
        <div
            className={`
                group relative flex items-center p-4 rounded-xl transition-all duration-300
                ${isCurrentUser 
                    ? 'bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/50' 
                    : 'glass-card hover:border-neon-cyan/30'
                }
                animate-slide-up
            `}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)' }}
            />

            {/* Rank */}
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-dark-700/50 mr-4">
                <span className={`text-xl font-display font-bold ${
                    user.rank <= 3 
                        ? user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-300' : 'text-orange-400'
                        : 'text-gray-400'
                }`}>
                    #{user.rank}
                </span>
            </div>

            {/* Avatar */}
            <div 
                className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5 cursor-pointer mr-4 transform transition-transform hover:scale-110"
                onClick={() => onNavigate(`profile/${user.id}`)}
            >
                <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center text-lg font-bold text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <button 
                    onClick={() => onNavigate(`profile/${user.id}`)}
                    className="font-display font-semibold text-white hover:text-neon-cyan transition-colors text-left truncate block"
                >
                    {user.fullName}
                    {isCurrentUser && (
                        <span className="ml-2 text-xs text-neon-cyan">(Vous)</span>
                    )}
                </button>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <NeonBadge variant={user.league.badgeVariant} size="sm" glow>
                        {user.league.emoji} {user.league.name}
                    </NeonBadge>
                    {user.country && (
                        <span className="text-xs text-gray-500">{user.country}</span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-8">
                {/* Composite Score */}
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Score</p>
                    <p className="font-display font-bold text-neon-violet">
                        {user.compositeScore.toFixed(1)}
                    </p>
                </div>

                {/* Return Percentage */}
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Rendement</p>
                    <p className={`font-display font-bold ${user.returnPercentage >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {user.returnPercentage >= 0 ? '+' : ''}{user.returnPercentage.toFixed(2)}%
                    </p>
                </div>

                {/* Portfolio Value */}
                <div className="text-right min-w-[120px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Portefeuille</p>
                    <p className="font-display font-bold text-white text-lg">
                        <CountUp end={user.portfolioValue} prefix="$" decimals={0} duration={1000} />
                    </p>
                </div>
            </div>

            {/* Mobile Stats */}
            <div className="md:hidden text-right">
                <p className="font-display font-bold text-white">
                    ${Math.floor(user.portfolioValue).toLocaleString()}
                </p>
                <p className={`text-sm ${user.returnPercentage >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                    {user.returnPercentage >= 0 ? '+' : ''}{user.returnPercentage.toFixed(1)}%
                </p>
            </div>

            {/* Decorative arrow */}
            <div className="ml-4 text-gray-600 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
};

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onNavigate }) => {
    const { currentUser, getAllUserAccounts } = useAuth();
    const [users, setUsers] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCohort, setActiveCohort] = useState<string>('all');

    useEffect(() => {
        const fetchAndRankUsers = async () => {
            try {
                setIsLoading(true);
                const allUsers = await getAllUserAccounts();
                const usersWithCalculations = allUsers
                    .filter(user => user.role !== 'admin')
                    .map(user => {
                        const holdingsValue = user.portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
                        const portfolioValue = user.portfolio.cash + holdingsValue;
                        return { ...user, portfolioValue };
                    });

                const allHoldings = usersWithCalculations.flatMap(u => u.portfolio.holdings);
                const uniqueTickers = [...new Set(allHoldings.map(h => h.ticker))];
                const priceMap = new Map<string, number>();

                if (uniqueTickers.length > 0) {
                    const pricePromises = uniqueTickers.map(ticker => getStockData(ticker));
                    const priceResults = await Promise.allSettled(pricePromises);
                    priceResults.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value) {
                            priceMap.set(uniqueTickers[index], result.value.price);
                        }
                    });
                }
                
                const rankedUsers = usersWithCalculations.map(user => {
                    const holdingsValue = user.portfolio.holdings.reduce((acc, h) => acc + (h.shares * (priceMap.get(h.ticker) ?? h.purchasePrice)), 0);
                    const portfolioValue = user.portfolio.cash + holdingsValue;
                    const totalReturn = portfolioValue - user.portfolio.initialValue;
                    const returnPercentage = user.portfolio.initialValue > 0 ? (totalReturn / user.portfolio.initialValue) * 100 : 0;

                    // Compute win rate from transactions
                    const txns = user.transactions ?? [];
                    const sells = txns.filter(t => t.type === 'sell');
                    const winRate = sells.length > 0 ? sells.filter(t => t.price > t.price * 0.98).length / sells.length : 0.5;

                    // Sharpe proxy (return / volatility assumed to be 10% for sim)
                    const sharpe = returnPercentage / 10;

                    const compositeScore = computeCompositeScore(returnPercentage, winRate, sharpe);
                    const league = getLeague(compositeScore);
                    const cohortKey = getCohortKey(user.createdAt);

                    return {
                        ...user,
                        portfolioValue,
                        returnPercentage,
                        compositeScore,
                        league,
                        winRate,
                        level: getLevel(portfolioValue),
                        cohortKey,
                    };
                })
                .sort((a, b) => b.compositeScore - a.compositeScore)
                .map((user, index) => ({ ...user, rank: index + 1 }));

                setUsers(rankedUsers);
            } catch (err) {
                setError("Impossible de charger le classement.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndRankUsers();
    }, [getAllUserAccounts]);

    // Derive cohort options from actual users
    const cohortKeys = ['all', ...Array.from(new Set(users.map(u => u.cohortKey))).sort().reverse()];

    // Filter by cohort
    const filteredUsers = activeCohort === 'all'
        ? users
        : users.filter(u => u.cohortKey === activeCohort);

    // Re-rank within cohort
    const cohortRankedUsers = filteredUsers.map((user, index) => ({ ...user, rank: index + 1 }));

    const top3 = cohortRankedUsers.slice(0, 3);
    const rest = cohortRankedUsers.slice(3);

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground variant="grid" intensity="medium" />
            
            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 mb-6 relative">
                        <TrophyIcon className="w-10 h-10 text-yellow-400" />
                        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ boxShadow: '0 0 40px rgba(250, 204, 21, 0.3)' }} />
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                        <span className="text-glow-cyan">Classement</span>{' '}
                        <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            Global
                        </span>
                    </h1>
                    
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Affrontez les meilleurs traders et grimpez les ligues pour atteindre le rang
                        <span className="text-yellow-400 font-semibold"> 🚀 Legend</span>.
                    </p>

                    {/* Stats Summary */}
                    <div className="flex justify-center gap-8 mt-8">
                        <div className="text-center">
                            <p className="text-3xl font-display font-bold text-white">
                                <CountUp end={cohortRankedUsers.length} duration={1000} />
                            </p>
                            <p className="text-sm text-gray-500">Traders{activeCohort !== 'all' ? ' (cohorte)' : ''}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-display font-bold text-neon-green">
                                <CountUp end={cohortRankedUsers.reduce((acc, u) => acc + u.portfolioValue, 0)} prefix="$" decimals={0} duration={1500} />
                            </p>
                            <p className="text-sm text-gray-500">Volume Total</p>
                        </div>
                    </div>

                    {/* Cohort selector (Timeless feature) */}
                    {cohortKeys.length > 1 && (
                        <div className="mt-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">⏱ Cohortes Timeless</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {cohortKeys.map(key => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveCohort(key)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            activeCohort === key
                                                ? 'bg-neon-violet/20 border border-neon-violet/50 text-neon-violet'
                                                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {formatCohortLabel(key)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* League progression display */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {LEAGUES.map((l, i) => (
                            <div key={l.name} className="flex items-center gap-1.5">
                                <span className="text-lg">{l.emoji}</span>
                                <span className="text-xs text-gray-400 font-medium">{l.name}</span>
                                {i < LEAGUES.length - 1 && (
                                    <span className="text-gray-600 mx-1">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mb-4" />
                        <p className="text-gray-400 animate-pulse">Chargement du classement...</p>
                    </div>
                ) : error ? (
                    <NeonCard variant="magenta" className="text-center py-12">
                        <p className="text-red-400">{error}</p>
                    </NeonCard>
                ) : (
                    <>
                        {/* Cohort label */}
                        {activeCohort !== 'all' && (
                            <div className="text-center mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-violet/10 border border-neon-violet/30 text-neon-violet text-sm font-medium">
                                    ⏱ {formatCohortLabel(activeCohort)}
                                    <span className="text-gray-400">– {cohortRankedUsers.length} trader{cohortRankedUsers.length !== 1 ? 's' : ''}</span>
                                </span>
                            </div>
                        )}

                        {/* Podium for Top 3 */}
                        {top3.length >= 3 && (
                            <Podium users={top3} onNavigate={onNavigate} />
                        )}

                        {/* Rest of the leaderboard */}
                        <div className="space-y-3">
                            {/* Show top 3 in list on mobile */}
                            <div className="md:hidden space-y-3">
                                {top3.map((user, index) => (
                                    <LeaderboardRow
                                        key={user.id}
                                        user={user}
                                        isCurrentUser={currentUser?.id === user.id}
                                        onNavigate={onNavigate}
                                        index={index}
                                    />
                                ))}
                            </div>

                            {/* Rest of users */}
                            {rest.map((user, index) => (
                                <LeaderboardRow
                                    key={user.id}
                                    user={user}
                                    isCurrentUser={currentUser?.id === user.id}
                                    onNavigate={onNavigate}
                                    index={index + 3}
                                />
                            ))}

                            {cohortRankedUsers.length === 0 && (
                                <NeonCard variant="cyan" className="text-center py-12">
                                    <SparklesIcon className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                                    <p className="text-gray-400">Aucun trader pour ce filtre.</p>
                                </NeonCard>
                            )}
                        </div>

                        {/* Current user highlight if not in top */}
                        {currentUser && !cohortRankedUsers.slice(0, 10).find(u => u.id === currentUser.id) && (
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-center text-gray-500 mb-4">Votre position</p>
                                {cohortRankedUsers.find(u => u.id === currentUser.id) && (
                                    <LeaderboardRow
                                        user={cohortRankedUsers.find(u => u.id === currentUser.id)!}
                                        isCurrentUser={true}
                                        onNavigate={onNavigate}
                                        index={0}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LeaderboardView;
