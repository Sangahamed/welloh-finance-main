import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount, StockHolding, Portfolio } from '../types';
import { getStockData } from '../services/geminiService';
import { WalletIcon, BriefcaseIcon, ExclamationTriangleIcon, TrophyIcon, StarIcon, ChartBarIcon, SparklesIcon, FireIcon, ClockIcon, GlobeAltIcon, UserPlusIcon, CheckCircleIcon, RocketLaunchIcon } from './icons/Icons';
import { toggleFollow, isFollowing } from '../lib/database';
import { useToast } from './ui/Toast';
import AnimatedBackground from './ui/AnimatedBackground';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import CountUp from './ui/CountUp';

interface ProfileViewProps {
    userId: string;
    onNavigate: (page: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
    { name: 'Novice', threshold: 0, color: 'cyan' as const, icon: StarIcon, nextThreshold: 110000 },
    { name: 'Apprenti', threshold: 110000, color: 'green' as const, icon: ChartBarIcon, nextThreshold: 150000 },
    { name: 'Trader', threshold: 150000, color: 'violet' as const, icon: SparklesIcon, nextThreshold: 250000 },
    { name: 'Investisseur', threshold: 250000, color: 'magenta' as const, icon: FireIcon, nextThreshold: 500000 },
    { name: 'Maestro', threshold: 500000, color: 'orange' as const, icon: TrophyIcon, nextThreshold: Infinity },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

const getLevelProgress = (value: number, level: typeof levels[0]) => {
    if (level.nextThreshold === Infinity) return 100;
    const progress = ((value - level.threshold) / (level.nextThreshold - level.threshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
};

// Holdings Table with Neon Style
const HoldingsTable: React.FC<{ holdings: StockHolding[] }> = ({ holdings }) => {
    if (holdings.length === 0) {
        return (
            <div className="text-center py-8">
                <BriefcaseIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Aucune action detenue pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Prix Achat</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Valeur</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">P/L</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {holdings.map((h, index) => {
                        const totalValue = h.shares * (h.currentValue || h.purchasePrice);
                        const totalCost = h.shares * h.purchasePrice;
                        const gainLoss = totalValue - totalCost;
                        const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
                        const isPositive = gainLoss >= 0;
                        
                        return (
                            <tr 
                                key={h.ticker} 
                                className="group hover:bg-white/5 transition-colors animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center border border-white/10">
                                            <span className="font-display font-bold text-neon-cyan text-sm">{h.ticker.slice(0, 2)}</span>
                                        </div>
                                        <span className="font-display font-bold text-white">{h.ticker}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-300">{h.shares}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-300">{formatCurrency(h.purchasePrice)}</td>
                                <td className="px-4 py-4 whitespace-nowrap font-semibold text-white">{formatCurrency(totalValue)}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className={`flex items-center gap-2 ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
                                        <span className="font-semibold">{isPositive ? '+' : ''}{formatCurrency(gainLoss)}</span>
                                        <NeonBadge variant={isPositive ? 'green' : 'magenta'} size="sm">
                                            {isPositive ? '+' : ''}{gainLossPercent.toFixed(1)}%
                                        </NeonBadge>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Transaction History with Neon Style
const TransactionHistory: React.FC<{ transactions: UserAccount['transactions'] }> = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction pour le moment.</p>
            </div>
        );
    }

    const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    return (
        <div className="space-y-3">
            {sortedTransactions.map((tx, index) => (
                <div 
                    key={tx.id || index}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-white/5 hover:border-neon-cyan/30 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tx.type === 'buy' 
                                ? 'bg-neon-green/20 border border-neon-green/30' 
                                : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                            {tx.type === 'buy' ? (
                                <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-display font-semibold text-white">
                                {tx.type === 'buy' ? 'Achat' : 'Vente'} {tx.ticker}
                            </p>
                            <p className="text-sm text-gray-500">
                                {tx.shares} actions @ {formatCurrency(tx.price)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-display font-bold ${tx.type === 'buy' ? 'text-red-400' : 'text-neon-green'}`}>
                            {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.shares * tx.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Skeleton Loaders
const PortfolioSkeleton: React.FC = () => (
    <NeonCard variant="cyan" className="animate-pulse">
        <div className="h-6 w-1/3 bg-dark-600 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-dark-600 rounded-lg" />
            ))}
        </div>
    </NeonCard>
);

const HoldingsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-3 pt-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-dark-600 rounded-lg w-full" />
        ))}
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ userId, onNavigate }) => {
    const { currentUser, getUserAccountById } = useAuth();
    const { success, error } = useToast();
    const [viewedUser, setViewedUser] = useState<UserAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshedPortfolio, setRefreshedPortfolio] = useState<Portfolio | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const checkFollow = async () => {
            if (currentUser && userId && currentUser.id !== userId) {
                const following = await isFollowing(currentUser.id, userId);
                setIsFollowingUser(following);
            }
        };
        checkFollow();
    }, [currentUser, userId]);

    const handleFollowToggle = async () => {
        if (!currentUser || !userId || currentUser.id === userId) return;
        setFollowLoading(true);
        const success_follow = await toggleFollow(currentUser.id, userId);
        if (success_follow) {
            const nextFollowState = !isFollowingUser;
            setIsFollowingUser(nextFollowState);
            success(nextFollowState ? `Vous suivez maintenant ${viewedUser?.fullName}` : `Vous ne suivez plus ${viewedUser?.fullName}`);
            const updated = await getUserAccountById(userId);
            setViewedUser(updated || null);
        } else {
            error("Erreur social", "Impossible de mettre à jour le statut d'abonnement.");
        }
        setFollowLoading(false);
    };

    const handleCopyPortfolio = () => {
        if (!currentUser || !viewedUser) return;
        success("Copie démarrée", `Votre portefeuille réplique désormais les mouvements de ${viewedUser.fullName}.`);
    };

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const user = await getUserAccountById(userId);
                setViewedUser(user || null);
            } catch (e) {
                console.error("Failed to fetch user profile:", e);
                setViewedUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [userId, getUserAccountById]);

    useEffect(() => {
        if (!viewedUser) return;

        const refreshPortfolio = async () => {
            setIsRefreshing(true);
            const { holdings, ...restOfPortfolio } = viewedUser.portfolio;

            if (holdings.length === 0) {
                setRefreshedPortfolio(viewedUser.portfolio);
                setIsRefreshing(false);
                return;
            }

            try {
                const freshDataPromises = holdings.map(h => getStockData(h.ticker));
                const freshDataResults = await Promise.allSettled(freshDataPromises);

                const updatedHoldings = holdings.map((holding, index) => {
                    const result = freshDataResults[index];
                    if (result.status === 'fulfilled' && result.value) {
                        return { ...holding, currentValue: result.value.price };
                    }
                    return { ...holding, currentValue: holding.purchasePrice };
                });

                setRefreshedPortfolio({ ...restOfPortfolio, holdings: updatedHoldings });
            } catch (e) {
                console.error("Failed to refresh profile portfolio data:", e);
                setRefreshedPortfolio(viewedUser.portfolio);
            } finally {
                setIsRefreshing(false);
            }
        };

        refreshPortfolio();
    }, [viewedUser]);

    if (isLoading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground variant="minimal" />
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (!viewedUser || !currentUser) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground variant="minimal" />
                <NeonCard variant="magenta" className="text-center max-w-md">
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Accès restreint</h2>
                    <p className="text-gray-400">Utilisateur non trouvé ou non autorisé.</p>
                </NeonCard>
            </div>
        );
    }

    const portfolio = refreshedPortfolio || viewedUser.portfolio;
    const portfolioTotalValue = portfolio.cash + portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
    const portfolioGainLoss = portfolioTotalValue - portfolio.initialValue;
    const portfolioGainLossPercent = portfolio.initialValue > 0 ? (portfolioGainLoss / portfolio.initialValue) * 100 : 0;
    const userLevel = getLevel(portfolioTotalValue);
    const levelProgress = getLevelProgress(portfolioTotalValue, userLevel);
    const LevelIcon = userLevel.icon;
    const isOwnProfile = currentUser.id === viewedUser.id;
    const isPublicView = !isOwnProfile && currentUser.role !== 'admin';

    let currentUserGainLossPercent = 0;
    const currentUserAcc = currentUser as unknown as UserAccount;
    if (isPublicView && currentUserAcc?.portfolio) {
         const currentUserTotal = currentUserAcc.portfolio.cash + currentUserAcc.portfolio.holdings.reduce((acc, h) => acc + (h.shares * h.purchasePrice), 0);
         currentUserGainLossPercent = currentUserAcc.portfolio.initialValue > 0 ? ((currentUserTotal - currentUserAcc.portfolio.initialValue) / currentUserAcc.portfolio.initialValue) * 100 : 0;
    }

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground variant="default" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8 pb-20">
                {/* Profile Header */}
                <NeonCard variant={userLevel.color as 'cyan' | 'green' | 'violet' | 'magenta'} className="overflow-visible">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-1">
                        <div className="relative shrink-0">
                            <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br from-neon-${userLevel.color} to-neon-violet p-0.5 relative`}>
                                <div className="w-full h-full rounded-2xl bg-dark-800 flex items-center justify-center">
                                    <span className="text-5xl font-display font-bold text-white">
                                        {viewedUser.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl -z-10" style={{ background: `linear-gradient(135deg, var(--neon-${userLevel.color}), var(--neon-violet))` }} />
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <NeonBadge variant={userLevel.color === 'orange' ? 'violet' : userLevel.color} glow>
                                    <LevelIcon className="w-4 h-4 mr-1" /> {userLevel.name}
                                </NeonBadge>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">{viewedUser.fullName}</h1>
                                        {isOwnProfile && <span className="px-2 py-0.5 text-[10px] bg-neon-cyan/20 text-neon-cyan rounded-full border border-neon-cyan/30 uppercase font-black">Propriétaire</span>}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5"><span className="text-white font-bold text-lg">{viewedUser.followersCount || 0}</span><span className="text-gray-500 text-[10px] uppercase font-semibold tracking-widest">Abonnés</span></div>
                                        <div className="flex items-center gap-1.5"><span className="text-white font-bold text-lg">{viewedUser.followingCount || 0}</span><span className="text-gray-500 text-[10px] uppercase font-semibold tracking-widest">Abonnements</span></div>
                                    </div>
                                </div>
                                {currentUser && !isOwnProfile && (
                                    <div className="flex gap-3">
                                        <button onClick={handleFollowToggle} disabled={followLoading} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all ${isFollowingUser ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-neon-violet text-white hover:bg-neon-violet/80 shadow-[0_0_20px_rgba(182,36,255,0.3)]'} ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {followLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isFollowingUser ? <><CheckCircleIcon className="w-4 h-4" /> Suivi</> : <><UserPlusIcon className="w-4 h-4" /> Suivre</>}
                                        </button>
                                        <button onClick={handleCopyPortfolio} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neon-cyan text-dark-900 hover:bg-neon-cyan/80 font-display font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                                            <RocketLaunchIcon className="w-4 h-4" /> Copier
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {viewedUser.email && <span className="text-gray-400 font-mono text-xs">{viewedUser.email}</span>}
                                <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />
                                <div className="flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan"><GlobeAltIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">{viewedUser.role === 'admin' ? 'Administrateur' : 'Trader Certifié'}</span></div>
                            </div>
                            {userLevel.nextThreshold !== Infinity && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-semibold tracking-widest"><span className="text-gray-500">Progression vers {levels.find(l => l.threshold === userLevel.nextThreshold)?.name || 'suivant'}</span><span className="text-gray-400 font-mono">{formatCurrency(portfolioTotalValue)} / {formatCurrency(userLevel.nextThreshold)}</span></div>
                                    <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,255,0.2)]" style={{ width: `${levelProgress}%`, background: `linear-gradient(90deg, var(--neon-${userLevel.color}), var(--neon-violet))` }} /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </NeonCard>

                {/* Performance Summary Cards */}
                {isRefreshing ? <PortfolioSkeleton /> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NeonCard variant="cyan" className="text-center group hover:scale-[1.02] transition-transform">
                            <WalletIcon className="w-6 h-6 text-neon-cyan mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest mb-1">Valeur Totale</p>
                            <p className="text-xl font-display font-bold text-white"><CountUp end={portfolioTotalValue} prefix="$" decimals={0} duration={1500} /></p>
                        </NeonCard>
                        <NeonCard variant={portfolioGainLoss >= 0 ? 'green' : 'magenta'} className="text-center group hover:scale-[1.02] transition-transform">
                            {portfolioGainLoss >= 0 ? <svg className="w-6 h-6 text-neon-green mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> : <svg className="w-6 h-6 text-red-400 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest mb-1">Gain/Perte</p>
                            <p className={`text-xl font-display font-bold ${portfolioGainLoss >= 0 ? 'text-neon-green' : 'text-red-400'}`}><CountUp end={portfolioGainLoss} prefix={portfolioGainLoss >= 0 ? '+$' : '-$'} decimals={0} duration={1500} /></p>
                        </NeonCard>
                        <NeonCard variant={portfolioGainLossPercent >= 0 ? 'green' : 'magenta'} className="text-center group hover:scale-[1.02] transition-transform">
                            <ChartBarIcon className={`w-6 h-6 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity ${portfolioGainLossPercent >= 0 ? 'text-neon-green' : 'text-red-400'}`} />
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest mb-1">Rendement</p>
                            <p className={`text-xl font-display font-bold ${portfolioGainLossPercent >= 0 ? 'text-neon-green' : 'text-red-400'}`}>{portfolioGainLossPercent >= 0 ? '+' : ''}{portfolioGainLossPercent.toFixed(2)}%</p>
                        </NeonCard>
                        <NeonCard variant="violet" className="text-center group hover:scale-[1.02] transition-transform">
                            <svg className="w-6 h-6 text-neon-violet mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest mb-1">Liquidites</p>
                            <p className="text-xl font-display font-bold text-white"><CountUp end={portfolio.cash} prefix="$" decimals={0} duration={1500} /></p>
                        </NeonCard>
                    </div>
                )}

                {/* Skills Matrix */}
                {isOwnProfile && (() => {
                    const txs = viewedUser.transactions || [];
                    const totalTrades = txs.length;
                    const distinctTickers = new Set(txs.map(t => t.ticker)).size;
                    const sells = txs.filter(t => t.type === 'sell').length;
                    const recentTxs = txs.filter(t => Date.now() - t.timestamp < 30 * 24 * 3600 * 1000).length;
                    const skills = [
                        { label: 'Diversification', value: Math.min(100, Math.round((distinctTickers / 8) * 100)), color: 'neon-cyan', desc: `${distinctTickers} actifs` },
                        { label: 'Activité', value: Math.min(100, Math.round((totalTrades / 30) * 100)), color: 'neon-violet', desc: `${totalTrades} trades` },
                        { label: 'Risque', value: totalTrades > 0 ? Math.min(100, Math.round((sells / totalTrades) * 100 * 1.5)) : 0, color: 'neon-green', desc: 'Gestion active' },
                        { label: 'Rendement', value: Math.min(100, Math.max(0, Math.round(50 + portfolioGainLossPercent * 2))), color: portfolioGainLossPercent >= 0 ? 'neon-green' : 'red-400', desc: `${portfolioGainLossPercent.toFixed(1)}%` },
                        { label: 'Constance', value: Math.min(100, Math.round((recentTxs / 10) * 100)), color: 'neon-magenta', desc: 'Activité 30j' },
                    ];
                    return (
                        <NeonCard variant="violet">
                            <div className="flex items-center gap-3 mb-6"><ChartBarIcon className="w-5 h-5 text-neon-violet" /><h3 className="text-xl font-display font-bold text-white">Performances Statistiques</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">{skills.map(skill => (
                                <div key={skill.label} className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest"><span className="text-gray-400">{skill.label}</span><span className={`text-${skill.color}`}>{skill.value}%</span></div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${skill.value}%`, background: skill.color.startsWith('neon') ? `var(--${skill.color})` : '#f87171' }} /></div>
                                    <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">{skill.desc}</p>
                                </div>
                            ))}</div>
                        </NeonCard>
                    );
                })()}

                {/* Main Content Sections */}
                {!isPublicView ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <NeonCard variant="cyan">
                            <div className="flex items-center gap-3 mb-6"><BriefcaseIcon className="w-5 h-5 text-neon-cyan" /><h3 className="text-xl font-display font-bold text-white">Actifs Détenus</h3></div>
                            {isRefreshing ? <HoldingsSkeleton /> : <HoldingsTable holdings={portfolio.holdings} />}
                        </NeonCard>
                        <NeonCard variant="violet">
                            <div className="flex items-center gap-3 mb-6"><ClockIcon className="w-5 h-5 text-neon-violet" /><h3 className="text-xl font-display font-bold text-white">Dernières Transactions</h3></div>
                            <TransactionHistory transactions={viewedUser.transactions} />
                        </NeonCard>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <NeonCard variant="cyan" className="text-center py-12">
                            <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-widest">Score de Performance</h3>
                            <p className="text-gray-500 text-xs mb-8 uppercase tracking-tighter italic">Basé sur le rendement historique</p>
                            <p className={`text-6xl font-display font-black ${portfolioGainLossPercent >= 0 ? 'text-neon-cyan shadow-neon-cyan' : 'text-red-400 shadow-neon-magenta'}`}>{portfolioGainLossPercent >= 0 ? '+' : ''}{portfolioGainLossPercent.toFixed(2)}%</p>
                        </NeonCard>
                        <NeonCard variant="violet" className="text-center py-12">
                            <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-widest">Votre Comparaison</h3>
                            <p className="text-gray-500 text-xs mb-8 uppercase tracking-tighter italic">Votre rendement actuel</p>
                            <p className={`text-6xl font-display font-black ${currentUserGainLossPercent >= 0 ? 'text-neon-violet shadow-neon-violet' : 'text-red-400 shadow-neon-magenta'}`}>{currentUserGainLossPercent >= 0 ? '+' : ''}{currentUserGainLossPercent.toFixed(2)}%</p>
                        </NeonCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;
