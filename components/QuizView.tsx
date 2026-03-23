import React, { useState, useCallback } from 'react';
import { generateQuiz } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import { SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, TrophyIcon, BookOpenIcon, ArrowRightIcon } from './icons/Icons';
import AnimatedBackground from './ui/AnimatedBackground';

const TOPICS = [
    { id: 'concepts_de_base', label: 'Concepts de base', emoji: '📚' },
    { id: 'marchés_africains', label: 'Marchés africains', emoji: '🌍' },
    { id: 'analyse_technique', label: 'Analyse technique', emoji: '📈' },
    { id: 'analyse_fondamentale', label: 'Analyse fondamentale', emoji: '🔍' },
    { id: 'gestion_du_risque', label: 'Gestion du risque', emoji: '🛡️' },
    { id: 'diversification', label: 'Diversification', emoji: '⚖️' },
];

const DIFFICULTIES = [
    { id: 'débutant', label: 'Débutant', color: 'green' as const, desc: 'Notions essentielles' },
    { id: 'intermédiaire', label: 'Intermédiaire', color: 'cyan' as const, desc: 'Analyse et stratégies' },
    { id: 'avancé', label: 'Avancé', color: 'violet' as const, desc: 'Concepts experts' },
];

const GRADE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
    'S': { label: 'Parfait !', color: 'text-neon-cyan', emoji: '🏆' },
    'A': { label: 'Excellent !', color: 'text-neon-green', emoji: '⭐' },
    'B': { label: 'Très bien !', color: 'text-neon-cyan', emoji: '👍' },
    'C': { label: 'Passable', color: 'text-yellow-400', emoji: '📖' },
    'D': { label: 'À revoir', color: 'text-orange-400', emoji: '💪' },
    'F': { label: 'Réessaie !', color: 'text-red-400', emoji: '🔁' },
};

function getGrade(score: number, total: number): string {
    const pct = (score / total) * 100;
    if (pct === 100) return 'S';
    if (pct >= 80) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 40) return 'C';
    if (pct >= 20) return 'D';
    return 'F';
}

type Phase = 'setup' | 'loading' | 'quiz' | 'result';

