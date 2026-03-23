import React from 'react';
import AnimatedBackground from './ui/AnimatedBackground';

interface AuthLayoutProps {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subTitle, children }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground variant="minimal" showScanLines={false} particleCount={30} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          {/* Animated Logo */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-neon-cyan/30 blur-xl rounded-full animate-pulse" />
              
              {/* Logo */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5">
                <div className="w-full h-full rounded-2xl bg-dark-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neon-cyan" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                    <path d="M21 18H3v2h18v-2z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <span className="ml-4 text-3xl font-bold font-display bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
              Welloh
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white animate-fade-in">
            {title}
          </h1>
          
          {subTitle && (
            <p className="mt-2 text-gray-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {subTitle}
            </p>
          )}
        </div>

        {/* Card */}
        <div 
          className="relative animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Gradient border */}
          <div 
            className="absolute -inset-0.5 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta rounded-2xl opacity-50 blur-sm"
          />
          
          {/* Card content */}
          <div className="relative bg-dark-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-cyan/50 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-violet/50 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-violet/50 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-magenta/50 rounded-br-2xl" />
            
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          En continuant, vous acceptez nos{' '}
          <a href="#" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors">
            Conditions d'utilisation
          </a>
          {' '}et{' '}
          <a href="#" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors">
            Politique de confidentialite
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
