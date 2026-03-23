import React, { useState } from 'react';
import type { Alert, Metric } from '../types';
import { BellIcon, TrashIcon } from './icons/Icons';

interface AlertsPanelProps {
  alerts: Alert[];
  availableMetrics: Metric[];
  onSetAlert: (alertData: Omit<Alert, 'id'>) => void;
  onRemoveAlert: (id: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, availableMetrics, onSetAlert, onRemoveAlert }) => {
  const [metric, setMetric] = useState('');
  const [condition, setCondition] = useState<'gt' | 'lt'>('gt');
  const [threshold, setThreshold] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const thresholdNumber = parseFloat(threshold);
    if (metric && !isNaN(thresholdNumber)) {
      onSetAlert({
        metricLabel: metric,
        condition,
        threshold: thresholdNumber,
      });
      // Reset form
      setMetric('');
      setThreshold('');
    }
  };
  
  // Set default metric if list becomes available
  React.useEffect(() => {
    if (!metric && availableMetrics.length > 0) {
        setMetric(availableMetrics[0].label);
    }
  }, [availableMetrics, metric]);


  const isFormDisabled = availableMetrics.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400 flex items-center"><BellIcon /><span className="ml-2">Gestion des Alertes</span></h3>
        
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2">
                <label htmlFor="metric-select" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Indicateur</label>
                <select 
                    id="metric-select" 
                    value={metric} 
                    onChange={e => setMetric(e.target.value)}
                    disabled={isFormDisabled}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isFormDisabled ? (
                        <option>Lancez une analyse pour choisir</option>
                    ) : (
                       availableMetrics.map(m => <option key={m.label} value={m.label}>{m.label}</option>)
                    )}
                </select>
            </div>
            
            <div>
                 <label htmlFor="condition-select" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Condition</label>
                <select 
                    id="condition-select" 
                    value={condition} 
                    onChange={e => setCondition(e.target.value as 'gt' | 'lt')}
                    disabled={isFormDisabled}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <option value="gt">Supérieur à</option>
                    <option value="lt">Inférieur à</option>
                </select>
            </div>

            <div>
                 <label htmlFor="threshold-input" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Seuil</label>
                 <input 
                    id="threshold-input"
                    type="number" 
                    value={threshold}
                    onChange={e => setThreshold(e.target.value)}
                    placeholder="Ex: 25"
                    disabled={isFormDisabled}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                 />
            </div>
            
            <button type="submit" disabled={isFormDisabled || !threshold} className="sm:col-start-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors">
                Ajouter l'Alerte
            </button>
        </form>

        <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Alertes Actives</h4>
            {alerts.length > 0 ? (
                <ul className="space-y-2">
                    {alerts.map(alert => (
                        <li key={alert.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                           <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{alert.metricLabel}</span>
                                <span> {alert.condition === 'gt' ? '>' : '<'} </span>
                                <span className="font-bold text-gray-900 dark:text-gray-100">{alert.threshold}</span>
                           </p>
                           <button onClick={() => onRemoveAlert(alert.id)} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1" aria-label="Supprimer l'alerte">
                                <TrashIcon />
                           </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucune alerte active. Ajoutez-en une en utilisant le formulaire ci-dessus.</p>
            )}
        </div>
    </div>
  );
};

export default AlertsPanel;