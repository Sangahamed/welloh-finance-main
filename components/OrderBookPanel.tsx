import React, { useState, useEffect } from 'react';
import { getBetsForPrediction } from '../lib/database';
import type { Prediction, Bet } from '../types';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import { ChartBarIcon, ClockIcon } from './icons/Icons';

interface OrderBookPanelProps {
    prediction: Prediction;
    onClose: () => void;
}

interface OrderEntry {
    optionId: string;
    optionLabel: string;
    totalAmount: number;
    count: number;
    percentage: number;
    bets: Bet[];
}

const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ prediction, onClose }) => {
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBets = async () => {
            setIsLoading(true);
            const data = await getBetsForPrediction(prediction.id);
            setBets(data);
            setIsLoading(false);
        };
        fetchBets();
    }, [prediction.id]);

    // Build order book entries grouped by option
    const orderBook: OrderEntry[] = prediction.options.map(opt => {
        const optBets = bets.filter(b => b.optionId === opt.id);
        const totalAmount = optBets.reduce((s, b) => s + b.amount, 0);
        const grandTotal = bets.reduce((s, b) => s + b.amount, 0) || 1;
        return {
            optionId: opt.id,
            optionLabel: opt.label,
            totalAmount,
            count: optBets.length,
            percentage: Math.round((totalAmount / grandTotal) * 100),
            bets: optBets,
        };
    });

    const grandTotal = bets.reduce((s, b) => s + b.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <NeonCard variant="cyan" className="p-0 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-neon-cyan" />
                                <h2 className="text-lg font-bold text-white">Carnet d&apos;ordres</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{prediction.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{prediction.participantsCount} participants</span>
                            <span>•</span>
                            <span>Pool total: {prediction.totalPool} pts</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 skeleton rounded-xl" />
                                ))}
                            </div>
                        ) : bets.length === 0 ? (
                            <div className="text-center py-12">
                                <ChartBarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500">Aucun pari pour cette prédiction.</p>
                                <p className="text-gray-600 text-sm mt-1">Soyez le premier à participer !</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary bar */}
                                <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
                                    {orderBook.map((entry, i) => {
                                        const colors = [
                                            'bg-neon-cyan',
                                            'bg-neon-magenta',
                                            'bg-neon-green',
                                            'bg-neon-violet',
                                        ];
                                        return (
                                            <div
                                                key={entry.optionId}
                                                className={`${colors[i % colors.length]} transition-all duration-700`}
                                                style={{ width: `${entry.percentage}%` }}
                                                title={`${entry.optionLabel}: ${entry.percentage}%`}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Option breakdown */}
                                {orderBook.map((entry, i) => {
                                    const colors = ['text-neon-cyan', 'text-neon-magenta', 'text-neon-green', 'text-neon-violet'];
                                    const bgColors = ['bg-neon-cyan/10', 'bg-neon-magenta/10', 'bg-neon-green/10', 'bg-neon-violet/10'];
                                    const borderColors = ['border-neon-cyan/20', 'border-neon-magenta/20', 'border-neon-green/20', 'border-neon-violet/20'];
                                    const isResolved = prediction.resolvedOptionId === entry.optionId;
                                    
                                    return (
                                        <div 
                                            key={entry.optionId} 
                                            className={`rounded-xl border ${borderColors[i % borderColors.length]} ${bgColors[i % bgColors.length]} p-4`}
                                        >
                                            {/* Option header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${colors[i % colors.length]}`}>
                                                        {entry.optionLabel}
                                                    </span>
                                                    {isResolved && (
                                                        <NeonBadge variant="green" size="sm">✓ Gagnant</NeonBadge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-gray-400">
                                                        {entry.count} pari{entry.count !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className={`font-bold ${colors[i % colors.length]}`}>
                                                        {entry.totalAmount} pts ({entry.percentage}%)
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Individual bets list */}
                                            {entry.bets.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {entry.bets.slice(0, 10).map(bet => (
                                                        <div 
                                                            key={bet.id} 
                                                            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white/5"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-[10px] font-bold text-dark-900">
                                                                    ?
                                                                </div>
                                                                <span className="text-gray-400">
                                                                    {bet.userId.slice(0, 8)}...
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-white font-semibold">{bet.amount} pts</span>
                                                                <span className="text-gray-600 flex items-center gap-1">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {new Date(bet.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {entry.bets.length > 10 && (
                                                        <p className="text-xs text-gray-500 text-center pt-1">
                                                            +{entry.bets.length - 10} autres paris
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Grand total */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-sm">
                                    <span className="text-gray-400">Volume total</span>
                                    <span className="font-bold text-white">{grandTotal} points • {bets.length} paris</span>
                                </div>
                            </div>
                        )}
                    </div>
                </NeonCard>
            </div>
        </div>
    );
};

export default OrderBookPanel;
