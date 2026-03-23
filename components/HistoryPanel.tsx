import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { ClockIcon, TrashIcon, ExclamationTriangleIcon } from './icons/Icons';

interface HistoryPanelProps {
    history: HistoryItem[];
    onLoadHistory: (item: HistoryItem) => void;
    onClearHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoadHistory, onClearHistory }) => {
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const handleConfirmClear = () => {
        onClearHistory();
        setIsConfirmingClear(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                    <ClockIcon />
                    <span className="ml-2">Historique des Analyses</span>
                </h3>
                {history.length > 0 && (
                    <button 
                        onClick={() => setIsConfirmingClear(true)}
                        className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition-colors"
                    >
                       <TrashIcon className="mr-1 h-4 w-4"/> Vider
                    </button>
                )}
            </div>
            {history.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {history.map((item) => (
                        <li key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md border border-gray-200 dark:border-gray-600">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.companyIdentifier}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => onLoadHistory(item)}
                                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors"
                            >
                                Revoir
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucun historique disponible. Lancez une analyse pour commencer.</p>
            )}

            {/* Confirmation Dialog */}
            {isConfirmingClear && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border dark:border-gray-700">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">Vider l'historique ?</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Êtes-vous sûr de vouloir supprimer tout l'historique ? Cette action est irréversible.
                        </p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                onClick={() => setIsConfirmingClear(false)}
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmClear}
                                type="button"
                                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;