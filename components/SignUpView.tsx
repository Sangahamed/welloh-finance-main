import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import NeonButton from './ui/NeonButton';
import NeonInput from './ui/NeonInput';
import NeonCard from './ui/NeonCard';
import Confetti from './ui/Confetti';
import { 
  ExclamationTriangleIcon, 
  GoogleIcon, 
  AppleIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CheckCircleIcon
} from './icons/Icons';

interface SignUpViewProps {
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
    S'inscrire avec {providerName}
  </button>
);

const PasswordRequirement: React.FC<{ meets: boolean; text: string }> = ({ meets, text }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${meets ? 'text-neon-green' : 'text-gray-500'}`}>
    <div className={`
      w-4 h-4 rounded-full border flex items-center justify-center
      transition-all duration-300
      ${meets ? 'border-neon-green bg-neon-green/20' : 'border-gray-600'}
    `}>
      {meets && (
        <svg className="w-2.5 h-2.5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    {text}
  </div>
);

const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { signup } = useAuth();

  const isPasswordLongEnough = formData.password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const doPasswordsMatch = formData.password !== '' && formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isPasswordLongEnough) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    if (!doPasswordsMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setIsLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      await signup(signupData);
      setShowConfetti(true);
      setTimeout(() => {
        setIsSignedUp(true);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (isSignedUp) {
    return (
      <AuthLayout title="Bienvenue dans l'elite !">
        <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
        
        <div className="text-center space-y-6">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-green/10 border border-neon-green/30 animate-bounce-in">
            <CheckCircleIcon className="w-10 h-10 text-neon-green" />
          </div>

          <div className="space-y-3">
            <p className="text-xl font-semibold text-white">
              Inscription reussie !
            </p>
            <p className="text-gray-400">
              Un lien de confirmation a ete envoye a
            </p>
            <p className="text-neon-cyan font-semibold text-lg">
              {formData.email}
            </p>
          </div>

          <NeonCard variant="violet" className="p-4 text-left">
            <p className="text-sm text-gray-300">
              Verifiez votre boite de reception et cliquez sur le lien pour activer votre compte.
              N'oubliez pas de verifier vos spams !
            </p>
          </NeonCard>

          <NeonButton
            variant="cyan"
            size="lg"
            fullWidth
            onClick={() => onNavigate('login')}
          >
            Aller a la page de connexion
          </NeonButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Rejoignez Welloh">
      {/* Social signup buttons */}
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
            ou s'inscrire avec l'email
          </span>
        </div>
      </div>

      {/* Signup form */}
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

        {/* Account Information */}
        <div className="space-y-4">
          <NeonInput
            label="Nom complet"
            type="text"
            name="fullName"
            autoComplete="name"
            required
            value={formData.fullName}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Jean Dupont"
            icon={<UserIcon className="w-5 h-5" />}
            iconPosition="left"
          />

          <NeonInput
            label="Adresse e-mail"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="votre@email.com"
            icon={<EnvelopeIcon className="w-5 h-5" />}
            iconPosition="left"
          />

          <NeonInput
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Creez un mot de passe securise"
            icon={<LockClosedIcon className="w-5 h-5" />}
            iconPosition="left"
          />

          <NeonInput
            label="Confirmer le mot de passe"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Confirmez votre mot de passe"
            icon={<LockClosedIcon className="w-5 h-5" />}
            iconPosition="left"
            success={doPasswordsMatch}
          />

          {/* Password requirements */}
          <div className="flex flex-wrap gap-4 pt-2">
            <PasswordRequirement meets={isPasswordLongEnough} text="6+ caracteres" />
            <PasswordRequirement meets={hasUpperCase} text="1 majuscule" />
            <PasswordRequirement meets={hasNumber} text="1 chiffre" />
            <PasswordRequirement meets={doPasswordsMatch} text="Correspondent" />
          </div>
        </div>

        {/* Submit button */}

        {/* Submit button */}
        <NeonButton
          type="submit"
          variant="cyan"
          size="lg"
          fullWidth
          loading={isLoading}
        >
          {isLoading ? 'Creation du compte...' : 'Creer mon compte'}
        </NeonButton>
      </form>

      {/* Login link */}
      <div className="mt-8 text-center">
        <span className="text-gray-400">Deja un compte ? </span>
        <button
          onClick={() => onNavigate('login')}
          className="font-semibold text-neon-cyan hover:text-neon-cyan/80 transition-colors"
        >
          Se connecter
        </button>
      </div>
    </AuthLayout>
  );
};

export default SignUpView;
