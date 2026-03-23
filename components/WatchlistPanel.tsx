import React, { useState, useEffect } from 'react';
import { getStockData } from '../services/geminiService';
import { StockData, WatchlistItem } from '../types';
import { ChartTrendingUpIcon, StarIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';

interface WatchlistPanelProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (ticker: string, exchange: string) => void;
  onSelectStock: (ticker: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ watchlist, onToggleWatchlist, onSelectStock }) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (watchlist.length === 0) {
        setStocks([]);
        return;
      }
      setIsLoading(true);
      const stockPromises = watchlist.map(item => getStockData(item.ticker).catch(() => null));
      const results = await Promise.all(stockPromises);
      setStocks(results.filter((stock): stock is StockData => stock !== null));
      setIsLoading(false);
    };

    fetchWatchlistData();
  }, [watchlist]);

  return (
    <NeonCard variant="default" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
            <StarIcon className="w-5 h-5 text-yellow-400" fill="currentColor" />
          </div>
          Watchlist
        </h3>
        <NeonBadge variant="orange" size="xs">{watchlist.length}</NeonBadge>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {/* Loading state */}
        {isLoading && watchlist.length > 0 && (
          <div className="space-y-2">
            {[...Array(watchlist.length)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        )}

        {/* Stock list */}
        {!isLoading && stocks.length > 0 && stocks.map((stock, index) => {
          const isPositive = stock.change >= 0;
          return (
            <div 
              key={`${stock.ticker}-${stock.exchange}`} 
              className="
                group flex items-center justify-between p-3 rounded-xl
                bg-white/5 border border-white/5
                hover:bg-white/10 hover:border-neon-cyan/20
                transition-all duration-300 cursor-pointer
                animate-fade-in
              "
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onSelectStock(stock.ticker)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neon-cyan group-hover:text-glow-cyan transition-all">
                  {stock.ticker}
                </p>
                <p className="text-xs text-gray-500 truncate">{stock.companyName}</p>
              </div>

              <div className="text-right mx-3">
                <p className="font-semibold text-white">{formatCurrency(stock.price)}</p>
                <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
                  {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                  <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(stock.ticker, stock.exchange);
                }}
                className="
                  p-2 rounded-lg text-yellow-400
                  hover:bg-yellow-400/20 hover:text-yellow-300
                  transition-all duration-300
                "
                title="Retirer de la liste"
              >
                <StarIcon className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
          );
        })}

        {/* Empty state */}
        {!isLoading && watchlist.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
              <StarIcon className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">Watchlist vide</p>
            <p className="text-gray-500 text-xs mt-1">Ajoutez des actions depuis le graphique</p>
          </div>
        )}
      </div>
    </NeonCard>
  );
};

export default WatchlistPanel;
