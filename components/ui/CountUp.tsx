import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
  onComplete?: () => void;
  showChange?: boolean;
  previousValue?: number;
}

const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

const CountUp: React.FC<CountUpProps> = ({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
  onComplete,
  showChange = false,
  previousValue,
}) => {
  const [displayValue, setDisplayValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | null>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const previousEndRef = useRef(start);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== end) {
      setChangeDirection(end > previousValue ? 'up' : 'down');
      setTimeout(() => setChangeDirection(null), 1000);
    }
  }, [end, previousValue]);

  useEffect(() => {
    const startValue = previousEndRef.current;
    previousEndRef.current = end;
    
    setIsAnimating(true);
    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentValue = startValue + (end - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
        setIsAnimating(false);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, onComplete]);

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        ${isAnimating ? 'tabular-nums' : ''}
        ${changeDirection === 'up' ? 'text-neon-green' : ''}
        ${changeDirection === 'down' ? 'text-red-500' : ''}
        transition-colors duration-300
        ${className}
      `}
    >
      {prefix}
      <span className={changeDirection ? 'animate-bounce-in' : ''}>
        {formatNumber(displayValue)}
      </span>
      {suffix}
      
      {/* Change indicator */}
      {showChange && changeDirection && (
        <span className={`
          inline-flex items-center text-xs ml-1
          ${changeDirection === 'up' ? 'text-neon-green' : 'text-red-500'}
          animate-fade-in
        `}>
          {changeDirection === 'up' ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      )}
    </span>
  );
};

export default CountUp;
