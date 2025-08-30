import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../Common/Button';
import { useAuth } from './AuthProvider';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      
      let errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      
      if (err?.message) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Compte non activé. Contactez un administrateur.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives. Patientez quelques minutes.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setLoading(true);
    setError(null);
    
    try {
      await signIn(testEmail, testPassword);
    } catch (err: any) {
      console.error('Erreur de test de connexion:', err);
      setError('Erreur lors de la connexion de test. Vérifiez que les comptes de test existent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Connexion</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </div>
      </form>
      
      <div className="mt-6 space-y-2">
        <div className="text-center text-sm text-gray-600 mb-3">Comptes de test :</div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleTestLogin('admin@chantier.com', 'admin123')}
          disabled={loading}
          className="w-full text-sm"
          size="sm"
        >
          Connexion Admin
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleTestLogin('manager@chantier.com', 'manager123')}
          disabled={loading}
          className="w-full text-sm"
          size="sm"
        >
          Connexion Manager
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleTestLogin('employe@chantier.com', 'employe123')}
          disabled={loading}
          className="w-full text-sm"
          size="sm"
        >
          Connexion Employé
        </Button>
      </div>
    </div>
  );
};