import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPredictions, createPrediction, placeBet, getUserBets, resolvePrediction } from '../lib/database';
import { generatePredictionIdeas } from '../services/geminiService';
import type { Prediction, Bet, PredictionOption } from '../types';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import AnimatedBackground from './ui/AnimatedBackground';
import OrderBookPanel from './OrderBookPanel';
import { SparklesIcon, ChartBarIcon, GlobeAltIcon, BoltIcon, StarIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, ChatBubbleLeftEllipsisIcon, XMarkIcon } from './icons/Icons';
import PredictionChat from './PredictionChat';

const CATEGORIES = [
    { id: 'all', label: 'Tous', icon: StarIcon },
    { id: 'stocks', label: 'Actions', icon: ChartBarIcon },
    { id: 'crypto', label: 'Crypto', icon: BoltIcon },
    { id: 'macro', label: 'Macro', icon: GlobeAltIcon },
    { id: 'africa', label: 'Afrique', icon: SparklesIcon },
    { id: 'other', label: 'Autre', icon: ClockIcon },
] as const;

const CATEGORY_COLORS: Record<string, 'cyan' | 'green' | 'violet' | 'magenta' | 'orange'> = {
    stocks: 'cyan',
    crypto: 'violet',
    macro: 'green',
    africa: 'orange',
    other: 'magenta',
};

type NeonCardVariant = 'default' | 'cyan' | 'magenta' | 'violet' | 'green' | 'gradient';
type NeonBadgeVariant = 'cyan' | 'magenta' | 'violet' | 'green' | 'orange';

function toCardVariant(color: string): NeonCardVariant {
    const map: Record<string, NeonCardVariant> = { cyan: 'cyan', violet: 'violet', green: 'green', magenta: 'magenta', orange: 'magenta' };
    return map[color] ?? 'default';
}

function toBadgeVariant(color: string): NeonBadgeVariant {
    const map: Record<string, NeonBadgeVariant> = { cyan: 'cyan', violet: 'violet', green: 'green', magenta: 'magenta', orange: 'orange' };
    return map[color] ?? 'cyan';
}

const STATUS_CONFIG = {
    pending: { label: 'En attente', color: 'orange' as const },
    active: { label: 'En cours', color: 'green' as const },
    resolved: { label: 'Résolue', color: 'cyan' as const },
    expired: { label: 'Expirée', color: 'magenta' as const },
    rejected: { label: 'Refusée', color: 'magenta' as const },
};

