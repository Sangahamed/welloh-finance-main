import React, { useState, forwardRef } from 'react';

interface NeonInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'cyan' | 'magenta' | 'violet';
  inputSize?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    focus: 'focus:border-neon-cyan focus:shadow-lg focus:shadow-neon-cyan/20',
    icon: 'text-gray-400 group-focus-within:text-neon-cyan',
    label: 'text-gray-400 group-focus-within:text-neon-cyan',
  },
  cyan: {
    focus: 'focus:border-neon-cyan focus:shadow-lg focus:shadow-neon-cyan/20',
    icon: 'text-neon-cyan/60 group-focus-within:text-neon-cyan',
    label: 'text-neon-cyan/80 group-focus-within:text-neon-cyan',
  },
  magenta: {
    focus: 'focus:border-neon-magenta focus:shadow-lg focus:shadow-neon-magenta/20',
    icon: 'text-neon-magenta/60 group-focus-within:text-neon-magenta',
    label: 'text-neon-magenta/80 group-focus-within:text-neon-magenta',
  },
  violet: {
    focus: 'focus:border-neon-violet focus:shadow-lg focus:shadow-neon-violet/20',
    icon: 'text-neon-violet/60 group-focus-within:text-neon-violet',
    label: 'text-neon-violet/80 group-focus-within:text-neon-violet',
  },
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(({
  label,
  error,
  success,
  icon,
  iconPosition = 'left',
  variant = 'default',
  inputSize = 'md',
  className = '',
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const styles = variantStyles[variant];

  const getBorderColor = () => {
    if (error) return 'border-red-500 shadow-lg shadow-red-500/20';
    if (success) return 'border-neon-green shadow-lg shadow-neon-green/20';
    return 'border-white/10';
  };

  return (
    <div className="group w-full">
      {/* Floating label */}
      {label && (
        <label
          className={`
            block mb-2 text-sm font-medium
            transition-colors duration-300
            ${error ? 'text-red-400' : success ? 'text-neon-green' : styles.label}
          `}
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Icon left */}
        {icon && iconPosition === 'left' && (
          <div className={`
            absolute left-4 top-1/2 -translate-y-1/2
            transition-colors duration-300
            ${error ? 'text-red-400' : success ? 'text-neon-green' : styles.icon}
          `}>
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full rounded-lg
            bg-dark-800/80 backdrop-blur-sm
            border ${getBorderColor()}
            text-white placeholder-gray-500
            transition-all duration-300 ease-out
            ${!error && !success ? styles.focus : ''}
            ${sizeStyles[inputSize]}
            ${icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${icon && iconPosition === 'right' ? 'pr-12' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            outline-none
            ${className}
          `}
          {...props}
        />

        {/* Icon right */}
        {icon && iconPosition === 'right' && (
          <div className={`
            absolute right-4 top-1/2 -translate-y-1/2
            transition-colors duration-300
            ${error ? 'text-red-400' : success ? 'text-neon-green' : styles.icon}
          `}>
            {icon}
          </div>
        )}

        {/* Focus glow effect */}
        {isFocused && !error && !success && (
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent, rgba(0, 255, 255, 0.05), transparent)`,
            }}
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1 animate-slide-up">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Success message */}
      {success && !error && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-neon-green animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
});

NeonInput.displayName = 'NeonInput';

export default NeonInput;
