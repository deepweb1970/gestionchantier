import React, { useState } from 'react';
import { Menu, Bell, User, Search, Database, History, Download } from 'lucide-react';
import { GlobalSearch } from '../Common/GlobalSearch';
import { NotificationCenter } from '../Common/NotificationCenter';
import { BackupSystem } from '../Common/BackupSystem';
import { HistoryTracker } from '../Common/HistoryTracker';

interface HeaderProps {
  onMenuToggle: () => void;
  onNavigate?: (section: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onNavigate }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + K pour ouvrir la recherche
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  const handleNavigate = (section: string, id?: string) => {
    if (onNavigate) {
      onNavigate(section, id);
    }
  };

  return (
    <>
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
            <div className="flex items-center space-x-2 pl-2 border-l">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-gray-700">Admin</span>
                <div className="text-xs text-gray-500">Administrateur</div>
              </div>
            </div>
          </div>
        </div>
      </header>

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