function daysLeft(expiresAt: string): number {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Prediction Card ──────────────────────────────────────────────────────────
const PredictionCard: React.FC<{
    prediction: Prediction;
    userBet: Bet | undefined;
    onBet: (prediction: Prediction) => void;
    currentUserId?: string;
    onResolve?: (prediction: Prediction) => void;
    onOpenOrderBook?: (prediction: Prediction) => void;
    onUpdateStatus?: (predictionId: string, status: 'active' | 'rejected') => void;
    isAdmin?: boolean;
    onChat?: (prediction: Prediction) => void;
}> = ({ prediction, userBet, onBet, currentUserId, onResolve, onOpenOrderBook, onUpdateStatus, isAdmin, onChat }) => {
    const catColor = CATEGORY_COLORS[prediction.category] ?? 'cyan';
    const status = STATUS_CONFIG[prediction.status];
    const days = daysLeft(prediction.expiresAt);
    const totalVotes = prediction.options.reduce((s, o) => s + o.probability, 0) || 1;

    return (
        <NeonCard
            variant={toCardVariant(catColor)}
            className="p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
            onClick={() => prediction.status === 'active' && !userBet && onBet(prediction)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <NeonBadge variant={toBadgeVariant(catColor)} size="sm">
                            {CATEGORIES.find(c => c.id === prediction.category)?.label ?? prediction.category}
                        </NeonBadge>
                        <NeonBadge variant={toBadgeVariant(status.color)} size="sm">
                            {status.label}
                        </NeonBadge>
                    </div>
                    <h3 className="font-bold text-white text-base leading-tight">{prediction.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{prediction.description}</p>
                </div>
            </div>

            {/* Options bars */}
            <div className="space-y-2">
                {prediction.options.map(opt => {
                    const pct = totalVotes > 0 ? Math.round((opt.probability / totalVotes) * 100) : 0;
                    const isChosen = userBet?.optionId === opt.id;
                    const isResolved = prediction.resolvedOptionId === opt.id;
                    return (
                        <div key={opt.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className={`font-medium ${isChosen ? 'text-neon-cyan' : isResolved ? 'text-neon-green' : 'text-gray-300'}`}>
                                    {opt.label}
                                    {isChosen && <span className="ml-1 text-xs text-neon-cyan">(votre pari)</span>}
                                    {isResolved && <span className="ml-1 text-xs text-neon-green"> ✓</span>}
                                </span>
                                <span className="text-gray-400 font-mono">{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: isResolved
                                            ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                                            : isChosen
                                            ? 'linear-gradient(90deg, #00E5FF, #0088CC)'
                                            : 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <span>Par {prediction.creatorName}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenOrderBook?.(prediction); }}
                        className="flex items-center gap-1 text-neon-cyan/70 hover:text-neon-cyan transition-colors ml-2"
                        title="Voir le carnet d'ordres"
                    >
                        <ChartBarIcon className="w-3.5 h-3.5" />
                        Carnet
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onChat?.(prediction); }}
                        className="flex items-center gap-1 text-neon-violet hover:text-white transition-all mr-2 group"
                    >
                        <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Discussion</span>
                    </button>
                    <span>{prediction.participantsCount} participants</span>
                    {prediction.status === 'active' && (
                        <span className={days <= 3 ? 'text-orange-400 font-semibold' : ''}>
                            {days}j restants
                        </span>
                    )}
                    {prediction.status !== 'active' && (
                        <span>{formatDate(prediction.expiresAt)}</span>
                    )}
                </div>
            </div>

            {/* CTA */}
            {prediction.status === 'active' && !userBet && (
                <NeonButton variant="cyan" size="sm" fullWidth onClick={(e) => { e.stopPropagation(); onBet(prediction); }}>
                    Participer
                </NeonButton>
            )}
            {userBet && (
                <div className="flex items-center gap-2 text-sm text-neon-cyan">
                    <CheckCircleIcon className="w-4 h-4" />
                    Vous avez parié {userBet.amount} pts sur «{prediction.options.find(o => o.id === userBet.optionId)?.label}»
                </div>
            )}
            {prediction.status === 'active' && currentUserId === prediction.creatorId && onResolve && (
                <NeonButton
                    variant="green"
                    size="sm"
                    fullWidth
                    onClick={(e) => { e.stopPropagation(); onResolve(prediction); }}
                >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Résoudre (créateur)
                </NeonButton>
            )}

            {/* Admin Actions for Pending predictions */}
            {isAdmin && prediction.status === 'pending' && onUpdateStatus && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                    <NeonButton 
                        variant="green" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onUpdateStatus(prediction.id, 'active')}
                    >
                        Approuver
                    </NeonButton>
                    <NeonButton 
                        variant="magenta" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onUpdateStatus(prediction.id, 'rejected')}
                    >
                        Refuser
                    </NeonButton>
                </div>
            )}
        </NeonCard>
    );
};

// ─── Bet Modal ────────────────────────────────────────────────────────────────
const BetModal: React.FC<{
    prediction: Prediction;
    onClose: () => void;
    onConfirm: (optionId: string, amount: number) => Promise<void>;
}> = ({ prediction, onClose, onConfirm }) => {
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [amount, setAmount] = useState('50');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOption) { setError("Choisissez une option."); return; }
        const amt = parseInt(amount);
        if (isNaN(amt) || amt < 10) { setError("Montant minimum : 10 points."); return; }
        setIsLoading(true);
        setError(null);
        try {
            await onConfirm(selectedOption, amt);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du pari.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <NeonCard variant="cyan" className="p-6">
                    <h2 className="text-xl font-bold text-white mb-2">Placer un pari</h2>
                    <p className="text-gray-400 text-sm mb-5 line-clamp-2">{prediction.title}</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Votre pronostic</label>
                            <div className="space-y-2">
                                {prediction.options.map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSelectedOption(opt.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                            selectedOption === opt.id
                                                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                                                : 'border-white/10 text-gray-300 hover:border-white/30'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Mise (points)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min="10"
                                max="1000"
                                className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan focus:outline-none transition-all"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <NeonButton variant="ghost" size="md" onClick={onClose} type="button">Annuler</NeonButton>
                            <NeonButton variant="cyan" size="md" type="submit" loading={isLoading}>Confirmer</NeonButton>
                        </div>
                    </form>
                </NeonCard>
            </div>
        </div>
    );
};

// ─── Resolve Prediction Modal ─────────────────────────────────────────────────
const ResolveModal: React.FC<{
    prediction: Prediction;
    onClose: () => void;
    onResolve: (predictionId: string, optionId: string) => Promise<void>;
}> = ({ prediction, onClose, onResolve }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOption) { setError("Sélectionnez l'option gagnante."); return; }
        setIsLoading(true);
        setError(null);
        try {
            await onResolve(prediction.id, selectedOption);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la résolution.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <NeonCard variant="green" className="p-6">
                    <h2 className="text-xl font-bold text-white mb-1">Résoudre la prédiction</h2>
                    <p className="text-gray-400 text-sm mb-5 line-clamp-2">{prediction.title}</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Option gagnante</label>
                            <div className="space-y-2">
                                {prediction.options.map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSelectedOption(opt.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                            selectedOption === opt.id
                                                ? 'border-neon-green bg-neon-green/10 text-neon-green'
                                                : 'border-white/10 text-gray-300 hover:border-white/30'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <NeonButton variant="ghost" size="md" onClick={onClose} type="button">Annuler</NeonButton>
                            <NeonButton variant="green" size="md" type="submit" loading={isLoading}>
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Confirmer
                            </NeonButton>
                        </div>
                    </form>
                </NeonCard>
            </div>
        </div>
    );
};

// ─── Create Prediction Modal ──────────────────────────────────────────────────
const CreatePredictionModal: React.FC<{
    onClose: () => void;
    onCreate: (payload: Omit<Prediction, 'id' | 'creatorId' | 'creatorName' | 'status' | 'totalPool' | 'createdAt' | 'participantsCount' | 'resolvedOptionId'>) => Promise<void>;
}> = ({ onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Prediction['category']>('stocks');
    const [options, setOptions] = useState(['Oui', 'Non']);
    const [expiresAt, setExpiresAt] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [analysisProof, setAnalysisProof] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateIdea = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const ideas = await generatePredictionIdeas(category);
            if (ideas && ideas.length > 0) {
                const idea = ideas[0];
                setTitle(idea.title);
                setDescription(idea.description);
                setOptions(idea.options.length >= 2 ? idea.options : ['Oui', 'Non']);
                setAnalysisProof(idea.analysisRationale);
            }
        } catch {
            setError("Impossible de générer une idée. Vérifiez votre clé API Gemini.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError("Le titre est requis."); return; }
        if (options.filter(o => o.trim()).length < 2) { setError("Au moins 2 options sont requises."); return; }
        if (!analysisProof.trim()) { setError("La preuve d'analyse est requise."); return; }
        setIsLoading(true);
        setError(null);
        try {
            const cleanedOptions: PredictionOption[] = options
                .filter(o => o.trim())
                .map((label, i) => ({ id: `opt_${i}`, label: label.trim(), probability: Math.floor(100 / options.filter(o => o.trim()).length) }));

            await onCreate({
                title: title.trim(),
                description: description.trim(),
                category,
                options: cleanedOptions,
                expiresAt: new Date(expiresAt).toISOString(),
                analysisProof: analysisProof.trim(),
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la création.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
            <div className="w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
                <NeonCard variant="violet" className="p-6">
                    <h2 className="text-xl font-bold text-white mb-1">Créer une prédiction</h2>
                    <p className="text-gray-400 text-sm mb-5">Partagez votre analyse et défiez la communauté.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Catégorie</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id as Prediction['category'])}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            category === cat.id
                                                ? 'bg-neon-violet/20 border border-neon-violet/50 text-neon-violet'
                                                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <NeonButton
                                variant="violet"
                                size="sm"
                                type="button"
                                onClick={handleGenerateIdea}
                                loading={isGenerating}
                            >
                                <SparklesIcon className="w-4 h-4 mr-1" />
                                Générer avec l'IA
                            </NeonButton>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Question *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Le BRVM Composite dépassera 300 points d'ici fin 2025 ?"
                                className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-violet focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Contexte et enjeux de cette prédiction..."
                                className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-violet focus:outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Options *</label>
                            <div className="space-y-2">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => {
                                                const next = [...options];
                                                next[i] = e.target.value;
                                                setOptions(next);
                                            }}
                                            placeholder={`Option ${i + 1}`}
                                            className="flex-1 bg-dark-700/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-neon-violet focus:outline-none transition-all text-sm"
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                                                className="px-3 text-red-400 hover:text-red-300"
                                            >×</button>
                                        )}
                                    </div>
                                ))}
                                {options.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => setOptions([...options, ''])}
                                        className="text-sm text-neon-violet hover:text-neon-violet/70 transition-colors"
                                    >
                                        + Ajouter une option
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date d'expiration *</label>
                            <input
                                type="date"
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-violet focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Preuve d'analyse * <span className="text-xs text-gray-500">(obligatoire)</span></label>
                            <textarea
                                value={analysisProof}
                                onChange={e => setAnalysisProof(e.target.value)}
                                rows={3}
                                placeholder="Décrivez les données, indicateurs ou sources qui motivent cette prédiction..."
                                className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-violet focus:outline-none transition-all resize-none"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <NeonButton variant="ghost" size="md" type="button" onClick={onClose}>Annuler</NeonButton>
                            <NeonButton variant="violet" size="md" type="submit" loading={isLoading}>Publier</NeonButton>
                        </div>
                    </form>
                </NeonCard>
            </div>
        </div>
    );
};

