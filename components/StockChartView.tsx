import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getHistoricalStockData, getPostTradeFeedback } from '../services/geminiService';
import type { StockData, HistoricalPricePoint, Transaction, TradeFeedback } from '../types';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import { StarIcon, ArrowUpIcon, ArrowDownIcon, ChartTrendingUpIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';

interface StockChartViewProps {
  ticker: string | null;
  onToggleWatchlist: (ticker: string, exchange: string) => void;
  isWatched: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const COMMISSION_RATE = 0.001;
const SLIPPAGE_RATE = 0.0005;

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-neon-green', bg: 'bg-neon-green/20 border-neon-green/40', label: 'Excellent' },
  B: { color: 'text-cyan-400', bg: 'bg-cyan-400/20 border-cyan-400/40', label: 'Bon' },
  C: { color: 'text-yellow-400', bg: 'bg-yellow-400/20 border-yellow-400/40', label: 'Moyen' },
  D: { color: 'text-orange-400', bg: 'bg-orange-400/20 border-orange-400/40', label: 'Passable' },
  F: { color: 'text-red-400', bg: 'bg-red-400/20 border-red-400/40', label: 'À revoir' },
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-neon-cyan/30">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-bold text-neon-cyan">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const FeedbackModal: React.FC<{ feedback: TradeFeedback; onClose: () => void; tradeInfo: string }> = ({ feedback, onClose, tradeInfo }) => {
  const grade = GRADE_CONFIG[feedback.grade] ?? GRADE_CONFIG['C'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-slide-down">
        <NeonCard variant="violet" glow className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-neon-violet" />
              <h3 className="text-xl font-bold text-white">Feedback IA Post-Trade</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">{tradeInfo}</p>

          <div className={`flex items-center gap-4 p-4 rounded-xl border mb-5 ${grade.bg}`}>
            <div className={`text-5xl font-black ${grade.color}`}>{feedback.grade}</div>
            <div>
              <p className={`text-lg font-bold ${grade.color}`}>{grade.label}</p>
              <p className="text-sm text-gray-300">{feedback.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-neon-green mb-2 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" /> Points forts
              </h4>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                    <span className="text-neon-green mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" /> À améliorer
              </h4>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                    <span className="text-yellow-400 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neon-violet/10 border border-neon-violet/30">
            <p className="text-xs font-semibold text-neon-violet mb-1">💡 Conseil du mentor</p>
            <p className="text-sm text-gray-300">{feedback.advice}</p>
          </div>

          <NeonButton variant="violet" fullWidth className="mt-5" onClick={onClose}>
            Compris !
          </NeonButton>
        </NeonCard>
      </div>
    </div>
  );
};

const StockChartView: React.FC<StockChartViewProps> = ({ ticker, onToggleWatchlist, isWatched }) => {
  const { currentUserAccount, updateCurrentUserAccount } = useAuth();

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop-loss' | 'take-profit'>('market');
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [tradeStatus, setTradeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTrading, setIsTrading] = useState(false);

  const [feedback, setFeedback] = useState<TradeFeedback | null>(null);
  const [feedbackTradeInfo, setFeedbackTradeInfo] = useState('');
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!ticker) {
      setStockData(null);
      setHistoricalData([]);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setTradeStatus(null);
      try {
        const [stock, history] = await Promise.all([
          getStockData(ticker),
          getHistoricalStockData(ticker)
        ]);
        setStockData(stock);
        setHistoricalData(history);
      } catch (err) {
        setError(`Impossible de charger les données pour ${ticker}. Veuillez réessayer.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  const getExecutionPrice = (): number => {
    if (!stockData) return 0;
    const marketPrice = stockData.price;
    if (orderType === 'market') {
      const slip = marketPrice * SLIPPAGE_RATE;
      return tradeType === 'buy' ? marketPrice + slip : marketPrice - slip;
    }
    const parsed = parseFloat(limitPrice);
    return isNaN(parsed) ? marketPrice : parsed;
  };

  const execPrice = getExecutionPrice();
  const numSharesNum = parseInt(shares, 10) || 0;
  const commission = numSharesNum * execPrice * COMMISSION_RATE;
  const grossCost = numSharesNum * execPrice;
  const totalWithFees = tradeType === 'buy' ? grossCost + commission : grossCost - commission;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserAccount || !stockData) return;

    const numShares = parseInt(shares, 10);
    if (isNaN(numShares) || numShares <= 0) {
      setTradeStatus({ type: 'error', message: "Veuillez entrer un nombre d'actions valide." });
      return;
    }

    if (orderType !== 'market') {
      const parsed = parseFloat(limitPrice);
      if (isNaN(parsed) || parsed <= 0) {
        setTradeStatus({ type: 'error', message: "Veuillez entrer un prix valide pour l'ordre." });
        return;
      }
    }

    const executionPrice = getExecutionPrice();
    const comm = numShares * executionPrice * COMMISSION_RATE;
    const transactionCost = numShares * executionPrice;
    const netCost = tradeType === 'buy' ? transactionCost + comm : transactionCost - comm;

    let { cash, holdings } = currentUserAccount.portfolio;

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      type: tradeType,
      ticker: stockData.ticker,
      exchange: stockData.exchange,
      companyName: stockData.companyName,
      shares: numShares,
      price: executionPrice,
      timestamp: Date.now(),
    };

    if (tradeType === 'buy') {
      if (cash < netCost) {
        setTradeStatus({ type: 'error', message: `Fonds insuffisants. Nécessaire : ${formatCurrency(netCost)} (frais inclus), Disponible : ${formatCurrency(cash)}` });
        return;
      }
      cash -= netCost;
      const existingIdx = holdings.findIndex(h => h.ticker === stockData.ticker && h.exchange === stockData.exchange);
      if (existingIdx > -1) {
        const existing = holdings[existingIdx];
        const newTotalShares = existing.shares + numShares;
        const newAvgPrice = ((existing.purchasePrice * existing.shares) + transactionCost) / newTotalShares;
        holdings[existingIdx] = { ...existing, shares: newTotalShares, purchasePrice: newAvgPrice, currentValue: executionPrice };
      } else {
        holdings.push({
          ticker: stockData.ticker,
          exchange: stockData.exchange,
          companyName: stockData.companyName,
          shares: numShares,
          purchasePrice: executionPrice,
          currentValue: executionPrice,
        });
      }
    } else {
      const existingHolding = holdings.find(h => h.ticker === stockData.ticker && h.exchange === stockData.exchange);
      if (!existingHolding || existingHolding.shares < numShares) {
        setTradeStatus({ type: 'error', message: `Vous n'avez pas assez d'actions à vendre. Vous détenez : ${existingHolding?.shares ?? 0}` });
        return;
      }
      cash += netCost;
      existingHolding.shares -= numShares;
      if (existingHolding.shares === 0) {
        holdings = holdings.filter(h => h.ticker !== stockData.ticker || h.exchange !== stockData.exchange);
      }
    }

    setIsTrading(true);
    try {
      await updateCurrentUserAccount({
        portfolio: { ...currentUserAccount.portfolio, cash, holdings },
        transactions: [...currentUserAccount.transactions, newTransaction]
      });

      const orderLabel = { market: 'Marché', limit: 'Limite', 'stop-loss': 'Stop-Loss', 'take-profit': 'Take-Profit' }[orderType];
      const slippageNote = orderType === 'market' ? ` (slippage: ${(SLIPPAGE_RATE * 100).toFixed(2)}%)` : '';
      setTradeStatus({
        type: 'success',
        message: `✅ Ordre ${orderLabel} exécuté — ${tradeType === 'buy' ? 'Achat' : 'Vente'} ${numShares}× ${stockData.ticker} @ ${formatCurrency(executionPrice)}${slippageNote}. Frais : ${formatCurrency(comm)}`
      });
      setShares('');
      setLimitPrice('');

      const portfolioValue = cash + holdings.reduce((acc, h) => acc + h.shares * (h.currentValue ?? h.purchasePrice), 0);
      const tradeInfoStr = `${tradeType === 'buy' ? 'Achat' : 'Vente'} de ${numShares} ${stockData.ticker} @ ${formatCurrency(executionPrice)} (ordre ${orderLabel})`;
      setFeedbackTradeInfo(tradeInfoStr);
      setIsFetchingFeedback(true);
      try {
        const fb = await getPostTradeFeedback(
          tradeType, stockData.ticker, numShares, executionPrice, orderLabel,
          cash, portfolioValue, stockData.recommendation, stockData.confidenceScore
        );
        setFeedback(fb as TradeFeedback);
      } catch { } finally {
        setIsFetchingFeedback(false);
      }

    } catch (err) {
      setTradeStatus({ type: 'error', message: `La transaction a échoué : ${err instanceof Error ? err.message : 'Erreur inconnue'}` });
    } finally {
      setIsTrading(false);
    }
  };

  if (!ticker) {
    return (
      <NeonCard variant="default" className="p-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-white/5 border border-white/10 mb-6">
            <ChartTrendingUpIcon className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">Sélectionnez une action de votre liste</p>
          <p className="text-gray-500 text-sm mt-2">ou recherchez-en une pour voir les détails</p>
        </div>
      </NeonCard>
    );
  }

  if (isLoading) {
    return (
      <NeonCard variant="default" className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 skeleton rounded" />
              <div className="h-4 w-32 skeleton rounded" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-8 w-32 skeleton rounded ml-auto" />
              <div className="h-4 w-20 skeleton rounded ml-auto" />
            </div>
          </div>
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </NeonCard>
    );
  }

  if (error) {
    return (
      <NeonCard variant="default" className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">{error}</div>
      </NeonCard>
    );
  }

  if (!stockData) return null;

  const isPositive = stockData.change >= 0;
  const holding = currentUserAccount?.portfolio.holdings.find(h => h.ticker === stockData.ticker);

  const orderLabels: Record<string, string> = { market: 'Marché', limit: 'Limite', 'stop-loss': 'Stop-Loss', 'take-profit': 'Take-Profit' };
  const orderDescriptions: Record<string, string> = {
    market: 'Exécution immédiate au prix du marché (slippage appliqué).',
    limit: tradeType === 'buy' ? 'Achat exécuté au prix cible ou inférieur.' : 'Vente exécutée au prix cible ou supérieur.',
    'stop-loss': 'Vente automatique si le cours tombe sous le seuil fixé.',
    'take-profit': 'Vente automatique lorsque le cours atteint votre objectif de gain.',
  };

  return (
    <>
      {feedback && (
        <FeedbackModal feedback={feedback} tradeInfo={feedbackTradeInfo} onClose={() => setFeedback(null)} />
      )}

      <NeonCard variant={isPositive ? 'green' : 'default'} glow={isPositive} className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white">{stockData.companyName}</h2>
              <NeonBadge variant="cyan" size="sm">{stockData.ticker}</NeonBadge>
            </div>
            <p className="text-gray-400">{stockData.exchange}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-2xl md:text-3xl font-bold font-display ${isPositive ? 'text-neon-green text-glow-green' : 'text-red-400'}`}>
                {formatCurrency(stockData.price)}
              </p>
              <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                <span>{isPositive ? '+' : ''}{stockData.change.toFixed(2)}</span>
                <span>({stockData.percentChange})</span>
              </div>
            </div>
            <button
              onClick={() => onToggleWatchlist(stockData.ticker, stockData.exchange)}
              className={`
                p-3 rounded-xl border transition-all duration-300
                ${isWatched
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30'
                }
              `}
              title={isWatched ? "Retirer de la liste" : "Ajouter à la liste"}
            >
              <StarIcon className="w-5 h-5" fill={isWatched ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="h-64 md:h-80 mb-6 rounded-xl bg-dark-800/50 p-4 border border-white/5">
          {isClient && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#00FF88' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? '#00FF88' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" domain={['auto', 'auto']} fontSize={11} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="price" stroke={isPositive ? '#00FF88' : '#ef4444'} strokeWidth={2} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-neon-violet" /> Résumé IA
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">{stockData.summary}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Volume</p>
                <p className="text-sm font-semibold text-white">{stockData.volume}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Recommandation</p>
                <p className="text-sm font-semibold text-neon-cyan">{stockData.recommendation}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Confiance IA</p>
                <p className="text-sm font-semibold text-neon-green">{stockData.confidenceScore}%</p>
              </div>
              {holding && (
                <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
                  <p className="text-xs text-gray-500 mb-1">Vous détenez</p>
                  <p className="text-sm font-semibold text-neon-cyan">{holding.shares} actions</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-bold text-white mb-4">Passer un Ordre</h4>
            <form onSubmit={handleTrade} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-700/50">
                <button type="button" onClick={() => setTradeType('buy')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${tradeType === 'buy' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-lg shadow-neon-green/20' : 'text-gray-400 hover:text-white'}`}>
                  Acheter
                </button>
                <button type="button" onClick={() => setTradeType('sell')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${tradeType === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'}`}>
                  Vendre
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type d'ordre</label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-dark-700/50">
                  {(['market', 'limit', 'stop-loss', 'take-profit'] as const).map(ot => (
                    <button key={ot} type="button"
                      onClick={() => { setOrderType(ot); setLimitPrice(''); }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${orderType === ot ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'text-gray-400 hover:text-white'}`}>
                      {orderLabels[ot]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{orderDescriptions[orderType]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Quantité</label>
                <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} min="1"
                  placeholder="Nombre d'actions" required
                  className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-all duration-300" />
              </div>

              {orderType !== 'market' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {orderType === 'limit' ? 'Prix limite ($)' : orderType === 'stop-loss' ? 'Prix stop-loss ($)' : 'Prix take-profit ($)'}
                  </label>
                  <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
                    step="0.01" min="0.01" placeholder={`Actuel: $${stockData.price.toFixed(2)}`} required
                    className="w-full bg-dark-700/50 border border-neon-cyan/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-all duration-300" />
                </div>
              )}

              <div className="p-3 rounded-xl bg-dark-800/50 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Coût brut</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(grossCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Frais (0.1%)</span>
                  <span className="text-xs text-orange-400">{formatCurrency(commission)}</span>
                </div>
                {orderType === 'market' && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Slippage (0.05%)</span>
                    <span className="text-xs text-yellow-400">{formatCurrency(numSharesNum * stockData.price * SLIPPAGE_RATE)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-white/10">
                  <span className="text-sm font-bold text-gray-300">Total estimé</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(totalWithFees)}</span>
                </div>
              </div>

              {tradeStatus && (
                <div className={`p-3 rounded-xl text-sm ${tradeStatus.type === 'success' ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {tradeStatus.message}
                </div>
              )}

              {isFetchingFeedback && (
                <div className="p-3 rounded-xl bg-neon-violet/10 border border-neon-violet/30 text-neon-violet text-xs flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 animate-pulse" />
                  Analyse IA du trade en cours...
                </div>
              )}

              <NeonButton type="submit" variant={tradeType === 'buy' ? 'green' : 'orange'} size="lg" fullWidth loading={isTrading}>
                {tradeType === 'buy' ? 'Acheter' : 'Vendre'} {shares || 0} actions
              </NeonButton>
            </form>
          </div>
        </div>
      </NeonCard>
    </>
  );
};

export default StockChartView;
