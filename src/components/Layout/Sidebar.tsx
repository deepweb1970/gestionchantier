import React, { useState } from 'react';
import { Building2, Image, Users, Wrench, UserCheck, FileText, Clock, BarChart3, Shield, Calendar, Menu, X, Settings, UserCog, LogOut, Bell, HelpCircle, PenTool as Tool } from 'lucide-react';
import { Package } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const allMenuItems = [
  { id: 'chantiers', label: 'Chantiers', icon: Building2 },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'ouvriers', label: 'Ouvriers', icon: Users },
  { id: 'materiel', label: 'Matériel', icon: Wrench },
  { id: 'maintenance', label: 'Maintenance', icon: Tool },
  { id: 'petit-materiel', label: 'Petit Matériel', icon: Package },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'facturation', label: 'Facturation', icon: FileText },
  { id: 'heures', label: 'Saisie Heures', icon: Clock },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Shield },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

// Permissions requises pour chaque section
const sectionPermissions: { [key: string]: string[] } = {
  'chantiers': ['read'],
  'photos': ['read'],
  'ouvriers': ['manage_workers'],
  'materiel': ['manage_equipment'],
  'maintenance': ['manage_equipment'],
  'petit-materiel': ['manage_equipment'],
  'clients': ['manage_clients'],
  'facturation': ['manage_invoices'],
  'heures': ['read'],
  'rapports': ['view_reports'],
  'utilisateurs': ['manage_users'],
  'planning': ['read'],
  'parametres': ['admin_settings'],
};
export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  isOpen, 
  onToggle 
}) => {
  const { user, utilisateur, signOut, hasPermission } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filtrer les éléments du menu selon les permissions
  const menuItems = allMenuItems.filter(item => {
    const requiredPermissions = sectionPermissions[item.id];
    if (!requiredPermissions) return true; // Si pas de permission requise, afficher
    
    // Vérifier si l'utilisateur a au moins une des permissions requises
    return requiredPermissions.some(permission => hasPermission(permission));
  });

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
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">Gestion Chantier</h1>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    onToggle(); // Close mobile menu
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors
                    ${activeSection === item.id 
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                      : 'text-gray-700 hover:text-blue-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          {/* User section at bottom */}
          <div className="border-t p-4">
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  utilisateur?.role === 'admin' ? 'bg-red-500' :
                  utilisateur?.role === 'manager' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}>
                  <UserCog className="w-4 h-4 text-white" />
                </div>
                <div className="ml-2 text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {utilisateur?.role === 'admin' ? 'Administrateur' :
                     utilisateur?.role === 'manager' ? 'Manager' :
                     'Employé'}
                  </p>
                </div>
              </button>
              
              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">
                        {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500">{utilisateur?.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{utilisateur?.role}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <UserCog className="w-4 h-4 mr-2 text-gray-500" />
                      Mon profil
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-gray-500" />
                      Notifications
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2 text-gray-500" />
                      Aide
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-red-500" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};