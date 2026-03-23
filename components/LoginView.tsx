import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import NeonButton from './ui/NeonButton';
import NeonInput from './ui/NeonInput';
import { ExclamationTriangleIcon, GoogleIcon, AppleIcon, EnvelopeIcon, LockClosedIcon } from './icons/Icons';

interface LoginViewProps {
  onNavigate: (page: string) => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode; providerName: string; onClick?: () => void }> = ({ 
  icon, 
  providerName,
  onClick 
}) => (
  <button
    type="button"
    onClick={onClick}
    className="
      w-full flex items-center justify-center gap-3
      px-4 py-3 rounded-xl
      bg-dark-700/50 border border-white/10
      text-gray-300 font-medium
      transition-all duration-300
      hover:bg-dark-600/50 hover:border-white/20
      hover:shadow-lg hover:shadow-white/5
      active:scale-[0.98]
    "
  >
    <span className="w-5 h-5">{icon}</span>
    Continuer avec {providerName}
  </button>
);

const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      onNavigate('simulation');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Ravis de vous revoir !">
      {/* Social login buttons */}
      <div className="space-y-3">
        <SocialButton icon={<GoogleIcon />} providerName="Google" />
        <SocialButton icon={<AppleIcon />} providerName="Apple" />
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-sm text-gray-500 bg-dark-800">
            ou continuer avec l'email
          </span>
        </div>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div 
            className="
              flex items-start gap-3 p-4 rounded-xl
              bg-red-500/10 border border-red-500/30
              animate-slide-down
            "
            role="alert"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Email field */}
        <NeonInput
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="votre@email.com"
          icon={<EnvelopeIcon className="w-5 h-5" />}
          iconPosition="left"
        />

        {/* Password field */}
        <div>
          <NeonInput
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Votre mot de passe"
            icon={<LockClosedIcon className="w-5 h-5" />}
            iconPosition="left"
          />
          <div className="mt-2 text-right">
            <a 
              href="#" 
              className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
            >
              Mot de passe oublie ?
            </a>
          </div>
        </div>

        {/* Submit button */}
        <NeonButton
          type="submit"
          variant="cyan"
          size="lg"
          fullWidth
          loading={isLoading}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </NeonButton>
      </form>

      {/* Sign up link */}
      <div className="mt-8 text-center">
        <span className="text-gray-400">Pas encore de compte ? </span>
        <button
          onClick={() => onNavigate('signup')}
          className="font-semibold text-neon-cyan hover:text-neon-cyan/80 transition-colors"
        >
          S'inscrire
        </button>
      </div>
    </AuthLayout>
  );
};

export default LoginView;
