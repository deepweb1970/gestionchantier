import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  User, 
  Search, 
  Database,
  History,
  Download, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { GlobalSearch } from '../Common/GlobalSearch';
import { NotificationCenter } from '../Common/NotificationCenter';
import { BackupSystem } from '../Common/BackupSystem';
import { HistoryTracker } from '../Common/HistoryTracker';
import { useAuth } from '../Auth/AuthProvider';

interface HeaderProps {
  onMenuToggle: () => void;
  onNavigate?: (section: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onNavigate }) => {
  const { utilisateur, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + K pour ouvrir la recherche
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  // Gestion du statut en ligne/hors ligne
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigate = (section: string, id?: string) => {
    if (onNavigate) {
      onNavigate(section, id);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }
  };

  return (
    <>
      {/* Indicateur de statut en ligne/hors ligne */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm">
          Mode hors ligne - Les modifications seront synchronisées lors de la reconnexion
        </div>
      )}

      <header className="bg-white shadow-sm border-b px-4 py-3" onKeyDown={handleKeyDown}>
        

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-2"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-w-[300px] text-left"
              >
                <Search className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-500">Rechercher...</span>
                <div className="ml-auto flex items-center space-x-1">
                  <kbd className="px-2 py-1 text-xs bg-white border rounded">Ctrl</kbd>
                  <kbd className="px-2 py-1 text-xs bg-white border rounded">K</kbd>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Indicateur de connexion */}
            <div className="mr-2">
              {isOnline ? 
                <Wifi className="w-5 h-5 text-green-500" title="Connecté" /> : 
                <WifiOff className="w-5 h-5 text-red-500" title="Déconnecté" />
              }
            </div>
            {/* Bouton Historique */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Historique des modifications"
            >
              <History className="w-5 h-5" />
            </button>

            {/* Bouton Sauvegarde */}
            <button 
              onClick={() => setIsBackupOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Système de sauvegarde"
            >
              <Database className="w-5 h-5" />
            </button>

            {/* Bouton Export Global */}
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Export global"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button 
              onClick={() => setIsNotificationOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center animate-pulse">
                3
              </span>
            </button>
            
            {/* Profil utilisateur */}
            <div className="flex items-center space-x-2 pl-2 border-l relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  utilisateur?.role === 'admin' ? 'bg-red-500' :
                  utilisateur?.role === 'manager' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-sm font-medium text-gray-700">
                    {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Utilisateur'}
                  </span>
                  <div className="text-xs text-gray-500 capitalize">
                    {utilisateur?.role || 'Employé'}
                  </div>
                </div>
              </button>
              
              {/* Menu déroulant utilisateur */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">
                        {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500">{utilisateur?.email}</p>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <User className="w-4 h-4 mr-2 text-red-500" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Fermer le menu utilisateur en cliquant ailleurs */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Composants modaux */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={handleNavigate}
      />

      <BackupSystem
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      <HistoryTracker
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
};