import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { AnalysisData, NewsArticle, HistoryItem, Alert } from '../types';
import AnalysisForm from './AnalysisForm';
import AnalysisResult from './AnalysisResult';
import ComparisonView from './ComparisonView';
import FinancialNews from './FinancialNews';
import HistoryPanel from './HistoryPanel';
import AlertsPanel from './AlertsPanel';
import TabbedPanel from './TabbedPanel';
import Notification from './Notification';
import SettingsModal from './SettingsModal';
import { SparklesIcon, ExclamationTriangleIcon, NewspaperIcon, ClockIcon, BellIcon, Cog6ToothIcon } from './icons/Icons';

// Skeleton for AnalysisResult
const AnalysisSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
                </div>
                <div className="h-24 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        </div>
        <div>
            <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"></div>)}
            </div>
        </div>
        <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"></div>
    </div>
);


const AnalysisView: React.FC = () => {
    // Get data and functions from AuthContext
    const { currentUserAccount, addHistoryItem, clearHistory, addAlert, removeAlert } = useAuth();
    
    // Analysis state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<{ main: AnalysisData, comparison: AnalysisData | null } | null>(null);
    const [news, setNews] = useState<NewsArticle[] | null>(null);

    // History and Alerts state are now derived from the context
    const history = currentUserAccount?.analysisHistory || [];
    const alerts = currentUserAccount?.alerts || [];

    // Triggered alerts state remains local to this view
    const [triggeredAlerts, setTriggeredAlerts] = useState<(Alert & { triggeredValue?: string })[]>([]);

    // Settings state remains local
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const checkAlerts = useCallback((data: AnalysisData) => {
        const triggered: (Alert & { triggeredValue?: string })[] = [];
        
        data.keyMetrics.forEach(metric => {
            const metricValue = parseFloat(metric.value.replace(/[^0-9.-]+/g,""));
            if (isNaN(metricValue)) return;

            alerts.forEach(alert => {
                if (alert.metricLabel === metric.label) {
                    if ((alert.condition === 'gt' && metricValue > alert.threshold) || (alert.condition === 'lt' && metricValue < alert.threshold)) {
                        triggered.push({ ...alert, triggeredValue: metric.value });
                        // Remove triggered alert from DB and context state
                        removeAlert(alert.id);
                    }
                }
            });
        });

        if (triggered.length > 0) {
            setTriggeredAlerts(prev => [...prev, ...triggered]);
        }
    }, [alerts, removeAlert]);

    const handleAnalysisStart = useCallback(() => {
        setIsLoading(true);
        setError(null);
        setAnalysisData(null);
        setNews(null);
    }, []);
    
    const handleAnalysisComplete = useCallback((data: { main: AnalysisData; comparison: AnalysisData | null }, newsData: NewsArticle[]) => {
        setAnalysisData(data);
        setNews(newsData);
        setIsLoading(false);
        // Add to history via context
        const historyItem: Omit<HistoryItem, 'id' | 'timestamp'> = {
            companyIdentifier: data.main.companyName,
            comparisonIdentifier: data.comparison?.companyName,
            currency: 'USD', // This should ideally come from the form
            analysisData: data,
            news: newsData,
        };
        addHistoryItem(historyItem);
        checkAlerts(data.main);
    }, [checkAlerts, addHistoryItem]);

    const handleAnalysisError = useCallback((errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
    }, []);

    const handleLoadHistory = useCallback((item: HistoryItem) => {
        setAnalysisData(item.analysisData);
        setNews(item.news);
        setIsLoading(false);
        setError(null);
        window.scrollTo(0, 0);
    }, []);

    const handleClearHistory = useCallback(() => clearHistory(), [clearHistory]);
    const handleSetAlert = useCallback((alertData: Omit<Alert, 'id'>) => addAlert(alertData), [addAlert]);
    const handleRemoveAlert = useCallback((id: string) => removeAlert(id), [removeAlert]);

    const handleCloseNotification = (id: string) => {
        setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
    };

    const tabs = [
        { label: 'Actualités', icon: NewspaperIcon, content: <FinancialNews articles={news} isLoading={isLoading} /> },
        { label: 'Historique', icon: ClockIcon, content: <HistoryPanel history={history} onLoadHistory={handleLoadHistory} onClearHistory={handleClearHistory} /> },
        { label: 'Alertes', icon: BellIcon, content: <AlertsPanel alerts={alerts} availableMetrics={analysisData?.main.keyMetrics || []} onSetAlert={handleSetAlert} onRemoveAlert={handleRemoveAlert} /> }
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analyse Financière Approfondie</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">Utilisez l'IA pour obtenir une analyse détaillée des entreprises et comparer les concurrents.</p>
                </div>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Ouvrir les paramètres"
                >
                    <Cog6ToothIcon className="h-6 w-6" />
                </button>
            </div>
            
            <AnalysisForm onAnalysisStart={handleAnalysisStart} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} isLoading={isLoading} />
            
            {error && (
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start" role="alert">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-3 text-red-600 flex-shrink-0" />
                    <div><p className="font-bold">Erreur d'Analyse</p><p>{error}</p></div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {isLoading && <AnalysisSkeleton />}
                    {!isLoading && !error && analysisData && (
                        analysisData.comparison ? (
                            <ComparisonView mainAnalysis={analysisData.main} comparisonAnalysis={analysisData.comparison} />
                        ) : (
                            <AnalysisResult data={analysisData.main} />
                        )
                    )}
                    {!isLoading && !error && !analysisData && (
                        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600">
                             <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Prêt pour une analyse ?</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">
                                Remplissez le formulaire ci-dessus pour lancer une analyse financière générée par l'IA.
                            </p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 lg:sticky lg:top-24">
                    <TabbedPanel tabs={tabs} />
                </div>
            </div>

            {/* Notifications Area */}
            <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
                <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                    {triggeredAlerts.map(alert => (
                        <Notification key={alert.id} alert={alert} onClose={() => handleCloseNotification(alert.id)} />
                    ))}
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default AnalysisView;