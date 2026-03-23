import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { BadgeDefinition, UserAccount } from '../types';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import AnimatedBackground from './ui/AnimatedBackground';
import { TrophyIcon, StarIcon, SparklesIcon, ChartBarIcon, BoltIcon, FireIcon, RocketLaunchIcon, CheckCircleIcon } from './icons/Icons';

const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'first_trade',
    name: 'Premier Pas',
    description: 'Effectuer votre premier trade',
    icon: '🚀',
    category: 'trading',
    color: 'cyan',
    rarity: 'common',
    condition: (a) => a.transactions.length >= 1,
  },
  {
    id: 'ten_trades',
    name: 'Trader Actif',
    description: 'Effectuer 10 trades',
    icon: '📈',
    category: 'trading',
    color: 'green',
    rarity: 'common',
    condition: (a) => a.transactions.length >= 10,
  },
  {
    id: 'fifty_trades',
    name: 'Vétéran',
    description: 'Effectuer 50 trades',
    icon: '⚡',
    category: 'trading',
    color: 'violet',
    rarity: 'rare',
    condition: (a) => a.transactions.length >= 50,
  },
  {
    id: 'hundred_trades',
    name: 'Légende du Trading',
    description: 'Effectuer 100 trades',
    icon: '💎',
    category: 'trading',
    color: 'magenta',
    rarity: 'epic',
    condition: (a) => a.transactions.length >= 100,
  },
  {
    id: 'diversified',
    name: 'Diversifié',
    description: 'Détenir 5 actions différentes simultanément',
    icon: '🌍',
    category: 'trading',
    color: 'green',
    rarity: 'common',
    condition: (a) => a.portfolio.holdings.length >= 5,
  },
  {
    id: 'africa_investor',
    name: 'Investisseur Africain',
    description: 'Acheter une action sur un marché africain (BRVM, JSE, NSE)',
    icon: '🌍',
    category: 'trading',
    color: 'orange',
    rarity: 'rare',
    condition: (a) => a.transactions.some(t =>
      t.exchange && ['BRVM', 'JSE', 'NSE', 'NGX', 'EGX', 'GSE'].some(ex => t.exchange.toUpperCase().includes(ex))
    ),
  },
  {
    id: 'profit_10k',
    name: 'Premier 10K',
    description: 'Atteindre 110 000 $ de valeur de portefeuille',
    icon: '💰',
    category: 'performance',
    color: 'yellow',
    rarity: 'common',
    condition: (a) => {
      const val = a.portfolio.cash + a.portfolio.holdings.reduce((s, h) => s + h.shares * (h.currentValue ?? h.purchasePrice), 0);
      return val >= 110000;
    },
  },
  {
    id: 'profit_50k',
    name: 'Grande Fortune',
    description: 'Atteindre 150 000 $ de valeur de portefeuille',
    icon: '🏆',
    category: 'performance',
    color: 'orange',
    rarity: 'rare',
    condition: (a) => {
      const val = a.portfolio.cash + a.portfolio.holdings.reduce((s, h) => s + h.shares * (h.currentValue ?? h.purchasePrice), 0);
      return val >= 150000;
    },
  },
  {
    id: 'millionaire',
    name: 'Millionnaire',
    description: 'Atteindre 1 000 000 $ de valeur de portefeuille',
    icon: '🌟',
    category: 'performance',
    color: 'magenta',
    rarity: 'legendary',
    condition: (a) => {
      const val = a.portfolio.cash + a.portfolio.holdings.reduce((s, h) => s + h.shares * (h.currentValue ?? h.purchasePrice), 0);
      return val >= 1000000;
    },
  },
  {
    id: 'analyst',
    name: 'Analyste',
    description: 'Effectuer 3 analyses financières',
    icon: '🔬',
    category: 'education',
    color: 'cyan',
    rarity: 'common',
    condition: (a) => a.analysisHistory.length >= 3,
  },
  {
    id: 'senior_analyst',
    name: 'Analyste Senior',
    description: 'Effectuer 10 analyses financières',
    icon: '📊',
    category: 'education',
    color: 'violet',
    rarity: 'rare',
    condition: (a) => a.analysisHistory.length >= 10,
  },
  {
    id: 'risk_manager',
    name: 'Gestionnaire du Risque',
    description: 'Utiliser un ordre stop-loss ou take-profit',
    icon: '🛡️',
    category: 'trading',
    color: 'green',
    rarity: 'common',
    condition: (a) => a.transactions.length >= 2,
  },
  {
    id: 'watchlist_builder',
    name: 'Veilleur de Marchés',
    description: 'Ajouter 5 actions à votre watchlist',
    icon: '👁️',
    category: 'trading',
    color: 'cyan',
    rarity: 'common',
    condition: (a) => a.watchlist.length >= 5,
  },
  {
    id: 'global_trader',
    name: 'Trader Global',
    description: 'Trader sur 3 bourses différentes',
    icon: '🌐',
    category: 'trading',
    color: 'violet',
    rarity: 'rare',
    condition: (a) => {
      const exchanges = new Set(a.transactions.map(t => t.exchange));
      return exchanges.size >= 3;
    },
  },
  {
    id: 'prediction_maker',
    name: 'Visionnaire',
    description: 'Créer votre première prédiction de marché',
    icon: '🔮',
    category: 'prediction',
    color: 'magenta',
    rarity: 'common',
    condition: (_a) => false,
  },
];

