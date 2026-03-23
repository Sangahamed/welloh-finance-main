import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/geminiService';
import { 
    suspendUser, 
    changeUserRole, 
    resetUserPortfolio, 
    getReports, 
    resolveReport, 
    issueCertificate, 
    getAdminLogs 
} from '../lib/database';
import { useToast } from './ui/Toast';
import { 
    GlobeAltIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    TrophyIcon, 
    ChartBarIcon, 
    BoltIcon, 
    SparklesIcon, 
    RocketLaunchIcon, 
    UserIcon, 
    ClockIcon, 
    ExclamationTriangleIcon, 
    ShieldCheckIcon, 
    ClipboardDocumentListIcon 
} from './icons/Icons';
import type { UserAccount, Report, AdminLog } from '../types';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import AnimatedBackground from './ui/AnimatedBackground';
import CountUp from './ui/CountUp';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);

const LEAGUES = [
    { name: 'Bronze', minScore: -Infinity, color: 'text-orange-400', emoji: '🥉' },
    { name: 'Silver', minScore: 10, color: 'text-gray-300', emoji: '🥈' },
    { name: 'Gold', minScore: 25, color: 'text-yellow-400', emoji: '🥇' },
    { name: 'Sapphire', minScore: 50, color: 'text-violet-400', emoji: '💎' },
    { name: 'Diamond', minScore: 100, color: 'text-cyan-400', emoji: '⚡' },
    { name: 'Legend', minScore: 200, color: 'text-neon-magenta', emoji: '🚀' },
];

function getLeague(returnPct: number) {
    return [...LEAGUES].reverse().find(l => returnPct >= l.minScore) ?? LEAGUES[0];
}

interface AdminDashboardViewProps {
    onNavigate: (page: string) => void;
}

