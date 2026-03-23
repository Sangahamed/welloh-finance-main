import React, { useState, useRef } from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'magenta' | 'violet' | 'green' | 'orange' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles = {
  cyan: {
    base: 'bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 border-neon-cyan/50 text-neon-cyan',
    hover: 'hover:from-neon-cyan/30 hover:to-neon-blue/30 hover:border-neon-cyan hover:shadow-lg hover:shadow-neon-cyan/30',
    glow: 'shadow-md shadow-neon-cyan/20',
  },
  magenta: {
    base: 'bg-gradient-to-r from-neon-magenta/20 to-neon-pink/20 border-neon-magenta/50 text-neon-magenta',
    hover: 'hover:from-neon-magenta/30 hover:to-neon-pink/30 hover:border-neon-magenta hover:shadow-lg hover:shadow-neon-magenta/30',
    glow: 'shadow-md shadow-neon-magenta/20',
  },
  violet: {
    base: 'bg-gradient-to-r from-neon-violet/20 to-purple-500/20 border-neon-violet/50 text-neon-violet',
    hover: 'hover:from-neon-violet/30 hover:to-purple-500/30 hover:border-neon-violet hover:shadow-lg hover:shadow-neon-violet/30',
    glow: 'shadow-md shadow-neon-violet/20',
  },
  green: {
    base: 'bg-gradient-to-r from-neon-green/20 to-emerald-500/20 border-neon-green/50 text-neon-green',
    hover: 'hover:from-neon-green/30 hover:to-emerald-500/30 hover:border-neon-green hover:shadow-lg hover:shadow-neon-green/30',
    glow: 'shadow-md shadow-neon-green/20',
  },
  orange: {
    base: 'bg-gradient-to-r from-neon-orange/20 to-amber-500/20 border-neon-orange/50 text-neon-orange',
    hover: 'hover:from-neon-orange/30 hover:to-amber-500/30 hover:border-neon-orange hover:shadow-lg hover:shadow-neon-orange/30',
    glow: 'shadow-md shadow-neon-orange/20',
  },
  ghost: {
    base: 'bg-transparent border-transparent text-gray-300',
    hover: 'hover:bg-white/5 hover:text-white',
    glow: '',
  },
  outline: {
    base: 'bg-transparent border-white/20 text-gray-300',
    hover: 'hover:bg-white/5 hover:border-white/40 hover:text-white',
    glow: '',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-3',
};

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left',
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center
        font-semibold rounded-lg
        border backdrop-blur-sm
        transition-all duration-300 ease-out
        ${styles.base}
        ${!disabled && !loading ? styles.hover : ''}
        ${!disabled && !loading ? styles.glow : ''}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${loading ? 'cursor-wait' : ''}
        ${!disabled && !loading ? 'active:scale-95' : ''}
        ${className}
      `}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Icon left */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Content */}
      <span className="relative z-10">{children}</span>

      {/* Icon right */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default NeonButton;
