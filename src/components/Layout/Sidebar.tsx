import React from 'react';
import { 
  Building2, 
  Users, 
  Wrench,
  UserCheck,
  FileText,
  Clock,
  BarChart3,
  Shield,
  Calendar,
  Menu,
  X,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'chantiers', label: 'Chantiers', icon: Building2 },
  { id: 'ouvriers', label: 'Ouvriers', icon: Users },
  { id: 'materiel', label: 'Matériel', icon: Wrench },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'facturation', label: 'Facturation', icon: FileText },
  { id: 'heures', label: 'Saisie Heures', icon: Clock },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Shield },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  isOpen, 
  onToggle 
}) => {
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
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Gestion Chantier</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-4">
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
      </div>
    </>
  );
};