type CalculatedUser = UserAccount & {
    portfolioValue: number;
    returnPercentage: number;
    league: typeof LEAGUES[number];
};

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.FC<any>; color: string }> = ({ label, value, sub, icon: Icon, color }) => (
    <NeonCard variant="default" className="p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </NeonCard>
);

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
    const { currentUser, getAllUserAccounts } = useAuth();
    const { success, error: showError, warning, info } = useToast();
    
    // State
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'logs'>('users');
    const [users, setUsers] = useState<CalculatedUser[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof CalculatedUser; direction: 'asc' | 'desc' }>({ key: 'portfolioValue', direction: 'desc' });
    const [actionTarget, setActionTarget] = useState<CalculatedUser | null>(null);
    const [actionType, setActionType] = useState<'suspend' | 'role' | 'reset' | 'verify' | null>(null);
    const [isActioning, setIsActioning] = useState(false);

    const openAction = (user: CalculatedUser, type: 'suspend' | 'role' | 'reset' | 'verify') => {
        setActionTarget(user);
        setActionType(type);
    };
    const closeAction = () => { setActionTarget(null); setActionType(null); };

    const refreshAllPortfolios = useCallback(async (currentUsers: Omit<CalculatedUser, 'league'>[]) => {
        const allHoldings = currentUsers.flatMap(u => u.portfolio.holdings);
        const uniqueTickers = [...new Set(allHoldings.map(h => h.ticker))];

        if (uniqueTickers.length === 0) {
            setUsers(currentUsers.map(u => ({ ...u, league: getLeague(u.returnPercentage) })));
            return;
        }

        const priceMap = new Map<string, number>();
        const results = await Promise.allSettled(uniqueTickers.map(t => getStockData(t)));
        results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value) priceMap.set(uniqueTickers[i], r.value.price);
        });

        const refreshed = currentUsers.map(user => {
            const holdings = user.portfolio.holdings.map(h => ({
                ...h,
                currentValue: priceMap.get(h.ticker) ?? h.purchasePrice,
            }));
            const portfolioValue = user.portfolio.cash + holdings.reduce((a, h) => a + h.shares * (h.currentValue ?? 0), 0);
            const returnPercentage = user.portfolio.initialValue > 0 ? ((portfolioValue - user.portfolio.initialValue) / user.portfolio.initialValue) * 100 : 0;
            return { ...user, portfolio: { ...user.portfolio, holdings }, portfolioValue, returnPercentage, league: getLeague(returnPercentage) };
        });

        setUsers(refreshed);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Fetch users
            const allUsers = await getAllUserAccounts();
            const filtered = allUsers.filter(u => u.role !== 'admin').map(user => {
                const holdingsValue = user.portfolio.holdings.reduce((a, h) => a + h.shares * (h.currentValue ?? h.purchasePrice), 0);
                const portfolioValue = user.portfolio.cash + holdingsValue;
                const returnPercentage = user.portfolio.initialValue > 0 ? ((portfolioValue - user.portfolio.initialValue) / user.portfolio.initialValue) * 100 : 0;
                return { ...user, portfolioValue, returnPercentage };
            });
            await refreshAllPortfolios(filtered);

            // Fetch reports
            const allReports = await getReports();
            setReports(allReports);

            // Fetch logs
            const allLogs = await getAdminLogs();
            setLogs(allLogs);

        } catch (e) {
            console.error(e);
            setError("Impossible de charger les données.");
        } finally {
            setIsLoading(false);
        }
    }, [getAllUserAccounts, refreshAllPortfolios]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const kpis = useMemo(() => {
        const totalPortfolioValue = users.reduce((a, u) => a + u.portfolioValue, 0);
        const totalTrades = users.reduce((a, u) => a + u.transactions.length, 0);
        const avgReturn = users.length > 0 ? users.reduce((a, u) => a + u.returnPercentage, 0) / users.length : 0;
        const profitable = users.filter(u => u.returnPercentage > 0).length;
        return { totalPortfolioValue, totalTrades, avgReturn, profitable };
    }, [users]);

    const sortedFiltered = useMemo(() => {
        let list = [...users];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(u => u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const av = a[sortConfig.key] as number;
            const bv = b[sortConfig.key] as number;
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortConfig.direction === 'asc' ? av - bv : bv - av;
            }
            return 0;
        });
        return list;
    }, [users, search, sortConfig]);

    const requestSort = (key: keyof CalculatedUser) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const SortIcon: React.FC<{ col: string }> = ({ col }) => {
        if (sortConfig.key !== col) return <span className="ml-1 text-gray-600">↕</span>;
        return <span className="ml-1 text-neon-cyan">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const handleAction = async () => {
        if (!actionTarget || !actionType || !currentUser) return;
        setIsActioning(true);
        try {
            if (actionType === 'suspend') {
                const newState = !actionTarget.isSuspended;
                const ok = await suspendUser(actionTarget.id, newState);
                if (ok) {
                    setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, isSuspended: newState } : u));
                    success(newState ? 'Utilisateur suspendu' : 'Suspension levée');
                }
            } else if (actionType === 'role') {
                const newRole = actionTarget.role === 'admin' ? 'user' : 'admin';
                const ok = await changeUserRole(actionTarget.id, newRole);
                if (ok) {
                    setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, role: newRole } : u));
                    success(newRole === 'admin' ? 'Rôle promu' : 'Rôle révoqué');
                }
            } else if (actionType === 'reset') {
                const ok = await resetUserPortfolio(actionTarget.id);
                if (ok) {
                    setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, portfolioValue: u.portfolio.initialValue, returnPercentage: 0 } : u));
                    warning('Portefeuille réinitialisé');
                }
            } else if (actionType === 'verify') {
                const ok = await issueCertificate(currentUser.id, actionTarget.id, 'expert_trader');
                if (ok) {
                    setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, isVerified: true } : u));
                    success('Utilisateur certifié', `${actionTarget.fullName} porte désormais le badge de Trader Certifié.`);
                }
            }
        } finally {
            setIsActioning(false);
            closeAction();
        }
    };

    const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
        const ok = await resolveReport(reportId, status);
        if (ok) {
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
            success(status === 'resolved' ? 'Signalement résolu' : 'Signalement rejeté');
        }
    };

    return (
        <div className="space-y-8 relative">
            <AnimatedBackground />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <GlobeAltIcon className="w-8 h-8 text-neon-violet" />
                        Dashboard Administrateur
                    </h1>
                    <p className="text-gray-400 mt-1 uppercase text-[10px] tracking-widest font-bold">Panel de Modération & Talent ID</p>
                </div>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-neon-cyan text-dark-900 shadow-neon-cyan' : 'text-gray-400 hover:text-white'}`}>UTILISATEURS</button>
                    <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-neon-magenta text-white shadow-neon-magenta' : 'text-gray-400 hover:text-white'}`}>SIGNALEMENTS {reports.filter(r => r.status === 'pending').length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-[8px] rounded-full text-white">{reports.filter(r => r.status === 'pending').length}</span>}</button>
                    <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-neon-violet text-white shadow-neon-violet' : 'text-gray-400 hover:text-white'}`}>LOGS</button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Traders Actifs" value={users.length} sub="enregistrés" icon={UserIcon} color="text-neon-cyan" />
                <StatCard label="Valeur Totale" value={formatCurrency(kpis.totalPortfolioValue)} sub="gérée" icon={TrophyIcon} color="text-yellow-400" />
                <StatCard label="Volume Trades" value={kpis.totalTrades} sub="opérations" icon={ChartBarIcon} color="text-neon-green" />
                <StatCard label="Rendement Moyen" value={`${kpis.avgReturn.toFixed(1)}%`} sub={`${kpis.profitable} profitables`} icon={RocketLaunchIcon} color={kpis.avgReturn >= 0 ? 'text-neon-green' : 'text-red-400'} />
            </div>

            {activeTab === 'users' && (
                <NeonCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">Traders de la plateforme</h2>
                        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none w-full md:w-64" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('fullName' as any)}>Utilisateur <SortIcon col="fullName" /></th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('portfolioValue')}>Valeur <SortIcon col="portfolioValue" /></th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('returnPercentage')}>Rendement <SortIcon col="returnPercentage" /></th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sortedFiltered.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-sm font-black text-dark-900">{user.fullName?.[0]?.toUpperCase()}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white">{user.fullName}</span>
                                                        {user.isVerified && <ShieldCheckIcon className="w-4 h-4 text-neon-cyan" />}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-mono italic">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{formatCurrency(user.portfolioValue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-black ${user.returnPercentage >= 0 ? 'text-neon-green' : 'text-red-400'}`}>{user.returnPercentage >= 0 ? '+' : ''}{user.returnPercentage.toFixed(2)}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <NeonBadge variant={user.isSuspended ? 'magenta' : 'cyan'} size="xs">{user.isSuspended ? 'SUSPENDU' : 'ACTIF'}</NeonBadge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button onClick={() => openAction(user, 'verify')} disabled={user.isVerified} className="p-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-30"><ShieldCheckIcon className="w-4 h-4" /></button>
                                            <button onClick={() => openAction(user, 'suspend')} className="p-2 rounded-lg border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"><BoltIcon className="w-4 h-4" /></button>
                                            <button onClick={() => openAction(user, 'reset')} className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"><SparklesIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>
            )}

            {activeTab === 'reports' && (
                <NeonCard variant="magenta" className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ExclamationTriangleIcon className="w-6 h-6 text-neon-magenta" /> File de Modération</h2>
                    <div className="space-y-4">
                        {reports.length === 0 ? <p className="text-center py-12 text-gray-500">Aucun signalement en attente.</p> : reports.map(report => (
                            <div key={report.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <NeonBadge variant="magenta" size="xs">{report.targetType.toUpperCase()}</NeonBadge>
                                        <span className={`text-xs font-bold ${report.status === 'pending' ? 'text-yellow-400' : 'text-gray-500'}`}>{report.status.toUpperCase()}</span>
                                    </div>
                                    <p className="text-sm text-white font-medium">Raison: <span className="text-gray-400">{report.reason}</span></p>
                                    <p className="text-[10px] text-gray-600">ID Cible: {report.targetId} • {new Date(report.createdAt).toLocaleString()}</p>
                                </div>
                                {report.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleResolveReport(report.id, 'resolved')} className="px-3 py-1.5 rounded-lg bg-neon-green text-dark-900 text-[10px] font-black uppercase">Résoudre</button>
                                        <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase">Ignorer</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </NeonCard>
            )}

            {activeTab === 'logs' && (
                <NeonCard variant="violet" className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ClipboardDocumentListIcon className="w-6 h-6 text-neon-violet" /> Journal d'Audit</h2>
                    <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-neon-violet/20">
                        {logs.map(log => (
                            <div key={log.id} className="text-xs py-3 border-b border-white/5 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-neon-violet font-bold uppercase tracking-tighter">{log.action.replace('_', ' ')}</span>
                                        <span className="text-gray-600 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-gray-400">Target: {log.targetId || 'SYSTEM'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-[9px] uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </NeonCard>
            )}

            {/* Action Confirmation Modal */}
            {actionTarget && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={closeAction}>
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <NeonCard variant="default" className="p-8 border-neon-cyan/20">
                            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter italic">Confirmer l'Action</h2>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                Vous êtes sur le point de {actionType === 'verify' ? 'CERTIFIER' : actionType === 'suspend' ? (actionTarget.isSuspended ? 'RÉACTIVER' : 'SUSPENDRE') : 'RÉINITIALISER'} le compte de 
                                <span className="text-white font-bold ml-1">{actionTarget.fullName}</span>.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={closeAction} className="flex-1 py-3 rounded-xl bg-white/5 text-white text-xs font-bold uppercase hover:bg-white/10 transition-all border border-white/10">Annuler</button>
                                <button onClick={handleAction} disabled={isActioning} className="flex-1 py-3 rounded-xl bg-neon-cyan text-dark-900 text-xs font-bold uppercase hover:bg-neon-cyan/80 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isActioning ? 'Chargement...' : 'Confirmer'}
                                </button>
                            </div>
                        </NeonCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardView;
