

import React, { useState } from 'react';
import { generateStrategyStream } from '../services/geminiService';
import { LightBulbIcon, SparklesIcon } from './icons/Icons';
import MarkdownRenderer from './MarkdownRenderer';

const StrategyView: React.FC = () => {
    const [prompt, setPrompt] = useState('Créer une stratégie d\'investissement pour un profil à risque modéré, axée sur la croissance à long terme avec des ETFs en se concentrant sur le marché Africain.');
    const [strategy, setStrategy] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError("Veuillez entrer une description pour votre stratégie.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStrategy('');

        try {
            const response = await generateStrategyStream(prompt);
            
            let fullText = '';
            for await (const chunk of response) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    setStrategy(fullText);
                }
            }
        } catch (error) {
            console.error("Error generating strategy:", error);
            setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue lors de la génération de la stratégie.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <LightBulbIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                    Votre Mentor IA Personnel
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Posez des questions sur des stratégies, des marchés spécifiques, ou demandez des conseils sur la gestion de risque.
                </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="strategy-prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                        Posez votre question à votre mentor IA
                    </label>
                    <textarea
                        id="strategy-prompt"
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Compare l'investissement dans le secteur bancaire au Nigéria et en Afrique du Sud."
                        disabled={isLoading}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="mt-4 w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Réflexion en cours...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="mr-2 h-5 w-5" />
                                Demander au Mentor
                            </>
                        )}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Erreur de Génération</p>
                    <p>{error}</p>
                </div>
            )}
            
            {(strategy || isLoading) && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Conseil du Mentor IA</h3>
                    <MarkdownRenderer content={strategy} />
                    {isLoading && !strategy && <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>}
                </div>
            )}
        </div>
    );
};

export default StrategyView;