import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMarketOverview, getStockData, searchStocks } from '../services/geminiService';
import type { MarketIndex, Transaction, StockHolding, Portfolio, StockData, WatchlistItem } from '../types';
import MarketOverview from './MarketOverview';
import WatchlistPanel from './WatchlistPanel';
import StockChartView from './StockChartView';
import LevelUpNotification from './LevelUpNotification';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import CountUp from './ui/CountUp';
import { WalletIcon, BriefcaseIcon, ClockIcon, MagnifyingGlassIcon, ChartTrendingUpIcon, ArrowUpIcon, ArrowDownIcon, BoltIcon } from './icons/Icons';
import ActivityFeed from './ActivityFeed';

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
  { name: 'Novice', threshold: 0, color: 'text-gray-400', badge: 'cyan' },
  { name: 'Apprenti', threshold: 110000, color: 'text-neon-green', badge: 'green' },
  { name: 'Trader', threshold: 150000, color: 'text-neon-cyan', badge: 'cyan' },
  { name: 'Investisseur', threshold: 250000, color: 'text-neon-violet', badge: 'violet' },
  { name: 'Maestro', threshold: 500000, color: 'text-neon-magenta', badge: 'magenta' },
];

const getLevel = (value: number) => {
  return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

const getTradingStreak = (transactions: Transaction[]): number => {
  if (!transactions || transactions.length === 0) return 0;
  const dates = [...new Set(transactions.map(t =>
    new Date(t.timestamp).toISOString().slice(0, 10)
  ))].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// Search Results Table Component - Neon style
const SearchResultsTable: React.FC<{
  stocks: StockData[];
  onSelectStock: (ticker: string) => void;
}> = ({ stocks, onSelectStock }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-white/10">
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Prix</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Var. %</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Cap.</th>
          <th className="relative px-4 py-3"><span className="sr-only">Action</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {stocks.map((stock, index) => (
          <tr 
            key={stock.ticker} 
            className="hover:bg-white/5 transition-colors cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <td className="px-4 py-4 whitespace-nowrap">
              <span className="font-bold text-neon-cyan">{stock.ticker}</span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 max-w-[200px] truncate">
              {stock.companyName}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
              {formatCurrency(stock.price)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${stock.change >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {stock.change >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                {stock.percentChange}
              </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
              {stock.marketCap || 'N/A'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-right">
              <NeonButton
                variant="cyan"
                size="sm"
                onClick={() => onSelectStock(stock.ticker)}
              >
                Analyser
              </NeonButton>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Skeleton for SearchResultsTable
const SearchResultsSkeleton: React.FC = () => (
  <div className="space-y-3 pt-4">
    {[...Array(5)].map((_, i) => (
      <div 
        key={i} 
        className="h-14 skeleton rounded-lg"
        style={{ animationDelay: `${i * 100}ms` }}
      />
    ))}
  </div>
);

// Portfolio Panel Component - Neon style
const PortfolioPanel: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => {
  const { cash, holdings, initialValue } = portfolio;
  const holdingsValue = holdings.reduce((acc, h) => acc + (h.shares * h.currentValue!), 0);
  const totalValue = cash + holdingsValue;
  const totalGainLoss = totalValue - initialValue;
  const totalReturnPercent = initialValue > 0 ? (totalGainLoss / initialValue) * 100 : 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <NeonCard variant={isPositive ? 'green' : 'default'} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
            <WalletIcon className="w-5 h-5 text-neon-cyan" />
          </div>
          Votre Portefeuille
        </h3>
        <NeonBadge variant={isPositive ? 'green' : 'orange'} glow>
          {isPositive ? 'En profit' : 'En perte'}
        </NeonBadge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Valeur Totale</div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-display">
            <CountUp end={totalValue} prefix="$" decimals={0} separator="," />
          </div>
        </div>

        {/* Gain/Loss */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Gain/Perte</div>
          <div className={`text-2xl lg:text-3xl font-bold font-display ${isPositive ? 'text-neon-green text-glow-green' : 'text-red-400'}`}>
            <CountUp 
              end={totalGainLoss} 
              prefix={totalGainLoss >= 0 ? '+$' : '-$'} 
              decimals={0} 
              separator="," 
            />
          </div>
          <div className={`text-sm mt-1 ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
            ({totalReturnPercent.toFixed(2)}%)
          </div>
        </div>

        {/* Cash */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Liquidites</div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-display">
            <CountUp end={cash} prefix="$" decimals={0} separator="," />
          </div>
        </div>

        {/* Holdings Value */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Actifs</div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-display">
            <CountUp end={holdingsValue} prefix="$" decimals={0} separator="," />
          </div>
        </div>
      </div>
    </NeonCard>
  );
};

// Holdings Table Component - Neon style
const HoldingsTable: React.FC<{ holdings: StockHolding[] }> = ({ holdings }) => {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/5 border border-white/10 mb-4">
          <BriefcaseIcon className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400">Vous ne detenez aucune action.</p>
        <p className="text-sm text-gray-500 mt-1">Recherchez une action pour commencer a trader !</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Prix Achat</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Valeur</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">G/P</th>
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
                className="hover:bg-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-bold text-neon-cyan">{h.ticker}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {h.shares}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                  {formatCurrency(h.purchasePrice)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
                  {formatCurrency(totalValue)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    {formatCurrency(Math.abs(gainLoss))}
                    <span className="text-xs opacity-75">({gainLossPercent.toFixed(1)}%)</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Transaction History Component - Neon style
export const TransactionHistory: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Ticker', 'Bourse', 'Quantité', 'Prix ($)', 'Total ($)'];
    const rows = [...transactions].reverse().map(t => [
      new Date(t.timestamp).toLocaleDateString('fr-FR'),
      t.type === 'buy' ? 'Achat' : 'Vente',
      t.ticker,
      t.exchange,
      t.shares,
      t.price.toFixed(2),
      (t.shares * t.price).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `welloh_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <NeonCard variant="default" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-violet/10 border border-neon-violet/30">
            <ClockIcon className="w-5 h-5 text-neon-violet" />
          </div>
          Historique
        </h3>
        {transactions.length > 0 && (
          <button onClick={exportCSV}
            className="text-xs font-medium text-neon-green hover:text-white px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-all">
            ↓ CSV
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length > 0 ? transactions.slice().reverse().slice(0, 10).map((t, index) => {
          const isBuy = t.type === 'buy';
          return (
            <div 
              key={t.id} 
              className={`
                flex items-center justify-between p-3 rounded-xl
                border-l-2 transition-all duration-300
                hover:bg-white/5
                ${isBuy ? 'border-neon-green bg-neon-green/5' : 'border-red-400 bg-red-400/5'}
                animate-fade-in
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isBuy ? 'bg-neon-green/20 text-neon-green' : 'bg-red-400/20 text-red-400'}
                `}>
                  {isBuy ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {isBuy ? 'Achat' : 'Vente'} - <span className="text-neon-cyan">{t.ticker}</span>
                  </p>
                  <p className="text-xs text-gray-500">{t.shares} @ {formatCurrency(t.price)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{formatCurrency(t.shares * t.price)}</p>
                <p className="text-xs text-gray-500">{new Date(t.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Aucune transaction</p>
          </div>
        )}
      </div>
    </NeonCard>
  );
};

// Main Dashboard View
const DashboardView: React.FC<{ onNavigate: (page: string) => void; }> = ({ onNavigate }) => {
  const { currentUser, currentUserAccount, updateCurrentUserAccount } = useAuth();
  const [marketIndices, setMarketIndices] = useState<MarketIndex[] | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>('AAPL');
  const [refreshedPortfolio, setRefreshedPortfolio] = useState<Portfolio | null>(currentUserAccount?.portfolio ?? null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [levelUpNotification, setLevelUpNotification] = useState<{ oldLevel: string, newLevel: string } | null>(null);
  
  // State for market search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setMarketLoading(true);
        setMarketError(null);
        const overview = await getMarketOverview();
        setMarketIndices(overview);
      } catch (error) {
        setMarketError("Impossible de charger les donnees du marche.");
        console.error(error);
      } finally {
        setMarketLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  useEffect(() => {
    if (!currentUserAccount) {
      setIsPortfolioLoading(false);
      return;
    }

    const refreshPortfolio = async () => {
      setIsPortfolioLoading(true);
      const { holdings, ...restOfPortfolio } = currentUserAccount.portfolio;

      const oldHoldingsValue = holdings.reduce((acc, h) => acc + (h.shares * h.purchasePrice), 0);
      const oldTotalValue = currentUserAccount.portfolio.cash + oldHoldingsValue;
      const oldLevel = getLevel(oldTotalValue);

      if (holdings.length === 0) {
        setRefreshedPortfolio(currentUserAccount.portfolio);
        setIsPortfolioLoading(false);
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
        
        const newPortfolioState = { ...restOfPortfolio, holdings: updatedHoldings };
        setRefreshedPortfolio(newPortfolioState);
        
        const newHoldingsValue = updatedHoldings.reduce((acc, h) => acc + (h.shares * h.currentValue!), 0);
        const newTotalValue = newPortfolioState.cash + newHoldingsValue;
        const newLevel = getLevel(newTotalValue);

        if (newLevel.threshold > oldLevel.threshold) {
          setLevelUpNotification({ oldLevel: oldLevel.name, newLevel: newLevel.name });
        }
      } catch (e) {
        console.error("Failed to refresh portfolio data:", e);
        setRefreshedPortfolio(currentUserAccount.portfolio);
      } finally {
        setIsPortfolioLoading(false);
      }
    };

    refreshPortfolio();
  }, [currentUserAccount]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setSearchAttempted(false);
      return;
    }
    setSearchAttempted(true);
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchStocks(searchTerm.trim());
      setSearchResults(results);
    } catch (err) {
      setSearchError("La recherche d'actions a echoue. Veuillez reessayer.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchResults([]);
    setSearchTerm('');
    setSearchError(null);
    setSearchAttempted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleWatchlist = useCallback((ticker: string, exchange: string) => {
    if (!currentUserAccount) return;
    const newWatchlistItem = { ticker, exchange };
    const isInWatchlist = currentUserAccount.watchlist.some(
      item => item.ticker === ticker && item.exchange === exchange
    );

    const newWatchlist = isInWatchlist
      ? currentUserAccount.watchlist.filter(item => item.ticker !== ticker || item.exchange !== exchange)
      : [...currentUserAccount.watchlist, newWatchlistItem];
        
    updateCurrentUserAccount({ watchlist: newWatchlist });
  }, [currentUserAccount, updateCurrentUserAccount]);

  if (!currentUserAccount) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl skeleton" />
          <p className="text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }
  
  const isSelectedStockWatched = selectedTicker ? currentUserAccount.watchlist.some(item => item.ticker === selectedTicker) : false;
  const userLevel = refreshedPortfolio 
    ? getLevel(refreshedPortfolio.cash + refreshedPortfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0))
    : levels[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Bonjour, <span className="text-glow-cyan text-neon-cyan">{currentUser?.fullName?.split(' ')[0]}</span> !
          </h1>
          <p className="mt-1 text-gray-400">Bienvenue sur votre tableau de bord de simulation.</p>
        </div>
        <NeonBadge variant={userLevel.badge as any} size="md" glow pulse>
          {userLevel.name} - Niveau {levels.indexOf(userLevel) + 1}
        </NeonBadge>
      </div>

      {/* Quick Stats */}
      {(() => {
        const streak = getTradingStreak(currentUserAccount.transactions);
        const totalTrades = currentUserAccount.transactions.length;
        const winRate = currentUserAccount.portfolio.winRate;
        return (
          <div className="grid grid-cols-3 gap-4">
            <NeonCard className="p-4 text-center">
              <div className="text-3xl font-display font-bold text-neon-cyan">{totalTrades}</div>
              <div className="text-xs text-gray-500 mt-1">Trades totaux</div>
            </NeonCard>
            <NeonCard className={`p-4 text-center ${streak >= 3 ? 'border-orange-400/40' : ''}`}>
              <div className={`text-3xl font-display font-bold flex items-center justify-center gap-1 ${streak >= 3 ? 'text-orange-400' : 'text-gray-400'}`}>
                {streak >= 1 && <span>🔥</span>}
                {streak}
              </div>
              <div className="text-xs text-gray-500 mt-1">Jours consécutifs</div>
            </NeonCard>
            <NeonCard className="p-4 text-center">
              <div className="text-3xl font-display font-bold text-neon-green">{winRate || '0%'}</div>
              <div className="text-xs text-gray-500 mt-1">Win Rate</div>
            </NeonCard>
          </div>
        );
      })()}
      
      {/* Search Section */}
      <NeonCard variant="default" className="p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim() === '') {
                  setSearchAttempted(false);
                  setSearchResults([]);
                  setSearchError(null);
                }
              }}
              placeholder="Rechercher une action (ex: 'banques au Nigeria', 'AAPL', 'Sonatel')"
              className="
                w-full bg-dark-700/50 border border-white/10 rounded-xl
                pl-12 pr-4 py-3 text-white placeholder-gray-500
                focus:border-neon-cyan focus:ring-0 focus:outline-none
                focus:shadow-lg focus:shadow-neon-cyan/20
                transition-all duration-300
              "
            />
          </div>
          <NeonButton
            type="submit"
            variant="cyan"
            size="lg"
            loading={isSearching}
            className="sm:w-auto"
          >
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </NeonButton>
        </form>
        
        <div className="mt-6">
          {isSearching ? (
            <SearchResultsSkeleton />
          ) : searchError ? (
            <div className="text-center py-8">
              <p className="text-red-400">{searchError}</p>
            </div>
          ) : searchAttempted ? (
            searchResults.length > 0 ? (
              <SearchResultsTable stocks={searchResults} onSelectStock={handleSelectStock} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucun resultat pour "{searchTerm}"</p>
              </div>
            )
          ) : (
            <MarketOverview indices={marketIndices} isLoading={marketLoading} error={marketError} />
          )}
        </div>
      </NeonCard>
      
      {/* Portfolio Panel */}
      {isPortfolioLoading ? (
        <div className="h-40 skeleton rounded-xl" />
      ) : (
        refreshedPortfolio && <PortfolioPanel portfolio={refreshedPortfolio} />
      )}

      {/* Stock Chart */}
      <StockChartView 
        key={selectedTicker}
        ticker={selectedTicker} 
        onToggleWatchlist={handleToggleWatchlist} 
        isWatched={isSelectedStockWatched}
      />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Holdings */}
        <div className="lg:col-span-2">
          <NeonCard variant="default" className="p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-neon-magenta/10 border border-neon-magenta/30">
                <BriefcaseIcon className="w-5 h-5 text-neon-magenta" />
              </div>
              Vos Actifs
            </h3>
            {isPortfolioLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            ) : (
              <HoldingsTable holdings={refreshedPortfolio?.holdings || []} />
            )}
          </NeonCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <ActivityFeed />
          <WatchlistPanel 
            watchlist={currentUserAccount.watchlist} 
            onToggleWatchlist={handleToggleWatchlist}
            onSelectStock={handleSelectStock}
          />
          <TransactionHistory transactions={currentUserAccount.transactions} />
        </div>
      </div>

      {/* Level Up Notification */}
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {levelUpNotification && (
            <LevelUpNotification 
              levelInfo={levelUpNotification} 
              onClose={() => setLevelUpNotification(null)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
