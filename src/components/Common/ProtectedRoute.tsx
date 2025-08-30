import React from 'react';
import { useAuth } from '../Auth/AuthProvider';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallback
}) => {
  const { utilisateur, hasPermission, isRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Authentification requise</h2>
        <p className="text-gray-500">Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  if (!utilisateur.actif) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">Compte désactivé</h2>
        <p className="text-gray-500">Votre compte a été désactivé. Contactez un administrateur.</p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Accès restreint</h2>
        <p className="text-gray-500">
          Vous n'avez pas les permissions nécessaires pour accéder à cette section.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Permission requise: {requiredPermission}
        </p>
      </div>
    );
  }

  if (requiredRole && !isRole(requiredRole)) {
    return fallback || (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Accès restreint</h2>
        <p className="text-gray-500">
          Votre rôle ne vous permet pas d'accéder à cette section.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Rôle requis: {requiredRole}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};