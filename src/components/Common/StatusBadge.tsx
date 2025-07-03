import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'chantier' | 'ouvrier' | 'materiel' | 'facture' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'default' }) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'chantier':
        switch (status) {
          case 'actif': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' };
          case 'termine': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminé' };
          case 'pause': return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En pause' };
          case 'planifie': return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Planifié' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        }
      case 'ouvrier':
        switch (status) {
          case 'actif': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' };
          case 'conge': return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En congé' };
          case 'arret': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Arrêt maladie' };
          case 'indisponible': return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Indisponible' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        }
      case 'materiel':
        switch (status) {
          case 'disponible': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Disponible' };
          case 'en_service': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En service' };
          case 'maintenance': return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' };
          case 'hors_service': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Hors service' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        }
      case 'facture':
        switch (status) {
          case 'brouillon': return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' };
          case 'envoyee': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Envoyée' };
          case 'payee': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée' };
          case 'retard': return { bg: 'bg-red-100', text: 'text-red-800', label: 'En retard' };
          case 'annulee': return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulée' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};