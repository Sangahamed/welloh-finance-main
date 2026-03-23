import React from 'react';
import { useSettings, LineType } from '../contexts/SettingsContext';
import { Cog6ToothIcon, XMarkIcon } from './icons/Icons';
import NeonButton from './ui/NeonButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const { revenueColor, profitColor, lineType, showGrid } = settings;

  if (!isOpen) {
    return null;
  }

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };
  
  const lineTypes: { value: LineType, label: string }[] = [
    { value: 'monotone', label: 'Monotone' },
    { value: 'linear', label: 'Lineaire' },
    { value: 'step', label: 'En escalier' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 animate-scale-in">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
          style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(0, 255, 255, 0.2))' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-violet/20 flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-neon-violet" />
            </div>
            <h2 className="text-xl font-display font-bold text-white" id="modal-title">
              Parametres
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer les parametres"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          <fieldset>
            <legend className="text-sm font-display font-semibold text-neon-cyan uppercase tracking-wider mb-4">
              Personnalisation du Graphique
            </legend>
            
            <div className="space-y-4">
              {/* Revenue Color */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-white/5">
                <label htmlFor="revenue-color" className="text-gray-300">
                  Couleur des Revenus
                </label>
                <div className="relative">
                  <input 
                    type="color" 
                    id="revenue-color" 
                    value={revenueColor}
                    onChange={(e) => handleSettingChange('revenueColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-2 border-white/20 hover:border-neon-cyan/50 transition-colors"
                  />
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ boxShadow: `0 0 15px ${revenueColor}40` }}
                  />
                </div>
              </div>

              {/* Profit Color */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-white/5">
                <label htmlFor="profit-color" className="text-gray-300">
                  Couleur des Benefices
                </label>
                <div className="relative">
                  <input 
                    type="color" 
                    id="profit-color" 
                    value={profitColor}
                    onChange={(e) => handleSettingChange('profitColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-2 border-white/20 hover:border-neon-cyan/50 transition-colors"
                  />
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ boxShadow: `0 0 15px ${profitColor}40` }}
                  />
                </div>
              </div>

              {/* Line Type */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-white/5">
                <label htmlFor="line-type" className="text-gray-300">
                  Type de Ligne
                </label>
                <select
                  id="line-type"
                  value={lineType}
                  onChange={(e) => handleSettingChange('lineType', e.target.value)}
                  className="px-4 py-2 rounded-lg bg-dark-600 border border-white/10 text-white focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all cursor-pointer"
                >
                  {lineTypes.map(lt => (
                    <option key={lt.value} value={lt.value} className="bg-dark-800">
                      {lt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Grid Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-white/5">
                <label htmlFor="show-grid" className="text-gray-300">
                  Afficher la Grille
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showGrid}
                  onClick={() => handleSettingChange('showGrid', !showGrid)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 ${
                    showGrid 
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-violet' 
                      : 'bg-dark-600 border border-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      showGrid ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <NeonButton color="cyan" onClick={onClose}>
            Termine
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
