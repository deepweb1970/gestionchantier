import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'chantier' | 'ouvrier' | 'materiel' | 'facture' | 'maintenance_status' | 'maintenance_priority' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'default' }) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'chantier':
        switch (status) {
          case 'actif': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Actif' };
          case 'termine': return { bg: 'bg-blue-100 border border-blue-200', text: 'text-blue-800', label: 'Terminé' };
          case 'pause': return { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', label: 'En pause' };
          case 'planifie': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Planifié' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        }
        
      case 'ouvrier':
        switch (status) {
          case 'actif': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Actif' };
          case 'conge': return { bg: 'bg-orange-100 border border-orange-200', text: 'text-orange-800', label: 'En congé' };
          case 'arret': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Arrêt maladie' };
          case 'indisponible': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Indisponible' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'materiel':
        switch (status) {
          case 'disponible': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Disponible' };
          case 'en_service': return { bg: 'bg-blue-100 border border-blue-200', text: 'text-blue-800', label: 'En service' };
          case 'maintenance': return { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', label: 'Maintenance' };
          case 'hors_service': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Hors service' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'facture':
        switch (status) {
          case 'brouillon': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Brouillon' };
          case 'envoyee': return { bg: 'bg-blue-100 border border-blue-200', text: 'text-blue-800', label: 'Envoyée' };
          case 'payee': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Payée' };
          case 'retard': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'En retard' };
          case 'annulee': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Annulée' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'maintenance_status':
        switch (status) {
          case 'planifiee': return { bg: 'bg-blue-100 border border-blue-200', text: 'text-blue-800', label: 'Planifiée' };
          case 'en_cours': return { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', label: 'En cours' };
          case 'terminee': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Terminée' };
          case 'annulee': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Annulée' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'maintenance_priority':
        switch (status) {
          case 'basse': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Basse' };
          case 'moyenne': return { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', label: 'Moyenne' };
          case 'haute': return { bg: 'bg-orange-100 border border-orange-200', text: 'text-orange-800', label: 'Haute' };
          case 'critique': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Critique' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'petit_materiel':
        switch (status) {
          case 'disponible': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Disponible' };
          case 'prete': return { bg: 'bg-orange-100 border border-orange-200', text: 'text-orange-800', label: 'Prêté' };
          case 'maintenance': return { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', label: 'Maintenance' };
          case 'perdu': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Perdu' };
          case 'hors_service': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Hors service' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      case 'pret':
        switch (status) {
          case 'en_cours': return { bg: 'bg-blue-100 border border-blue-200', text: 'text-blue-800', label: 'En cours' };
          case 'termine': return { bg: 'bg-green-100 border border-green-200', text: 'text-green-800', label: 'Terminé' };
          case 'retard': return { bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'En retard' };
          case 'perdu': return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: 'Perdu' };
          default: return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
        }
        
      default:
        return { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-800', label: status };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};