import React from 'react';

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'magenta' | 'violet' | 'green' | 'orange' | 'gold' | 'silver' | 'bronze';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  cyan: {
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/40',
    text: 'text-neon-cyan',
    glow: 'shadow-md shadow-neon-cyan/30',
  },
  magenta: {
    bg: 'bg-neon-magenta/10',
    border: 'border-neon-magenta/40',
    text: 'text-neon-magenta',
    glow: 'shadow-md shadow-neon-magenta/30',
  },
  violet: {
    bg: 'bg-neon-violet/10',
    border: 'border-neon-violet/40',
    text: 'text-neon-violet',
    glow: 'shadow-md shadow-neon-violet/30',
  },
  green: {
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/40',
    text: 'text-neon-green',
    glow: 'shadow-md shadow-neon-green/30',
  },
  orange: {
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange/40',
    text: 'text-neon-orange',
    glow: 'shadow-md shadow-neon-orange/30',
  },
  gold: {
    bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-400/50',
    text: 'text-yellow-400',
    glow: 'shadow-md shadow-yellow-400/30',
  },
  silver: {
    bg: 'bg-gradient-to-r from-gray-300/20 to-gray-400/20',
    border: 'border-gray-300/50',
    text: 'text-gray-300',
    glow: 'shadow-md shadow-gray-300/30',
  },
  bronze: {
    bg: 'bg-gradient-to-r from-orange-600/20 to-orange-700/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-md shadow-orange-500/30',
  },
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const NeonBadge: React.FC<NeonBadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  glow = false,
  className = '',
  icon,
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`
        relative inline-flex items-center gap-1
        font-semibold rounded-full
        border backdrop-blur-sm
        ${styles.bg}
        ${styles.border}
        ${styles.text}
        ${glow ? styles.glow : ''}
        ${pulse ? 'animate-glow-pulse' : ''}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {/* Pulse ring effect */}
      {pulse && (
        <span 
          className={`
            absolute inset-0 rounded-full
            ${styles.border}
            animate-pulse-ring
          `}
        />
      )}

      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default NeonBadge;
