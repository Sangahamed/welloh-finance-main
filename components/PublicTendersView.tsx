import React, { useState } from 'react';
import { BriefcaseIcon, MagnifyingGlassIcon, ClockIcon, GlobeAltIcon } from './icons/Icons';
import { searchPublicTenders } from '../services/geminiService';
import type { PublicTender } from '../types';

const suggestionQueries = [
    "Infrastructures en Côte d'Ivoire",
    "Fintech au Nigéria",
    "Énergies renouvelables au Kenya",
    "Agriculture au Sénégal",
];

const TenderCard: React.FC<{ tender: PublicTender }> = ({ tender }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-500/50">
        {/* Main Content */}
        <div className="flex-grow">
            {/* Meta Info: Sector & Country */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
                <span className="text-xs font-bold inline-block py-1 px-2.5 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300">
                    {tender.sector}
                </span>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <GlobeAltIcon className="h-4 w-4 mr-1.5" />
                    <span>{tender.country}</span>
                </div>
            </div>

            {/* Title & Issuer */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tender.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Émis par : <span className="font-medium">{tender.issuingEntity}</span></p>
            
            {/* Summary */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 line-clamp-4">{tender.summary}</p>
        </div>
        
        {/* Footer: Deadline & Link */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <ClockIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <div className="flex flex-col">
                     <span className="font-semibold leading-tight">Date limite</span>
                     <span className="font-bold leading-tight">{tender.deadline}</span>
                </div>
            </div>
            <a 
                href={tender.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 py-1.5 rounded-md transition-colors"
            >
                Détails &rarr;
            </a>
        </div>
    </div>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mt-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mt-2"></div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
    </div>
);


const PublicTendersView: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PublicTender[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const tenderResults = await searchPublicTenders(searchQuery);
            setResults(tenderResults);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la recherche.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                    Opportunités & Appels d'Offres
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Recherchez des appels d'offres publics pertinents sur les marchés africains et mondiaux pour identifier de nouvelles opportunités.
                </p>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher par secteur, pays, mot-clé..."
                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-10 pr-4 py-2.5 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Suggestions:</span>
                    {suggestionQueries.map(suggestion => (
                        <button 
                            key={suggestion}
                            onClick={() => {
                                setQuery(suggestion);
                                performSearch(suggestion);
                            }}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-10 px-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 font-semibold">Erreur: {error}</p>
                    </div>
                ) : hasSearched ? (
                    results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map(tender => <TenderCard key={tender.id} tender={tender} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-600 dark:text-gray-300">Aucun appel d'offres trouvé pour votre recherche.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">Lancez une recherche pour trouver des appels d'offres.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicTendersView;