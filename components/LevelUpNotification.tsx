import React, { useEffect, useState, useCallback } from 'react';
import { ArrowUpIcon, XMarkIcon, TrophyIcon, SparklesIcon } from './icons/Icons';
import Confetti from './ui/Confetti';

interface LevelUpNotificationProps {
  levelInfo: { oldLevel: string; newLevel: string };
  onClose: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ levelInfo, onClose }) => {
  const [show, setShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => {
      setShow(true);
      setShowConfetti(true);
    }, 100);

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <>
      {/* Confetti */}
      <Confetti 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        duration={4000}
        particleCount={150}
      />

      {/* Notification Card */}
      <div className={`
        max-w-md w-full pointer-events-auto
        transition-all duration-500 ease-out
        ${show 
          ? 'transform opacity-100 translate-y-0 scale-100' 
          : 'transform opacity-0 translate-y-4 scale-95'
        }
      `}>
        {/* Glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-violet rounded-2xl blur-xl opacity-50 animate-pulse" />
        
        <div className="relative glass-card rounded-2xl overflow-hidden border border-neon-green/30">
          {/* Animated border */}
          <div 
            className="absolute inset-0 rounded-2xl p-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #00FF88, #00FFFF, #8B5CF6, #00FF88)',
              backgroundSize: '300% 100%',
              animation: 'border-glow 3s ease-in-out infinite',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          <div className="relative p-6 bg-dark-800/95">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-green/30 blur-lg rounded-full animate-pulse" />
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                    <TrophyIcon className="w-6 h-6 text-dark-900" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-display">PROMOTION !</span>
                    <SparklesIcon className="w-5 h-5 text-yellow-400 animate-bounce" />
                  </div>
                  <p className="text-sm text-neon-green">Nouveau niveau atteint</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Level transition */}
            <div className="flex items-center justify-center gap-4 py-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Ancien niveau</p>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-lg font-bold text-gray-400">{levelInfo.oldLevel}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <ArrowUpIcon className="w-6 h-6 text-neon-green animate-bounce" />
                <ArrowUpIcon className="w-6 h-6 text-neon-green animate-bounce" style={{ animationDelay: '100ms' }} />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Nouveau niveau</p>
                <div className="px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 shadow-lg shadow-neon-green/20">
                  <span className="text-lg font-bold text-neon-green text-glow-green">{levelInfo.newLevel}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            <p className="text-center text-gray-400 text-sm">
              Felicitations ! Continuez comme ca pour debloquer de nouveaux privileges.
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-[10000ms] ease-linear"
                style={{ width: show ? '0%' : '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelUpNotification;