const QuizView: React.FC = () => {
    const [phase, setPhase] = useState<Phase>('setup');
    const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
    const [selectedDifficulty, setSelectedDifficulty] = useState('débutant');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startQuiz = useCallback(async () => {
        setPhase('loading');
        setError(null);
        try {
            const topicLabel = TOPICS.find(t => t.id === selectedTopic)?.label || selectedTopic;
            const qs = await generateQuiz(topicLabel, selectedDifficulty, 5);
            setQuestions(qs);
            setAnswers(new Array(qs.length).fill(null));
            setCurrentIdx(0);
            setShowExplanation(false);
            setPhase('quiz');
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur lors de la génération du quiz.");
            setPhase('setup');
        }
    }, [selectedTopic, selectedDifficulty]);

    const handleAnswer = (optionIndex: number) => {
        if (answers[currentIdx] !== null) return;
        const next = [...answers];
        next[currentIdx] = optionIndex;
        setAnswers(next);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setShowExplanation(false);
        } else {
            setPhase('result');
        }
    };

    const reset = () => {
        setPhase('setup');
        setQuestions([]);
        setAnswers([]);
        setCurrentIdx(0);
        setShowExplanation(false);
        setError(null);
    };

    const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground variant="grid" intensity="low" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-violet/20 border border-neon-violet/40 mb-4">
                        <BookOpenIcon className="w-8 h-8 text-neon-violet" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                        Quiz{' '}
                        <span className="bg-gradient-to-r from-neon-violet to-neon-magenta bg-clip-text text-transparent text-glow-violet">
                            IA
                        </span>
                    </h1>
                    <p className="text-gray-400 mt-2">Testez vos connaissances financières générées par l'IA</p>
                </div>

                {/* SETUP PHASE */}
                {phase === 'setup' && (
                    <NeonCard variant="violet" className="animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-6">Configurez votre quiz</h2>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 rounded-xl bg-red-400/10 border border-red-400/20">
                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">Thème</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {TOPICS.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic.id)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                                            selectedTopic === topic.id
                                                ? 'border-neon-violet/60 bg-neon-violet/15 text-neon-violet'
                                                : 'border-white/10 text-gray-300 hover:border-white/30 hover:text-white bg-white/5'
                                        }`}
                                    >
                                        <span className="text-lg">{topic.emoji}</span>
                                        <span>{topic.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-400 mb-3">Difficulté</label>
                            <div className="grid grid-cols-3 gap-3">
                                {DIFFICULTIES.map(diff => (
                                    <button
                                        key={diff.id}
                                        onClick={() => setSelectedDifficulty(diff.id)}
                                        className={`px-4 py-4 rounded-xl border text-sm font-medium transition-all ${
                                            selectedDifficulty === diff.id
                                                ? `border-neon-${diff.color}/60 bg-neon-${diff.color}/15 text-neon-${diff.color}`
                                                : 'border-white/10 text-gray-300 hover:border-white/30 bg-white/5'
                                        }`}
                                    >
                                        <div className="font-bold">{diff.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">{diff.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <NeonButton variant="violet" size="lg" fullWidth onClick={startQuiz}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Générer le quiz (5 questions)
                        </NeonButton>
                    </NeonCard>
                )}

                {/* LOADING PHASE */}
                {phase === 'loading' && (
                    <NeonCard variant="violet" className="p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 border-4 border-neon-violet/30 border-t-neon-violet rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-white font-semibold text-lg">L'IA génère votre quiz...</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Thème: {TOPICS.find(t => t.id === selectedTopic)?.label} · {selectedDifficulty}
                        </p>
                    </NeonCard>
                )}

                {/* QUIZ PHASE */}
                {phase === 'quiz' && questions.length > 0 && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Question {currentIdx + 1} / {questions.length}</span>
                            <div className="flex gap-1.5">
                                {questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 w-8 rounded-full transition-all ${
                                            i < currentIdx
                                                ? answers[i] === questions[i].correctIndex
                                                    ? 'bg-neon-green'
                                                    : 'bg-red-400'
                                                : i === currentIdx
                                                    ? 'bg-neon-violet'
                                                    : 'bg-white/10'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Question Card */}
                        <NeonCard variant="violet">
                            <p className="text-white font-semibold text-lg leading-relaxed mb-6">
                                {questions[currentIdx].question}
                            </p>

                            <div className="space-y-3">
                                {questions[currentIdx].options.map((opt, i) => {
                                    const isChosen = answers[currentIdx] === i;
                                    const isCorrect = i === questions[currentIdx].correctIndex;
                                    const revealed = answers[currentIdx] !== null;

                                    let className = 'w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ';
                                    if (!revealed) {
                                        className += 'border-white/10 text-gray-300 hover:border-neon-violet/40 hover:text-white bg-white/5 hover:bg-neon-violet/10 cursor-pointer';
                                    } else if (isCorrect) {
                                        className += 'border-neon-green/60 bg-neon-green/10 text-neon-green';
                                    } else if (isChosen && !isCorrect) {
                                        className += 'border-red-400/60 bg-red-400/10 text-red-400';
                                    } else {
                                        className += 'border-white/5 text-gray-500 bg-white/2 cursor-default opacity-60';
                                    }

                                    return (
                                        <button
                                            key={i}
                                            className={className}
                                            onClick={() => handleAnswer(i)}
                                            disabled={revealed}
                                        >
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                revealed && isCorrect ? 'bg-neon-green/20' : revealed && isChosen ? 'bg-red-400/20' : 'bg-white/10'
                                            }`}>
                                                {revealed && isCorrect ? '✓' : revealed && isChosen && !isCorrect ? '✗' : ['A', 'B', 'C', 'D'][i]}
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {showExplanation && (
                                <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
                                    <div className="flex items-start gap-2">
                                        <SparklesIcon className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-neon-cyan mb-1">Explication</p>
                                            <p className="text-sm text-gray-300 leading-relaxed">{questions[currentIdx].explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </NeonCard>

                        {answers[currentIdx] !== null && (
                            <NeonButton
                                variant={answers[currentIdx] === questions[currentIdx].correctIndex ? 'green' : 'cyan'}
                                size="lg"
                                fullWidth
                                onClick={handleNext}
                            >
                                {currentIdx < questions.length - 1 ? (
                                    <>Question suivante <ArrowRightIcon className="w-4 h-4 ml-2" /></>
                                ) : (
                                    <>Voir mes résultats <TrophyIcon className="w-4 h-4 ml-2" /></>
                                )}
                            </NeonButton>
                        )}
                    </div>
                )}

                {/* RESULT PHASE */}
                {phase === 'result' && (
                    <div className="space-y-4 animate-fade-in">
                        <NeonCard variant="violet" className="text-center p-8">
                            {(() => {
                                const grade = getGrade(score, questions.length);
                                const cfg = GRADE_CONFIG[grade];
                                return (
                                    <>
                                        <div className="text-6xl mb-4">{cfg.emoji}</div>
                                        <div className={`text-7xl font-display font-bold mb-2 ${cfg.color}`}>{grade}</div>
                                        <p className={`text-2xl font-bold mb-1 ${cfg.color}`}>{cfg.label}</p>
                                        <p className="text-gray-400 mb-6">
                                            {score} / {questions.length} bonnes réponses
                                            <span className="ml-2 text-gray-500">
                                                ({Math.round((score / questions.length) * 100)}%)
                                            </span>
                                        </p>

                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-8">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${(score / questions.length) * 100}%`,
                                                    background: score === questions.length
                                                        ? 'linear-gradient(90deg, #00E5FF, #00FF88)'
                                                        : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                                                }}
                                            />
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-3">
                                <NeonButton variant="ghost" size="md" onClick={reset}>
                                    Nouveau quiz
                                </NeonButton>
                                <NeonButton variant="violet" size="md" onClick={() => { setCurrentIdx(0); setPhase('quiz'); setShowExplanation(false); }}>
                                    Revoir les questions
                                </NeonButton>
                            </div>
                        </NeonCard>

                        {/* Question review */}
                        <div className="space-y-3">
                            {questions.map((q, i) => {
                                const correct = answers[i] === q.correctIndex;
                                return (
                                    <NeonCard key={i} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                                correct ? 'bg-neon-green/20 text-neon-green' : 'bg-red-400/20 text-red-400'
                                            }`}>
                                                {correct ? '✓' : '✗'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium mb-1">{q.question}</p>
                                                <p className="text-xs text-gray-500">
                                                    Bonne réponse: <span className="text-neon-green">{q.options[q.correctIndex]}</span>
                                                </p>
                                                {answers[i] !== null && answers[i] !== q.correctIndex && (
                                                    <p className="text-xs text-gray-500">
                                                        Votre réponse: <span className="text-red-400">{q.options[answers[i] as number]}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <NeonBadge variant={correct ? 'green' : 'orange'} size="sm">
                                                {correct ? '+1' : '0'}
                                            </NeonBadge>
                                        </div>
                                    </NeonCard>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizView;
