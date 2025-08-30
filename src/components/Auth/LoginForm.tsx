import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '../Common/Button';
import { useAuth } from './AuthProvider';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('Erreur de connexion complète:', err);
      
      let errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Votre compte n\'est pas encore activé. Veuillez contacter un administrateur.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour tester la connexion avec un utilisateur par défaut
  const handleTestLogin = async () => {
    setEmail('admin@chantier.com');
    setPassword('admin123');
    setLoading(true);
    setError(null);
    
    try {
      await signIn('admin@chantier.com', 'admin123');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de test de connexion';
      
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Votre compte n\'est pas encore activé. Veuillez contacter un administrateur.');
      } else if (errorMessage.includes('User not found')) {
        setError('Utilisateur de test non trouvé. Veuillez créer un compte administrateur.');
      } else {
        setError(errorMessage);
      }
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
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Se souvenir de moi
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Mot de passe oublié ?
            </a>
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

        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full"
          >
            Connexion test (admin@chantier.com)
          </Button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Comptes de test disponibles :</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Admin :</strong> admin@chantier.com / admin123</p>
          <p><strong>Manager :</strong> manager@chantier.com / manager123</p>
          <p><strong>Employé :</strong> employe@chantier.com / employe123</p>
        </div>
      </div>
    </div>
  );
};