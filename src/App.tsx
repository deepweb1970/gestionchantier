import React, { useState, useEffect } from 'react';
import { useAuth } from './components/Auth/AuthProvider';
import { AuthLayout } from './components/Auth/AuthLayout';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Sections/Dashboard';
import { Chantiers } from './components/Sections/Chantiers';
import { Ouvriers } from './components/Sections/Ouvriers';
import { MaterielSection } from './components/Sections/Materiel';
import { PhotosManager } from './components/Sections/PhotosManager';
import { Clients } from './components/Sections/Clients';
import { Facturation } from './components/Sections/Facturation';
import { SaisieHeures } from './components/Sections/SaisieHeures';
import { Rapports } from './components/Sections/Rapports';
import { Utilisateurs } from './components/Sections/Utilisateurs';
import { RealtimeStatus } from './components/Common/RealtimeStatus';
import { Planning } from './components/Sections/Planning';
import { ParametresHeuresSup } from './components/Sections/ParametresHeuresSup';
import { MaintenanceSection } from './components/Sections/Maintenance';
import { PetitMaterielSection } from './components/Sections/PetitMateriel';
import { ProtectedRoute } from './components/Common/ProtectedRoute';

function App() {
  const { user, utilisateur, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Gestion du statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Navigation programmatique
  const handleNavigate = (section: string, id?: string) => {
    setActiveSection(section);
    // Si un ID est fourni, on pourrait l'utiliser pour ouvrir directement un élément
    if (id) {
      console.log(`Navigation vers ${section} avec ID: ${id}`);
    }
  };

  // Gestion des raccourcis clavier globaux
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + numéro pour navigation rapide
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const shortcuts: { [key: string]: string } = {
          '1': 'dashboard',
          '2': 'chantiers',
          '3': 'ouvriers',
          '4': 'materiel',
          '5': 'clients',
          '6': 'facturation',
          '7': 'heures',
          '8': 'rapports',
          '9': 'utilisateurs',
          '0': 'planning',
          'p': 'parametres'
        };

        if (shortcuts[e.key]) {
          e.preventDefault();
          setActiveSection(shortcuts[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'chantiers':
        return (
          <ProtectedRoute requiredPermission="read">
            <Chantiers />
          </ProtectedRoute>
        );
      case 'photos':
        return (
          <ProtectedRoute requiredPermission="read">
            <PhotosManager />
          </ProtectedRoute>
        );
      case 'ouvriers':
        return (
          <ProtectedRoute requiredPermission="manage_workers">
            <Ouvriers />
          </ProtectedRoute>
        );
      case 'materiel':
        return (
          <ProtectedRoute requiredPermission="manage_equipment">
            <MaterielSection />
          </ProtectedRoute>
        );
      case 'clients':
        return (
          <ProtectedRoute requiredPermission="manage_clients">
            <Clients />
          </ProtectedRoute>
        );
      case 'facturation':
        return (
          <ProtectedRoute requiredPermission="manage_invoices">
            <Facturation />
          </ProtectedRoute>
        );
      case 'heures':
        return (
          <ProtectedRoute requiredPermission="read">
            <SaisieHeures />
          </ProtectedRoute>
        );
      case 'rapports':
        return (
          <ProtectedRoute requiredPermission="view_reports">
            <Rapports />
          </ProtectedRoute>
        );
      case 'utilisateurs':
        return (
          <ProtectedRoute requiredPermission="manage_users">
            <Utilisateurs />
          </ProtectedRoute>
        );
      case 'planning':
        return (
          <ProtectedRoute requiredPermission="read">
            <Planning />
          </ProtectedRoute>
        );
      case 'parametres':
        return (
          <ProtectedRoute requiredPermission="admin_settings">
            <ParametresHeuresSup />
          </ProtectedRoute>
        );
      case 'maintenance':
        return (
          <ProtectedRoute requiredPermission="manage_equipment">
            <MaintenanceSection />
          </ProtectedRoute>
        );
      case 'petit-materiel':
        return (
          <ProtectedRoute requiredPermission="manage_equipment">
            <PetitMaterielSection />
          </ProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  // Si l'authentification est en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher le formulaire de connexion
  if (!user) {
    return <AuthLayout />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Indicateur de statut en temps réel */}
      <RealtimeStatus />

      <div className="flex">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
        
        <div className="flex-1 lg:ml-64">
          <Header 
            onMenuToggle={toggleSidebar}
            onNavigate={handleNavigate}
          />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Aide contextuelle pour les raccourcis */}
      <div className="fixed bottom-4 left-4 z-40">
        <details className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <summary className="px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
            Raccourcis clavier
          </summary>
          <div className="px-3 py-2 border-t text-xs text-gray-500 space-y-1">
            <div><kbd className="px-1 bg-gray-100 rounded">Ctrl+K</kbd> Recherche globale</div>
            <div><kbd className="px-1 bg-gray-100 rounded">Alt+1-9</kbd> Navigation rapide</div>
            <div><kbd className="px-1 bg-gray-100 rounded">Alt+P</kbd> Paramètres heures sup</div>
            <div><kbd className="px-1 bg-gray-100 rounded">Échap</kbd> Fermer les modales</div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;