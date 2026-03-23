import React, { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'square' | 'circle' | 'star';
}

const DEFAULT_COLORS = [
  '#00FFFF', // cyan
  '#FF00FF', // magenta
  '#8B5CF6', // violet
  '#00FF88', // green
  '#FFD700', // gold
  '#FF1493', // pink
];

const Confetti: React.FC<ConfettiProps> = ({
  isActive,
  duration = 3000,
  particleCount = 100,
  colors = DEFAULT_COLORS,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const shapes: Array<'square' | 'circle' | 'star'> = ['square', 'circle', 'star'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 20 - 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    return particles;
  }, [particleCount, colors]);

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number
  ) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = createParticles(canvas.width, canvas.height);
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update physics
        particle.vy += 0.5; // gravity
        particle.vx *= 0.99; // air resistance
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        
        // Fade out
        if (elapsed > duration * 0.7) {
          particle.opacity = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        switch (particle.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'star':
            drawStar(ctx, particle.x, particle.y, particle.size / 2, particle.rotation);
            break;
          default: // square
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            ctx.restore();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, duration, createParticles, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
};

export default Confetti;
