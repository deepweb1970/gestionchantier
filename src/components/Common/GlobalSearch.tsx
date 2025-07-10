import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  Users, 
  Wrench, 
  UserCheck, 
  FileText, 
  Calendar, 
  Clock, 
  BarChart3 
} from 'lucide-react';
import { mockChantiers, mockOuvriers, mockMateriel, mockClients, mockFactures, mockSaisiesHeures, mockPlanningEvents } from '../../data/mockData';

interface SearchResult {
  id: string;
  type: 'chantier' | 'ouvrier' | 'materiel' | 'client' | 'facture' | 'saisie' | 'planning';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Recherche dans les chantiers
    mockChantiers.forEach(chantier => {
      if (chantier.nom.toLowerCase().includes(term) || 
          chantier.client.toLowerCase().includes(term) ||
          chantier.adresse.toLowerCase().includes(term)) {
        searchResults.push({
          id: chantier.id,
          type: 'chantier',
          title: chantier.nom,
          subtitle: chantier.client,
          description: chantier.adresse,
          icon: Building2,
          color: 'text-blue-600'
        });
      }
    });

    // Recherche dans les ouvriers
    mockOuvriers.forEach(ouvrier => {
      if (`${ouvrier.prenom} ${ouvrier.nom}`.toLowerCase().includes(term) ||
          ouvrier.qualification.toLowerCase().includes(term) ||
          ouvrier.email.toLowerCase().includes(term)) {
        searchResults.push({
          id: ouvrier.id,
          type: 'ouvrier',
          title: `${ouvrier.prenom} ${ouvrier.nom}`,
          subtitle: ouvrier.qualification,
          description: ouvrier.email,
          icon: Users,
          color: 'text-green-600'
        });
      }
    });

    // Recherche dans le matériel
    mockMateriel.forEach(materiel => {
      if (materiel.nom.toLowerCase().includes(term) ||
          materiel.marque.toLowerCase().includes(term) ||
          materiel.type.toLowerCase().includes(term)) {
        searchResults.push({
          id: materiel.id,
          type: 'materiel',
          title: materiel.nom,
          subtitle: `${materiel.marque} ${materiel.modele}`,
          description: materiel.type,
          icon: Wrench,
          color: 'text-orange-600'
        });
      }
    });

    // Recherche dans les clients
    mockClients.forEach(client => {
      if (client.nom.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.contactPrincipal.toLowerCase().includes(term)) {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.nom,
          subtitle: client.contactPrincipal,
          description: client.email,
          icon: UserCheck,
          color: 'text-purple-600'
        });
      }
    });

    // Recherche dans les factures
    mockFactures.forEach(facture => {
      const client = mockClients.find(c => c.id === facture.clientId);
      if (facture.numero.toLowerCase().includes(term) ||
          client?.nom.toLowerCase().includes(term)) {
        searchResults.push({
          id: facture.id,
          type: 'facture',
          title: facture.numero,
          subtitle: client?.nom || '',
          description: `${facture.montantTTC.toLocaleString()} € - ${facture.statut}`,
          icon: FileText,
          color: 'text-indigo-600'
        });
      }
    });

    // Recherche dans les saisies d'heures
    mockSaisiesHeures.forEach(saisie => {
      const ouvrier = mockOuvriers.find(o => o.id === saisie.ouvrierId);
      const chantier = mockChantiers.find(c => c.id === saisie.chantierId);
      if (ouvrier && (`${ouvrier.prenom} ${ouvrier.nom}`.toLowerCase().includes(term) ||
          chantier?.nom.toLowerCase().includes(term) ||
          saisie.description.toLowerCase().includes(term))) {
        searchResults.push({
          id: saisie.id,
          type: 'saisie',
          title: `Saisie ${ouvrier.prenom} ${ouvrier.nom}`,
          subtitle: chantier?.nom || '',
          description: `${saisie.date} - ${saisie.heuresNormales + saisie.heuresSupplementaires}h`,
          icon: Clock,
          color: 'text-teal-600'
        });
      }
    });

    // Recherche dans le planning
    mockPlanningEvents.forEach(event => {
      if (event.titre.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term)) {
        searchResults.push({
          id: event.id,
          type: 'planning',
          title: event.titre,
          subtitle: event.type,
          description: new Date(event.dateDebut).toLocaleDateString(),
          icon: Calendar,
          color: 'text-pink-600'
        });
      }
    });

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const sectionMap = {
      chantier: 'chantiers',
      ouvrier: 'ouvriers',
      materiel: 'materiel',
      client: 'clients',
      facture: 'facturation',
      saisie: 'heures',
      planning: 'planning'
    };
    
    onNavigate(sectionMap[result.type], result.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center p-4 border-b">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Rechercher dans toute l'application..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className={`p-2 rounded-full bg-gray-100 mr-4`}>
                    <Icon className={`w-5 h-5 ${result.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.title}</div>
                    <div className="text-sm text-gray-600">{result.subtitle}</div>
                    <div className="text-xs text-gray-500">{result.description}</div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {result.type}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchTerm.length >= 2 && results.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
          </div>
        )}

        {searchTerm.length < 2 && (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Tapez au moins 2 caractères pour rechercher</p>
            <div className="mt-4 text-sm">
              <p className="mb-2">Vous pouvez rechercher dans :</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Chantiers</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Ouvriers</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Matériel</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Clients</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Factures</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Planning</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
          <span>↑↓ pour naviguer • Entrée pour sélectionner</span>
          <span>Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
};