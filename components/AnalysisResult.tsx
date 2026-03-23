import React from 'react';
import type { AnalysisData } from '../types';
import MetricCard from './MetricCard';
import ProjectionChart from './ProjectionChart';

interface AnalysisResultProps {
  data: AnalysisData;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const { 
    companyName, 
    ticker, 
    summary, 
    keyMetrics, 
    projections, 
    strengths, 
    weaknesses, 
    recommendation, 
    confidenceScore 
  } = data;

  const recommendationColor = {
    'Acheter': 'bg-neon-green/10 text-neon-green border-neon-green/30 text-glow-green',
    'Conserver': 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    'Vendre': 'bg-red-400/10 text-red-400 border-red-400/30',
  }[recommendation];

  return (
    <div className="space-y-8 animate-fade-in shadow-2xl">
      {/* Header */}
      <div className="bg-dark-800/50 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="flex justify-between items-start flex-wrap gap-6">
            <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-white mb-2 font-display">
                    {companyName} <span className="text-lg font-normal text-gray-400 ml-2">({ticker})</span>
                </h2>
                <div className="flex items-center gap-6 mt-4">
                  <p className="text-gray-300 leading-relaxed flex-1">{summary}</p>
                </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className={`text-center p-5 rounded-xl border ${recommendationColor} min-w-[160px] shadow-lg`}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-70 mb-1">Impact IA</div>
                  <div className="text-2xl font-black">{recommendation}</div>
                  <div className="text-[10px] text-gray-400 mt-2">Indice de confiance: {confidenceScore}%</div>
              </div>
              <button 
                onClick={() => window.print()}
                className="print-hidden flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl hover:bg-neon-cyan hover:text-dark-950 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Export PDF
              </button>
            </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-neon-cyan rounded-full" />
          <h3 className="text-xl font-bold text-white">Metriques Financieres</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {keyMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Projections */}
      <div className="bg-dark-800/50 p-6 rounded-2xl border border-white/10">
        <ProjectionChart data={projections} />
      </div>
      
      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-dark-800/50 p-6 rounded-2xl border border-neon-green/20 hover:border-neon-green/40 transition-all">
          <h3 className="text-xl font-bold mb-6 text-neon-green flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green" />
            Points Forts
          </h3>
          <ul className="space-y-4 text-gray-300">
            {strengths.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-green/40 flex-shrink-0" />
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-dark-800/50 p-6 rounded-2xl border border-red-400/20 hover:border-red-400/40 transition-all">
          <h3 className="text-xl font-bold mb-6 text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Risques Identifies
          </h3>
          <ul className="space-y-4 text-gray-300">
            {weaknesses.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400/40 flex-shrink-0" />
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;