// ─── Main View ────────────────────────────────────────────────────────────────
const PredictionsView: React.FC = () => {
    const { currentUser } = useAuth();
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [userBets, setUserBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [activeStatus, setActiveStatus] = useState<string>('active');
    const [betTarget, setBetTarget] = useState<Prediction | null>(null);
    const [resolveTarget, setResolveTarget] = useState<Prediction | null>(null);
    const [orderBookTarget, setOrderBookTarget] = useState<Prediction | null>(null);
    const [chatTarget, setChatTarget] = useState<Prediction | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [dbAvailable, setDbAvailable] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [preds, bets] = await Promise.all([
                getPredictions(),
                currentUser ? getUserBets(currentUser.id) : Promise.resolve([]),
            ]);
            setPredictions(preds);
            setUserBets(bets);
            if (preds.length === 0 && !currentUser) setDbAvailable(false);
        } catch {
            setDbAvailable(false);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { load(); }, [load]);

    const filtered = predictions.filter(p => {
        const catOk = activeCategory === 'all' || p.category === activeCategory;
        const statusOk = activeStatus === 'all' || p.status === activeStatus;
        return catOk && statusOk;
    });

    const handleBetConfirm = async (optionId: string, amount: number) => {
        if (!currentUser || !betTarget) return;
        const bet = await placeBet(currentUser.id, betTarget.id, optionId, amount);
        if (!bet) throw new Error("Impossible de placer le pari. La base de données n'est peut-être pas encore configurée.");
        setUserBets(prev => [...prev, bet]);
        setPredictions(prev => prev.map(p =>
            p.id === betTarget.id
                ? { ...p, participantsCount: p.participantsCount + 1, totalPool: p.totalPool + amount }
                : p
        ));
    };

    const handleCreate = async (payload: Omit<Prediction, 'id' | 'creatorId' | 'creatorName' | 'status' | 'totalPool' | 'createdAt' | 'participantsCount' | 'resolvedOptionId'>) => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'admin';
        const created = await createPrediction(currentUser.id, currentUser.fullName, payload, isAdmin);
        if (!created) throw new Error("Impossible de créer la prédiction. La base de données n'est peut-être pas encore configurée.");
        
        if (!isAdmin) {
            // Show info toast that it's pending
            // (Assuming Toast context is available or just let the list refresh)
        }
        
        setPredictions(prev => [created, ...prev]);
    };

    const handleUpdateStatus = async (predictionId: string, status: 'active' | 'rejected') => {
        const { updatePredictionStatus } = await import('../lib/database');
        const success = await updatePredictionStatus(predictionId, status);
        if (success) {
            setPredictions(prev => prev.map(p => p.id === predictionId ? { ...p, status } : p));
        }
    };

    const handleResolve = async (predictionId: string, winningOptionId: string) => {
        const success = await resolvePrediction(predictionId, winningOptionId);
        if (!success) throw new Error("Impossible de résoudre la prédiction. Vérifiez votre connexion à la base de données.");
        setPredictions(prev => prev.map(p =>
            p.id === predictionId
                ? { ...p, status: 'resolved', resolvedOptionId: winningOptionId }
                : p
        ));
    };

    const stats = {
        active: predictions.filter(p => p.status === 'active').length,
        total: predictions.length,
        myBets: userBets.length,
    };

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground variant="minimal" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                            Marchés de{' '}
                            <span className="bg-gradient-to-r from-neon-violet to-neon-magenta bg-clip-text text-transparent text-glow-violet">
                                Prédiction
                            </span>
                        </h1>
                        <p className="text-gray-400 mt-1">Analysez, prédisez et compétez sur les marchés mondiaux et africains.</p>
                    </div>
                    {currentUser && (
                        <NeonButton variant="violet" size="md" onClick={() => setShowCreate(true)}>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Créer une prédiction
                        </NeonButton>
                    )}
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Prédictions actives', value: stats.active, color: 'text-neon-green' },
                        { label: 'Total prédictions', value: stats.total, color: 'text-neon-cyan' },
                        { label: 'Mes paris', value: stats.myBets, color: 'text-neon-violet' },
                    ].map(s => (
                        <NeonCard key={s.label} className="p-4 text-center">
                            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </NeonCard>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                activeCategory === cat.id
                                    ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan'
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <div className="ml-auto flex gap-2">
                        {(['active', 'resolved', 'all'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    activeStatus === s
                                        ? 'bg-white/20 border border-white/40 text-white'
                                        : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                                }`}
                            >
                                {s === 'active' ? 'En cours' : s === 'resolved' ? 'Résolues' : 'Toutes'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {currentUser?.role === 'admin' && predictions.some(p => p.status === 'pending') && (
                    <div className="mb-12 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-neon-orange" />
                            File de validation ({predictions.filter(p => p.status === 'pending').length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {predictions.filter(p => p.status === 'pending').map(p => (
                                <PredictionCard
                                    key={p.id}
                                    prediction={p}
                                    userBet={undefined}
                                    onBet={() => {}}
                                    currentUserId={currentUser?.id}
                                    onUpdateStatus={handleUpdateStatus}
                                    isAdmin={true}
                                    onChat={setChatTarget}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 skeleton rounded-xl" />
                        ))}
                    </div>
                ) : !dbAvailable || predictions.length === 0 ? (
                    <NeonCard variant="violet" className="p-12 text-center">
                        <SparklesIcon className="w-16 h-16 text-neon-violet mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">Aucune prédiction pour l'instant</h3>
                        <p className="text-gray-400 mb-6">
                            {!dbAvailable
                                ? "Les tables de prédictions ne sont pas encore créées dans Supabase. Exécutez le script SQL pour les activer."
                                : "Soyez le premier à créer une prédiction et défier la communauté !"}
                        </p>
                        {currentUser && dbAvailable && (
                            <NeonButton variant="violet" onClick={() => setShowCreate(true)}>
                                Créer la première prédiction
                            </NeonButton>
                        )}
                    </NeonCard>
                ) : filtered.length === 0 ? (
                    <NeonCard className="p-12 text-center">
                        <p className="text-gray-400">Aucune prédiction pour ces filtres.</p>
                    </NeonCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(p => (
                            <PredictionCard
                                key={p.id}
                                prediction={p}
                                userBet={userBets.find(b => b.predictionId === p.id)}
                                onBet={setBetTarget}
                                currentUserId={currentUser?.id}
                                onResolve={setResolveTarget}
                                onOpenOrderBook={setOrderBookTarget}
                                onUpdateStatus={handleUpdateStatus}
                                isAdmin={currentUser?.role === 'admin'}
                                onChat={setChatTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {betTarget && (
                <BetModal
                    prediction={betTarget}
                    onClose={() => setBetTarget(null)}
                    onConfirm={handleBetConfirm}
                />
            )}
            {showCreate && (
                <CreatePredictionModal
                    onClose={() => setShowCreate(false)}
                    onCreate={handleCreate}
                />
            )}
            {resolveTarget && (
                <ResolveModal
                    prediction={resolveTarget}
                    onClose={() => setResolveTarget(null)}
                    onResolve={handleResolve}
                />
            )}
            
            {orderBookTarget && (
                <OrderBookPanel
                    prediction={orderBookTarget}
                    onClose={() => setOrderBookTarget(null)}
                />
            )}

            {/* Prediction Chat Modal */}
            {chatTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setChatTarget(null)}>
                    <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                        <NeonCard variant="violet" className="p-0 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <div>
                                    <h3 className="font-bold text-white leading-tight">{chatTarget.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Discussion en temps réel</p>
                                </div>
                                <button onClick={() => setChatTarget(null)} className="p-2 text-gray-400 hover:text-white transition-all">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-4 bg-dark-900/50">
                                <PredictionChat predictionId={chatTarget.id} />
                            </div>
                        </NeonCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionsView;
