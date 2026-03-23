import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

interface AnimatedBackgroundProps {
  variant?: 'default' | 'minimal' | 'intense';
  showGrid?: boolean;
  showParticles?: boolean;
  showScanLines?: boolean;
  particleCount?: number;
  className?: string;
}

const NEON_COLORS = [
  'rgba(0, 255, 255, 0.6)',   // cyan
  'rgba(255, 0, 255, 0.5)',   // magenta
  'rgba(139, 92, 246, 0.5)',  // violet
  'rgba(0, 255, 136, 0.4)',   // green
  'rgba(0, 212, 255, 0.5)',   // blue
];

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'default',
  showGrid = true,
  showParticles = true,
  showScanLines = true,
  particleCount = 50,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  const initParticles = useCallback((width: number, height: number) => {
    const count = variant === 'intense' ? particleCount * 1.5 : variant === 'minimal' ? particleCount * 0.5 : particleCount;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));
  }, [particleCount, variant]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const gridSize = 60;
    const perspective = 0.002;
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal lines with perspective effect
    for (let y = 0; y < height; y += gridSize) {
      const offset = (time * 0.02) % gridSize;
      const yPos = y + offset;
      const alpha = 0.03 + Math.sin(time * 0.001 + y * 0.01) * 0.02;
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      const alpha = 0.03 + Math.sin(time * 0.001 + x * 0.01) * 0.02;
      ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Glowing center cross
    const centerX = width / 2;
    const centerY = height / 2;
    const glowIntensity = 0.1 + Math.sin(time * 0.002) * 0.05;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2);
    gradient.addColorStop(0, `rgba(139, 92, 246, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(0, 255, 255, ${glowIntensity * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    particlesRef.current.forEach((particle) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.pulse += particle.pulseSpeed;

      // Mouse interaction
      const dx = mouseRef.current.x - particle.x;
      const dy = mouseRef.current.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150;
        particle.speedX -= (dx / dist) * force * 0.02;
        particle.speedY -= (dy / dist) * force * 0.02;
      }

      // Boundary check with wrap
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      // Apply friction
      particle.speedX *= 0.99;
      particle.speedY *= 0.99;

      // Pulsing size
      const pulseSize = particle.size + Math.sin(particle.pulse) * 0.5;
      const pulseOpacity = particle.opacity + Math.sin(particle.pulse) * 0.1;

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, pulseSize * 2, 0, Math.PI * 2);
      ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${pulseOpacity * 0.3})`);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${pulseOpacity})`);
      ctx.fill();

      // Draw connections to nearby particles
      particlesRef.current.forEach((other) => {
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120 && distance > 0) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          const alpha = (1 - distance / 120) * 0.15;
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
  }, []);

  const drawScanLines = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Moving scan line
    const scanY = (time * 0.1) % (height + 100) - 50;
    const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.1)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanY - 50, width, 100);

    // Static scan line effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let startTime = Date.now();

    const animate = () => {
      const time = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height, time);
      }

      if (showParticles) {
        drawParticles(ctx, canvas.width, canvas.height, time);
      }

      if (showScanLines) {
        drawScanLines(ctx, canvas.width, canvas.height, time);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showGrid, showParticles, showScanLines, initParticles, drawGrid, drawParticles, drawScanLines]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: 0 }}>
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 0, 255, 0.05) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)
          `
        }}
      />
      
      {/* Animated canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.4) 70%, rgba(10, 10, 15, 0.8) 100%)'
        }}
      />

      {/* Noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
