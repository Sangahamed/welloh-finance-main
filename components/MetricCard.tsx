import React from 'react';
import type { Metric } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from './icons/Icons';

interface MetricCardProps {
  metric: Metric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const { label, value, change, changeType, tooltip } = metric;

  const renderChangeIcon = () => {
    if (changeType === 'positive') return <ArrowUpIcon />;
    if (changeType === 'negative') return <ArrowDownIcon />;
    if (changeType === 'neutral') return <ArrowRightIcon />;
    return null;
  };

  const changeColorClass = {
    positive: 'text-neon-green',
    negative: 'text-red-400',
    neutral: 'text-gray-500',
  }[changeType || 'neutral'];

  return (
    <div className="bg-dark-700/50 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all group relative cursor-help shadow-lg" title={tooltip}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-white mb-2 font-display">{value}</div>
      {change && (
        <div className={`flex items-center text-sm font-semibold ${changeColorClass}`}>
          <span className="w-4 h-4 flex-shrink-0">{renderChangeIcon()}</span>
          <span className="ml-1">{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;