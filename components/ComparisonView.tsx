import React from 'react';
import type { AnalysisData } from '../types';
import ProjectionChart from './ProjectionChart';
import { ScaleIcon } from './icons/Icons';

interface ComparisonViewProps {
  mainAnalysis: AnalysisData;
  comparisonAnalysis: AnalysisData;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ mainAnalysis, comparisonAnalysis }) => {
  const renderRecommendation = (analysis: AnalysisData) => {
    const { recommendation, confidenceScore } = analysis;
    const recommendationColor = {
      'Acheter': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
      'Conserver': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
      'Vendre': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    }[recommendation];

    return (
      <div className={`p-4 rounded-lg border ${recommendationColor} text-center`}>
        <div className="text-sm font-bold uppercase tracking-wider">Recommandation</div>
        <div className="text-2xl font-extrabold mt-1">{recommendation}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confiance: {confidenceScore}%</div>
      </div>
    );
  };
  
  const mainMetricsLabels = new Set(mainAnalysis.keyMetrics.map(m => m.label));
  const compMetricsLabels = new Set(comparisonAnalysis.keyMetrics.map(m => m.label));
  const allMetricsLabels = Array.from(new Set([...mainMetricsLabels, ...compMetricsLabels]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-around items-center text-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{mainAnalysis.companyName}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">({mainAnalysis.ticker})</p>
          </div>
          <div className="text-indigo-500 dark:text-indigo-400">
            <ScaleIcon className="h-12 w-12 mx-auto" />
            <span className="font-bold text-xl block">VS</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{comparisonAnalysis.companyName}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">({comparisonAnalysis.ticker})</p>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Résumé - {mainAnalysis.companyName}</h3>
          <p className="text-gray-600 dark:text-gray-300">{mainAnalysis.summary}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Résumé - {comparisonAnalysis.companyName}</h3>
          <p className="text-gray-600 dark:text-gray-300">{comparisonAnalysis.summary}</p>
        </div>
      </div>

      {/* Key Metrics Comparison */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Comparaison des Indicateurs Clés</h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center text-center font-semibold text-gray-800 dark:text-gray-200">
                <div className="text-left">{mainAnalysis.companyName}</div>
                <div className="text-gray-500 dark:text-gray-400">Indicateur</div>
                <div className="text-right">{comparisonAnalysis.companyName}</div>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-600" />
            {allMetricsLabels.map(label => {
                const mainMetric = mainAnalysis.keyMetrics.find(m => m.label === label);
                const compMetric = comparisonAnalysis.keyMetrics.find(m => m.label === label);
                return (
                    <div key={label} className="grid grid-cols-3 gap-x-4 gap-y-2 items-center text-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div className="text-left font-bold text-lg">{mainMetric?.value || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400" title={mainMetric?.tooltip || compMetric?.tooltip}>{label}</div>
                        <div className="text-right font-bold text-lg">{compMetric?.value || 'N/A'}</div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRecommendation(mainAnalysis)}
        {renderRecommendation(comparisonAnalysis)}
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectionChart data={mainAnalysis.projections} />
        <ProjectionChart data={comparisonAnalysis.projections} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">Points Forts - {mainAnalysis.companyName}</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
              {mainAnalysis.strengths.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Points Faibles - {mainAnalysis.companyName}</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
              {mainAnalysis.weaknesses.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">Points Forts - {comparisonAnalysis.companyName}</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
              {comparisonAnalysis.strengths.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Points Faibles - {comparisonAnalysis.companyName}</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
              {comparisonAnalysis.weaknesses.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;