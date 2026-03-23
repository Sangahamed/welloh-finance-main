import React, { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, BellIcon, UserIcon, ChartTrendingUpIcon } from './icons/Icons';
import { useAuth } from '../contexts/AuthContext';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const commonNavItems = [
    { id: 'simulation', label: 'Dashboard', icon: ChartTrendingUpIcon },
    { id: 'analysis', label: 'Analyse' },
    { id: 'strategy', label: 'Mentor IA' },
    { id: 'education', label: 'Apprendre' },
    { id: 'quiz', label: 'Quiz IA' },
    { id: 'predictions', label: 'Prédictions' },
    { id: 'leaderboard', label: 'Classement' },
    { id: 'badges', label: 'Badges' },
    { id: 'tenders', label: 'Opportunités' },
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Admin' }
  ];

  const navItems = currentUser?.role === 'admin' ? [...commonNavItems, ...adminNavItems] : commonNavItems;

  // Desktop nav link component
  const NavLink: React.FC<{ item: typeof navItems[0]; isActive: boolean }> = ({ item, isActive }) => (
    <a
      href={`#${item.id}`}
      onClick={(e) => { e.preventDefault(); handleNavigation(item.id); }}
      className={`
        relative px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-300 ease-out
        ${isActive 
          ? 'text-neon-cyan' 
          : 'text-gray-400 hover:text-white'
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <>
          <span className="absolute inset-0 rounded-lg bg-neon-cyan/10" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-neon-cyan rounded-full shadow-lg shadow-neon-cyan/50" />
        </>
      )}
      <span className="relative">{item.label}</span>
    </a>
  );

  // Mobile nav link component
  const MobileNavLink: React.FC<{ item: typeof navItems[0]; isActive: boolean }> = ({ item, isActive }) => (
    <a
      href={`#${item.id}`}
      onClick={(e) => { e.preventDefault(); handleNavigation(item.id); }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        font-medium transition-all duration-300
        ${isActive 
          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' 
          : 'text-gray-300 hover:bg-white/5'
        }
      `}
    >
      {item.label}
      {isActive && (
        <span className="ml-auto w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
      )}
    </a>
  );

  return (
    <header 
      className={`
        sticky top-0 z-50
        transition-all duration-300
        ${isScrolled 
          ? 'bg-dark-900/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a 
            href="#"
            onClick={(e) => { e.preventDefault(); handleNavigation(currentUser ? 'simulation' : 'landing'); }}
            className="flex items-center gap-3 group"
          >
            {/* Logo icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-neon-cyan/30 blur-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5">
                <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-cyan" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                    <path d="M21 18H3v2h18v-2z"/>
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
              Welloh
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {currentUser && navItems.map(item => (
              <NavLink key={item.id} item={item} isActive={currentPage === item.id} />
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="
                      relative p-2.5 rounded-xl
                      bg-dark-700/50 border border-white/10
                      text-gray-400 hover:text-white
                      hover:border-neon-cyan/30 hover:bg-dark-600/50
                      transition-all duration-300
                    "
                  >
                    <BellIcon className="w-5 h-5" />
                    {/* Notification badge */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-magenta text-[10px] font-bold flex items-center justify-center animate-pulse">
                      3
                    </span>
                  </button>

                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl p-4 animate-slide-down">
                      <h3 className="font-semibold text-white mb-3">Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <div className="w-2 h-2 rounded-full bg-neon-green mt-2" />
                          <div>
                            <p className="text-sm text-white">Votre ordre a ete execute</p>
                            <p className="text-xs text-gray-500 mt-1">Il y a 5 minutes</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <div className="w-2 h-2 rounded-full bg-neon-cyan mt-2" />
                          <div>
                            <p className="text-sm text-white">Nouveau badge debloque !</p>
                            <p className="text-xs text-gray-500 mt-1">Il y a 1 heure</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="hidden md:flex items-center gap-3">
                  {/* Level badge */}
                  <NeonBadge variant="violet" size="sm" glow>
                    Nv. {currentUser.level || 1}
                  </NeonBadge>

                  {/* Profile button */}
                  <button
                    onClick={() => onNavigate(`profile/${currentUser.id}`)}
                    className="
                      flex items-center gap-2 px-3 py-2 rounded-xl
                      bg-dark-700/50 border border-white/10
                      hover:border-neon-cyan/30 hover:bg-dark-600/50
                      transition-all duration-300 group
                    "
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                      <span className="text-sm font-bold text-dark-900">
                        {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {currentUser.fullName?.split(' ')[0] || 'Profil'}
                    </span>
                  </button>

                  {/* Logout button */}
                  <button
                    onClick={logout}
                    className="
                      p-2.5 rounded-xl
                      text-gray-400 hover:text-red-400
                      hover:bg-red-500/10
                      transition-all duration-300
                    "
                    title="Deconnexion"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <NeonButton 
                  variant="ghost" 
                  size="md"
                  onClick={() => onNavigate('login')}
                >
                  Connexion
                </NeonButton>
                <NeonButton 
                  variant="cyan" 
                  size="md"
                  onClick={() => onNavigate('signup')}
                >
                  S'inscrire
                </NeonButton>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="
                lg:hidden p-2.5 rounded-xl
                bg-dark-700/50 border border-white/10
                text-gray-400 hover:text-white
                transition-all duration-300
              "
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`
          lg:hidden overflow-hidden transition-all duration-300 ease-out
          ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 py-6 bg-dark-800/95 backdrop-blur-xl border-t border-white/10">
          {/* Navigation links */}
          {currentUser && (
            <nav className="space-y-2 mb-6">
              {navItems.map(item => (
                <MobileNavLink key={item.id} item={item} isActive={currentPage === item.id} />
              ))}
            </nav>
          )}

          {/* User section */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            {currentUser ? (
              <>
                <button
                  onClick={() => handleNavigation(`profile/${currentUser.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                    <span className="font-bold text-dark-900">
                      {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{currentUser.fullName}</p>
                    <p className="text-sm text-gray-400">Niveau {currentUser.level || 1}</p>
                  </div>
                </button>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <NeonButton 
                  variant="outline" 
                  size="lg"
                  fullWidth
                  onClick={() => handleNavigation('login')}
                >
                  Connexion
                </NeonButton>
                <NeonButton 
                  variant="cyan" 
                  size="lg"
                  fullWidth
                  onClick={() => handleNavigation('signup')}
                >
                  S'inscrire
                </NeonButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
