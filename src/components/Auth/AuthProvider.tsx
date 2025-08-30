import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type UtilisateurRow = Database['public']['Tables']['utilisateurs']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  utilisateur: UtilisateurRow | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [utilisateur, setUtilisateur] = useState<UtilisateurRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les données utilisateur depuis la base
  const fetchUserData = async (userEmail: string): Promise<UtilisateurRow | null> => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Utilisateur non trouvé dans la table utilisateurs');
          return null;
        }
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  };

  // Fonction pour mettre à jour la dernière connexion
  const updateLastConnection = async (userId: string) => {
    try {
      await supabase
        .from('utilisateurs')
        .update({ derniere_connexion: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Récupérer la session actuelle
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user?.email) {
            const userData = await fetchUserData(session.user.email);
            setUtilisateur(userData);
            
            if (userData) {
              await updateLastConnection(userData.id);
            }
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        try {
          const userData = await fetchUserData(session.user.email);
          setUtilisateur(userData);
          
          if (userData) {
            await updateLastConnection(userData.id);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          setUtilisateur(null);
        }
      } else {
        setUtilisateur(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        console.error('Erreur de connexion Supabase:', error);
        throw error;
      }
      
      console.log('Connexion réussie:', data.user?.email);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      // Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('Erreur d\'inscription Supabase:', error);
        throw error;
      }
      
      // Créer l'utilisateur dans la table utilisateurs
      if (data.user) {
        const { error: insertError } = await supabase
          .from('utilisateurs')
          .insert({
            nom: userData.nom,
            prenom: userData.prenom,
            email: email.trim(),
            role: userData.role || 'employe',
            actif: true,
            permissions: userData.role === 'admin' 
              ? ['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
              : userData.role === 'manager'
              ? ['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports']
              : ['read', 'view_reports']
          });
        
        if (insertError) {
          console.error('Erreur lors de la création de l\'utilisateur:', insertError);
          throw insertError;
        }
      }
      
      console.log('Inscription réussie:', data.user?.email);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur de déconnexion:', error);
        throw error;
      }
      setUtilisateur(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erreur de réinitialisation du mot de passe:', error);
      throw error;
    }
  };

  // Fonction pour vérifier les permissions
  const hasPermission = (permission: string): boolean => {
    if (!utilisateur) return false;
    if (!utilisateur.permissions) return false;
    return utilisateur.permissions.includes(permission);
  };

  // Fonction pour vérifier le rôle
  const isRole = (role: string): boolean => {
    if (!utilisateur) return false;
    return utilisateur.role === role;
  };

  const value = {
    session,
    user,
    utilisateur,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
    isRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};