import React, { useState, useEffect, useRef } from 'react';
import AnimatedBackground from './ui/AnimatedBackground';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import CountUp from './ui/CountUp';
import NeonBadge from './ui/NeonBadge';
import { ChartTrendingUpIcon, GlobeAltIcon, SparklesIcon, ShieldCheckIcon, BookOpenIcon, UsersIcon, TrophyIcon, BoltIcon } from './icons/Icons';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

// Typewriter effect hook
const useTypewriter = (text: string, speed: number = 50, delay: number = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return interval;
    };

    timeout = setTimeout(() => {
      const interval = startTyping();
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayText, isComplete };
};

// Animated stat card
const StatCard: React.FC<{ value: number; suffix?: string; prefix?: string; label: string; icon: React.ReactNode; delay?: number }> = 
  ({ value, suffix = '', prefix = '', label, icon, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`
      text-center transform transition-all duration-700
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
    `}>
      <div className="flex justify-center mb-3">
        <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
          {icon}
        </div>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white font-display">
        {isVisible && <CountUp end={value} prefix={prefix} suffix={suffix} duration={2500} />}
      </div>
      <div className="mt-1 text-sm text-gray-400">{label}</div>
    </div>
  );
};

// Feature card with hover effects
const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  variant?: 'cyan' | 'magenta' | 'violet' | 'green';
  delay?: number;
}> = ({ icon, title, description, variant = 'cyan', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const iconColors = {
    cyan: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30',
    magenta: 'text-neon-magenta bg-neon-magenta/10 border-neon-magenta/30',
    violet: 'text-neon-violet bg-neon-violet/10 border-neon-violet/30',
    green: 'text-neon-green bg-neon-green/10 border-neon-green/30',
  };

  return (
    <div 
      ref={ref}
      className={`
        transform transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <NeonCard variant={variant} className="p-6 h-full">
        <div className={`
          inline-flex p-3 rounded-xl border
          ${iconColors[variant]}
        `}>
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-gray-400 leading-relaxed">{description}</p>
      </NeonCard>
    </div>
  );
};

// Trust badge component
const TrustBadge: React.FC<{ name: string; delay?: number }> = ({ name, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`
      px-6 py-3 rounded-xl
      bg-dark-700/50 border border-white/5
      backdrop-blur-sm
      transform transition-all duration-500
      hover:border-neon-cyan/30 hover:bg-dark-600/50
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `}>
      <span className="text-lg font-medium text-gray-400 hover:text-neon-cyan transition-colors">
        {name}
      </span>
    </div>
  );
};

const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { displayText: heroText, isComplete: heroComplete } = useTypewriter(
    'Simulez, analysez, excellez.',
    60,
    500
  );

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground variant="default" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8">
            <NeonBadge variant="violet" size="md" pulse>
              <SparklesIcon className="w-4 h-4" />
              Plateforme de simulation boursiere #1
            </NeonBadge>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span 
              className="block text-white mb-4 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Pilotez votre avenir
            </span>
            <span 
              className="block bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta bg-clip-text text-transparent font-display animate-fade-in-up"
              style={{ 
                animationDelay: '0.4s',
                textShadow: '0 0 80px rgba(0, 255, 255, 0.5)'
              }}
            >
              financier
            </span>
          </h1>

          {/* Typewriter subtitle */}
          <div className="mt-8 h-12 flex items-center justify-center">
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-display">
              {heroText}
              <span className={`
                inline-block w-0.5 h-6 ml-1 bg-neon-cyan
                ${heroComplete ? 'opacity-0' : 'animate-pulse'}
              `} />
            </p>
          </div>

          {/* Description */}
          <p 
            className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 animate-fade-in-up"
            style={{ animationDelay: '1s' }}
          >
            Entrainez-vous sans risque sur les marches mondiaux et africains, analysez avec l'IA, 
            et transformez vos performances en opportunites de carriere.
          </p>

          {/* CTA Buttons */}
          <div 
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: '1.2s' }}
          >
            <NeonButton 
              variant="cyan" 
              size="xl"
              onClick={() => onNavigate('signup')}
              icon={<BoltIcon className="w-5 h-5" />}
            >
              Commencer gratuitement
            </NeonButton>
            <NeonButton 
              variant="outline" 
              size="xl"
              onClick={() => onNavigate('login')}
            >
              Se connecter
            </NeonButton>
          </div>

          {/* Stats */}
          <div 
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up"
            style={{ animationDelay: '1.4s' }}
          >
            <StatCard value={15000} suffix="+" label="Traders actifs" icon={<UsersIcon className="w-6 h-6" />} delay={1600} />
            <StatCard value={2} prefix="$" suffix="M+" label="Volume simule" icon={<ChartTrendingUpIcon className="w-6 h-6" />} delay={1800} />
            <StatCard value={50} suffix="+" label="Bourses mondiales" icon={<GlobeAltIcon className="w-6 h-6" />} delay={2000} />
            <StatCard value={98} suffix="%" label="Taux de satisfaction" icon={<TrophyIcon className="w-6 h-6" />} delay={2200} />
          </div>

          {/* Dashboard preview */}
          <div 
            className="mt-24 relative animate-fade-in-up"
            style={{ 
              animationDelay: '1.6s',
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/30 via-neon-violet/30 to-neon-magenta/30 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              
              {/* Border gradient */}
              <div className="relative p-1 rounded-2xl bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta">
                <div className="bg-dark-900 rounded-xl overflow-hidden">
                  <img 
                    src="https://i.imgur.com/uG9G6Qc.png" 
                    alt="Dashboard Welloh" 
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-8 -right-8 p-4 glass-card rounded-xl animate-float hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-neon-green font-semibold">+24.5%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Performance mensuelle</p>
              </div>

              <div className="absolute -bottom-6 -left-6 p-4 glass-card rounded-xl animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">Rank #42</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Leaderboard global</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-neon-cyan rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-10">
            ILS NOUS FONT CONFIANCE
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <TrustBadge name="Societe Generale" delay={100} />
            <TrustBadge name="BNP Paribas" delay={200} />
            <TrustBadge name="Standard Chartered" delay={300} />
            <TrustBadge name="Ecobank" delay={400} />
            <TrustBadge name="BRVM" delay={500} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-20">
            <NeonBadge variant="cyan" size="sm" className="mb-4">
              FONCTIONNALITES
            </NeonBadge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Tout ce dont vous avez besoin pour
              <span className="block mt-2 text-glow-cyan text-neon-cyan">exceller en trading</span>
            </h2>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ChartTrendingUpIcon className="w-6 h-6" />}
              title="Simulation realiste"
              description="Tradez avec 100 000 $ virtuels sur des donnees de marche realistes generees par IA. Aucun risque, apprentissage maximal."
              variant="cyan"
              delay={0}
            />
            <FeatureCard 
              icon={<SparklesIcon className="w-6 h-6" />}
              title="Analyse IA avancee"
              description="Obtenez des analyses financieres, projections et recommandations personnalisees pour chaque action en secondes."
              variant="magenta"
              delay={100}
            />
            <FeatureCard 
              icon={<GlobeAltIcon className="w-6 h-6" />}
              title="Marches mondiaux"
              description="Acces aux bourses BRVM, JSE, NYSE, NASDAQ et plus. Explorez les opportunites africaines et internationales."
              variant="violet"
              delay={200}
            />
            <FeatureCard 
              icon={<TrophyIcon className="w-6 h-6" />}
              title="Competitions & Classements"
              description="Affrontez d'autres traders, gagnez des badges et grimpez dans le leaderboard pour vous faire reperer."
              variant="green"
              delay={300}
            />
            <FeatureCard 
              icon={<BookOpenIcon className="w-6 h-6" />}
              title="Formation integree"
              description="Modules educatifs, tutoriels interactifs et mentor IA pour ameliorer vos strategies d'investissement."
              variant="cyan"
              delay={400}
            />
            <FeatureCard 
              icon={<ShieldCheckIcon className="w-6 h-6" />}
              title="Securite maximale"
              description="Cryptage de niveau bancaire et meilleures pratiques de securite pour proteger vos informations."
              variant="magenta"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-32 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-violet/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <NeonBadge variant="magenta" size="sm" className="mb-4">
              COMMENT CA MARCHE
            </NeonBadge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Devenez un expert en
              <span className="block mt-2 text-glow-magenta text-neon-magenta">3 etapes simples</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

            {[
              { step: '01', title: 'Inscrivez-vous', desc: 'Creez votre compte gratuitement et recevez 100 000 $ virtuels pour commencer.' },
              { step: '02', title: 'Simulez', desc: 'Achetez et vendez des actions sur les marches mondiaux avec des donnees realistes.' },
              { step: '03', title: 'Excellez', desc: 'Analysez vos performances, ameliorez-vous et faites-vous reperer par les recruteurs.' },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <NeonCard variant="gradient" className="p-8 text-center h-full">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta mb-6">
                    <span className="text-2xl font-bold text-dark-900 font-display">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </NeonCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <NeonBadge variant="green" size="sm" className="mb-4">
              TEMOIGNAGES
            </NeonBadge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Ce que disent nos
              <span className="block mt-2 text-glow-green text-neon-green">traders</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Amadou K.', role: 'Trader Junior - Ecobank', text: 'Grace a Welloh, j\'ai pu m\'entrainer et decrocher mon premier poste dans la finance. L\'analyse IA est incroyable!' },
              { name: 'Fatima M.', role: 'Etudiante Finance - HEC Paris', text: 'La meilleure plateforme pour apprendre le trading. Les competitions m\'ont vraiment motive a m\'ameliorer.' },
              { name: 'Jean-Pierre L.', role: 'Analyste - SG Afrique', text: 'Je recommande Welloh a tous mes collegues juniors. C\'est un outil pedagogique exceptionnel.' },
            ].map((testimonial, index) => (
              <NeonCard key={index} variant="default" className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                    <span className="text-lg font-bold text-dark-900">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-neon-cyan">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">"{testimonial.text}"</p>
                <div className="mt-6 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </NeonCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Pret a rejoindre
              <span className="block mt-2 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta bg-clip-text text-transparent">
                l'elite financiere?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Les meilleurs talents de notre plateforme sont reperes par les plus grandes institutions financieres.
            </p>
            <NeonButton 
              variant="cyan" 
              size="xl"
              onClick={() => onNavigate('signup')}
              className="px-12"
            >
              Commencer maintenant
            </NeonButton>
            <p className="mt-6 text-sm text-gray-500">
              Gratuit pour toujours. Aucune carte de credit requise.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