const RARITY_CONFIG = {
  common: { label: 'Commun', color: 'text-gray-400', border: 'border-gray-600/50', bg: 'bg-gray-800/50' },
  rare: { label: 'Rare', color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-900/20' },
  epic: { label: 'Épique', color: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-900/20' },
  legendary: { label: 'Légendaire', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-900/20' },
};

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  trading: ChartBarIcon,
  performance: TrophyIcon,
  education: SparklesIcon,
  prediction: BoltIcon,
  social: FireIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tous',
  trading: 'Trading',
  performance: 'Performance',
  education: 'Éducation',
  prediction: 'Prédictions',
  social: 'Social',
};

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: number;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned, earnedAt }) => {
  const rarity = RARITY_CONFIG[badge.rarity];

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-300
      ${earned
        ? `${rarity.bg} ${rarity.border} hover:scale-[1.02]`
        : 'bg-white/3 border-white/10 opacity-50 grayscale'
      }
    `}>
      {earned && badge.rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-600/10 animate-pulse pointer-events-none" />
      )}

      <div className="flex items-start gap-3">
        <div className={`
          text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0
          ${earned ? 'bg-white/10' : 'bg-white/5'}
        `}>
          {badge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`font-bold text-sm ${earned ? 'text-white' : 'text-gray-500'}`}>
              {badge.name}
            </h3>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${rarity.color} ${rarity.bg} border ${rarity.border}`}>
              {rarity.label}
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${earned ? 'text-gray-400' : 'text-gray-600'}`}>
            {badge.description}
          </p>
          {earned && earnedAt && (
            <p className="text-[10px] text-gray-500 mt-1.5">
              Obtenu le {new Date(earnedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
          {!earned && (
            <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
              <span>🔒</span> Non débloqué
            </p>
          )}
        </div>

        {earned && (
          <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${rarity.color}`} />
        )}
      </div>
    </div>
  );
};

const BadgesView: React.FC = () => {
  const { currentUserAccount } = useAuth();
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  const earned = useMemo<Set<string>>(() => {
    if (!currentUserAccount) return new Set();
    const result = new Set<string>();
    ALL_BADGES.forEach(b => {
      if (b.condition(currentUserAccount)) result.add(b.id);
    });
    return result;
  }, [currentUserAccount]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return ALL_BADGES;
    return ALL_BADGES.filter(b => b.category === activeCategory);
  }, [activeCategory]);

  const earnedCount = earned.size;
  const total = ALL_BADGES.length;
  const progress = Math.round((earnedCount / total) * 100);

  const legendaryEarned = ALL_BADGES.filter(b => b.rarity === 'legendary' && earned.has(b.id)).length;
  const epicEarned = ALL_BADGES.filter(b => b.rarity === 'epic' && earned.has(b.id)).length;

  return (
    <div className="space-y-8 relative">
      <AnimatedBackground />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-400" />
            Badges & Achievements
          </h1>
          <p className="mt-1 text-gray-400">Déverrouillez des récompenses en accomplissant des exploits</p>
        </div>
        <div className="flex items-center gap-3">
          <NeonBadge variant="orange" size="md" glow>
            {earnedCount}/{total} débloqués
          </NeonBadge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeonCard variant="cyan" className="p-4 text-center">
          <p className="text-3xl font-black text-neon-cyan">{earnedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Badges obtenus</p>
        </NeonCard>
        <NeonCard variant="default" className="p-4 text-center">
          <p className="text-3xl font-black text-white">{progress}%</p>
          <p className="text-sm text-gray-400 mt-1">Complétion</p>
        </NeonCard>
        <NeonCard variant="violet" className="p-4 text-center">
          <p className="text-3xl font-black text-neon-violet">{epicEarned}</p>
          <p className="text-sm text-gray-400 mt-1">Épiques</p>
        </NeonCard>
        <NeonCard variant="magenta" className="p-4 text-center">
          <p className="text-3xl font-black text-yellow-400">{legendaryEarned}</p>
          <p className="text-sm text-gray-400 mt-1">Légendaires</p>
        </NeonCard>
      </div>

      <NeonCard variant="default" className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progression globale</span>
          <span className="text-sm font-bold text-neon-cyan">{progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </NeonCard>

      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const Icon = CATEGORY_ICONS[key];
          const isActive = activeCategory === key;
          return (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'}`}>
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...filtered].sort((a, b) => {
          const aE = earned.has(a.id) ? 1 : 0;
          const bE = earned.has(b.id) ? 1 : 0;
          return bE - aE;
        }).map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earned.has(badge.id)}
            earnedAt={earned.has(badge.id) ? Date.now() : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <RocketLaunchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucun badge dans cette catégorie</p>
        </div>
      )}
    </div>
  );
};

export default BadgesView;
