import React from 'react';

interface NeonCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'magenta' | 'violet' | 'green' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const variantStyles = {
  default: {
    border: 'border-white/10',
    glow: '',
    hoverGlow: 'hover:border-white/20 hover:shadow-lg hover:shadow-white/5',
  },
  cyan: {
    border: 'border-neon-cyan/30',
    glow: 'shadow-lg shadow-neon-cyan/20',
    hoverGlow: 'hover:border-neon-cyan/60 hover:shadow-xl hover:shadow-neon-cyan/30',
  },
  magenta: {
    border: 'border-neon-magenta/30',
    glow: 'shadow-lg shadow-neon-magenta/20',
    hoverGlow: 'hover:border-neon-magenta/60 hover:shadow-xl hover:shadow-neon-magenta/30',
  },
  violet: {
    border: 'border-neon-violet/30',
    glow: 'shadow-lg shadow-neon-violet/20',
    hoverGlow: 'hover:border-neon-violet/60 hover:shadow-xl hover:shadow-neon-violet/30',
  },
  green: {
    border: 'border-neon-green/30',
    glow: 'shadow-lg shadow-neon-green/20',
    hoverGlow: 'hover:border-neon-green/60 hover:shadow-xl hover:shadow-neon-green/30',
  },
  gradient: {
    border: 'border-transparent',
    glow: '',
    hoverGlow: '',
  },
};

const NeonCard: React.FC<NeonCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  onClick,
  animate = true,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden
        bg-gradient-to-br from-dark-800/90 to-dark-700/80
        backdrop-blur-xl
        border ${styles.border}
        ${glow ? styles.glow : ''}
        ${hover ? `${styles.hoverGlow} cursor-pointer` : ''}
        ${animate ? 'transition-all duration-300 ease-out' : ''}
        ${hover ? 'hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Gradient border overlay for gradient variant */}
      {variant === 'gradient' && (
        <div 
          className="absolute inset-0 rounded-xl p-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.5), rgba(255, 0, 255, 0.5), rgba(139, 92, 246, 0.5))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Shimmer effect on hover */}
      {hover && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div 
            className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default NeonCard;
