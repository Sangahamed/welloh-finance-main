import React from 'react';
import type { MarketIndex } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ChartTrendingUpIcon } from './icons/Icons';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';

interface MarketOverviewProps {
  indices: MarketIndex[] | null;
  isLoading: boolean;
  error: string | null;
}

const IndexCard: React.FC<{ index: MarketIndex; delay: number }> = ({ index, delay }) => {
  const { name, value, change, percentChange, changeType } = index;
  
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div 
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <NeonCard 
        variant={isPositive ? 'green' : isNegative ? 'default' : 'default'}
        className="p-4 h-full"
        hover
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-400 truncate pr-2">{name}</h4>
          {changeType !== 'neutral' && (
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
              ${isPositive ? 'bg-neon-green/20' : 'bg-red-500/20'}
            `}>
              {isPositive ? (
                <ArrowUpIcon className="w-3 h-3 text-neon-green" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-400" />
              )}
            </div>
          )}
        </div>
        
        <p className="text-xl lg:text-2xl font-bold text-white mb-2 font-display">
          {value}
        </p>
        
        <div className={`
          flex items-center gap-1 text-sm font-semibold
          ${isPositive ? 'text-neon-green' : isNegative ? 'text-red-400' : 'text-gray-500'}
        `}>
          <span>{change}</span>
          <span className="text-xs opacity-75">({percentChange})</span>
        </div>
      </NeonCard>
    </div>
  );
};

const SkeletonCard: React.FC<{ delay: number }> = ({ delay }) => (
  <div 
    className="rounded-xl p-4 h-28 skeleton"
    style={{ animationDelay: `${delay}ms` }}
  />
);

const MarketOverview: React.FC<MarketOverviewProps> = ({ indices, isLoading, error }) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
          <ChartTrendingUpIcon className="w-5 h-5 text-neon-cyan" />
        </div>
        <h2 className="text-xl font-bold text-white">Apercu du Marche</h2>
        <NeonBadge variant="cyan" size="xs">En direct</NeonBadge>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 animate-fade-in">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => <SkeletonCard key={i} delay={i * 100} />)
        ) : (
          indices?.map((index, i) => (
            <IndexCard key={index.name} index={index} delay={i * 100} />
          ))
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
