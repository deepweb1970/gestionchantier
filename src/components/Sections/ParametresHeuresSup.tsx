import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Clock, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  X, 
  Copy, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';

interface ParametresHeuresSup {
  id: string;
  nom: string;
  description: string;
  seuilHeuresNormales: number;
  tauxMajorationSup: number;
  seuilHeuresExceptionnelles: number;
  tauxMajorationExceptionnelles: number;
  joursTravaillesSemaine: number;
  heuresMaxJour: number;
  heuresMaxSemaine: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

const mockParametres: ParametresHeuresSup[] = [
  {
    id: '1',
    nom: 'Configuration Standard',
    description: 'Paramètres par défaut selon la convention collective du BTP',
    seuilHeuresNormales: 8.00,
    tauxMajorationSup: 0.00,
    seuilHeuresExceptionnelles: 10.00,
    tauxMajorationExceptionnelles: 0.00,
    joursTravaillesSemaine: 5,
    heuresMaxJour: 10.00,
    heuresMaxSemaine: 48.00,
    actif: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: '2',
    nom: 'Configuration Urgence',
    description: 'Paramètres pour les chantiers d\'urgence avec majorations renforcées',
    seuilHeuresNormales: 7.00,
    tauxMajorationSup: 30.00,
    seuilHeuresExceptionnelles: 9.00,
    tauxMajorationExceptionnelles: 60.00,
    joursTravaillesSemaine: 6,
    heuresMaxJour: 12.00,
    heuresMaxSemaine: 50.00,
    actif: false,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: '3',
    nom: 'Configuration Week-end',
    description: 'Paramètres spéciaux pour le travail de week-end',
    seuilHeuresNormales: 6.00,
    tauxMajorationSup: 50.00,
    seuilHeuresExceptionnelles: 8.00,
    tauxMajorationExceptionnelles: 100.00,
    joursTravaillesSemaine: 2,
    heuresMaxJour: 8.00,
    heuresMaxSemaine: 16.00,
    actif: false,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  }
];

export const ParametresHeuresSup: React.FC = () => {
  const [parametres, setParametres] = useState<ParametresHeuresSup[]>(mockParametres);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [editingParametre, setEditingParametre] = useState<ParametresHeuresSup | null>(null);
  const [selectedParametre, setSelectedParametre] = useState<ParametresHeuresSup | null>(null);

  const handleEdit = (parametre: ParametresHeuresSup) => {
    setEditingParametre(parametre);
    setIsModalOpen(true);
  };

  const handleSimulation = (parametre: ParametresHeuresSup) => {
    setSelectedParametre(parametre);
    setIsSimulationModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      setParametres(parametres.filter(p => p.id !== id));
    }
  };

  const handleToggleActif = (id: string) => {
    setParametres(parametres.map(p => {
      if (p.id === id) {
        // Si on active ce paramètre, désactiver tous les autres
        if (!p.actif) {
          setParametres(prev => prev.map(param => ({ ...param, actif: param.id === id })));
          return { ...p, actif: true };
        }
        return { ...p, actif: false };
      }
      return p;
    }));
  };

  const handleDuplicate = (parametre: ParametresHeuresSup) => {
    const nouveauParametre: ParametresHeuresSup = {
      ...parametre,
      id: Date.now().toString(),
      nom: `${parametre.nom} (Copie)`,
      actif: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setParametres([...parametres, nouveauParametre]);
  };

  const handleSave = (formData: FormData) => {
    const parametreData: ParametresHeuresSup = {
      id: editingParametre?.id || Date.now().toString(),
      nom: formData.get('nom') as string,
      description: formData.get('description') as string,
      seuilHeuresNormales: parseFloat(formData.get('seuilHeuresNormales') as string),
      tauxMajorationSup: parseFloat(formData.get('tauxMajorationSup') as string),
      seuilHeuresExceptionnelles: parseFloat(formData.get('seuilHeuresExceptionnelles') as string),
      tauxMajorationExceptionnelles: parseFloat(formData.get('tauxMajorationExceptionnelles') as string),
      joursTravaillesSemaine: parseInt(formData.get('joursTravaillesSemaine') as string),
      heuresMaxJour: parseFloat(formData.get('heuresMaxJour') as string),
      heuresMaxSemaine: parseFloat(formData.get('heuresMaxSemaine') as string),
      actif: editingParametre?.actif || false,
      createdAt: editingParametre?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingParametre) {
      setParametres(parametres.map(p => p.id === editingParametre.id ? parametreData : p));
    } else {
      setParametres([...parametres, parametreData]);
    }
    
    setIsModalOpen(false);
    setEditingParametre(null);
  };

  const calculateHeures = (heuresTravaillees: number, parametre: ParametresHeuresSup) => {
    let heuresNormales = 0;
    let heuresSupplementaires = 0;
    let heuresExceptionnelles = 0;

    if (heuresTravaillees <= parametre.seuilHeuresNormales) {
      heuresNormales = heuresTravaillees;
    } else if (heuresTravaillees <= parametre.seuilHeuresExceptionnelles) {
      heuresNormales = parametre.seuilHeuresNormales;
      heuresSupplementaires = heuresTravaillees - parametre.seuilHeuresNormales;
    } else {
      heuresNormales = parametre.seuilHeuresNormales;
      heuresSupplementaires = parametre.seuilHeuresExceptionnelles - parametre.seuilHeuresNormales;
      heuresExceptionnelles = heuresTravaillees - parametre.seuilHeuresExceptionnelles;
    }

    return { heuresNormales, heuresSupplementaires, heuresExceptionnelles };
  };

  const calculateCost = (heuresTravaillees: number, tauxHoraire: number, parametre: ParametresHeuresSup) => {
    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeures(heuresTravaillees, parametre);
    
    const coutNormal = heuresNormales * tauxHoraire;
    const coutSupplementaire = heuresSupplementaires * tauxHoraire * (1 + parametre.tauxMajorationSup / 100);
    const coutExceptionnel = heuresExceptionnelles * tauxHoraire * (1 + parametre.tauxMajorationExceptionnelles / 100);
    
    return {
      coutNormal,
      coutSupplementaire,
      coutExceptionnel,
      coutTotal: coutNormal + coutSupplementaire + coutExceptionnel
    };
  };

  const ParametreForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la configuration</label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={editingParametre?.nom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              name="description"
              type="text"
              defaultValue={editingParametre?.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Seuils et Majorations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Seuil heures normales (h)
              </label>
              <input
                name="seuilHeuresNormales"
                type="number"
                step="0.25"
                min="0"
                max="12"
                required
                defaultValue={editingParametre?.seuilHeuresNormales || 8}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-600 mt-1">Heures payées au taux normal</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Majoration heures sup (%)
              </label>
              <input
                name="tauxMajorationSup"
                type="number"
                step="0.1"
                min="0"
                max="200"
                required
                defaultValue={editingParametre?.tauxMajorationSup || 25}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-600 mt-1">Majoration appliquée aux heures sup</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Seuil heures exceptionnelles (h)
              </label>
              <input
                name="seuilHeuresExceptionnelles"
                type="number"
                step="0.25"
                min="0"
                max="16"
                required
                defaultValue={editingParametre?.seuilHeuresExceptionnelles || 10}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-600 mt-1">Au-delà = heures exceptionnelles</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Majoration heures exceptionnelles (%)
              </label>
              <input
                name="tauxMajorationExceptionnelles"
                type="number"
                step="0.1"
                min="0"
                max="300"
                required
                defaultValue={editingParametre?.tauxMajorationExceptionnelles || 50}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-600 mt-1">Majoration pour heures exceptionnelles</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Limites Légales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Jours travaillés/semaine
              </label>
              <input
                name="joursTravaillesSemaine"
                type="number"
                min="1"
                max="7"
                required
                defaultValue={editingParametre?.joursTravaillesSemaine || 5}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Heures max/jour (h)
              </label>
              <input
                name="heuresMaxJour"
                type="number"
                step="0.25"
                min="1"
                max="16"
                required
                defaultValue={editingParametre?.heuresMaxJour || 10}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Heures max/semaine (h)
              </label>
              <input
                name="heuresMaxSemaine"
                type="number"
                step="0.25"
                min="1"
                max="80"
                required
                defaultValue={editingParametre?.heuresMaxSemaine || 48}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Aperçu des calculs */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Aperçu des Calculs
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded border">
              <p className="text-gray-600">Exemple: 9h travaillées</p>
              <p className="font-medium text-blue-600">8h normales + 1h sup (+25%)</p>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <p className="text-gray-600">Exemple: 11h travaillées</p>
              <p className="font-medium text-orange-600">8h normales + 2h sup + 1h except</p>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <p className="text-gray-600">Taux horaire: 25€</p>
              <p className="font-medium text-green-600">9h = 225€ + 6.25€ = 231.25€</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingParametre ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const SimulationModal = () => {
    if (!selectedParametre) return null;

    const [heuresTravaillees, setHeuresTravaillees] = useState(9);
    const [tauxHoraire, setTauxHoraire] = useState(25);

    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeures(heuresTravaillees, selectedParametre);
    const { coutNormal, coutSupplementaire, coutExceptionnel, coutTotal } = calculateCost(heuresTravaillees, tauxHoraire, selectedParametre);

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Simulation - {selectedParametre.nom}
          </h3>
          <p className="text-sm text-blue-700">{selectedParametre.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heures travaillées
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="16"
              value={heuresTravaillees}
              onChange={(e) => setHeuresTravaillees(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux horaire (€)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={tauxHoraire}
              onChange={(e) => setTauxHoraire(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Répartition des heures</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{heuresNormales.toFixed(2)}h</p>
              <p className="text-sm text-green-700">Heures normales</p>
              <p className="text-xs text-green-600">Taux: {tauxHoraire}€/h</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{heuresSupplementaires.toFixed(2)}h</p>
              <p className="text-sm text-orange-700">Heures supplémentaires</p>
              <p className="text-xs text-orange-600">Taux: {(tauxHoraire * (1 + selectedParametre.tauxMajorationSup / 100)).toFixed(2)}€/h (+{selectedParametre.tauxMajorationSup}%)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{heuresExceptionnelles.toFixed(2)}h</p>
              <p className="text-sm text-red-700">Heures exceptionnelles</p>
              <p className="text-xs text-red-600">Taux: {(tauxHoraire * (1 + selectedParametre.tauxMajorationExceptionnelles / 100)).toFixed(2)}€/h (+{selectedParametre.tauxMajorationExceptionnelles}%)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Calcul des coûts</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Coût heures normales:</span>
              <span className="font-medium">{coutNormal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Coût heures supplémentaires:</span>
              <span className="font-medium">{coutSupplementaire.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Coût heures exceptionnelles:</span>
              <span className="font-medium">{coutExceptionnel.toFixed(2)}€</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Coût total:</span>
                <span className="text-xl font-bold text-blue-600">{coutTotal.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes de dépassement */}
        {heuresTravaillees > selectedParametre.heuresMaxJour && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">
                Dépassement de la limite journalière ({selectedParametre.heuresMaxJour}h)
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => setIsSimulationModalOpen(false)}>
            Fermer
          </Button>
        </div>
      </div>
    );
  };

  const parametreActif = parametres.find(p => p.actif);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paramétrage Heures Supplémentaires</h1>
          <p className="text-gray-600 mt-1">Configuration des seuils et majorations pour le calcul des heures supplémentaires</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Configuration
          </Button>
        </div>
      </div>

      {/* Configuration active */}
      {parametreActif && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-green-800">{parametreActif.nom}</h2>
                <p className="text-sm text-green-700">{parametreActif.description}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => handleSimulation(parametreActif)}>
                <Calculator className="w-4 h-4 mr-2" />
                Simuler
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleEdit(parametreActif)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600">Seuil heures normales</p>
              <p className="font-semibold text-blue-600">{parametreActif.seuilHeuresNormales}h</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600">Majoration heures sup</p>
              <p className="font-semibold text-orange-600">+{parametreActif.tauxMajorationSup}%</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600">Seuil heures except.</p>
              <p className="font-semibold text-red-600">{parametreActif.seuilHeuresExceptionnelles}h</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600">Majoration except.</p>
              <p className="font-semibold text-red-600">+{parametreActif.tauxMajorationExceptionnelles}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des configurations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Toutes les configurations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configuration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seuils
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Majorations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parametres.map((parametre) => (
                <tr key={parametre.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{parametre.nom}</div>
                      <div className="text-sm text-gray-500">{parametre.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">Normales: {parametre.seuilHeuresNormales}h</div>
                      <div className="text-gray-500">Except.: {parametre.seuilHeuresExceptionnelles}h</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-orange-600">Sup: +{parametre.tauxMajorationSup}%</div>
                      <div className="text-red-600">Except: +{parametre.tauxMajorationExceptionnelles}%</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{parametre.heuresMaxJour}h/jour</div>
                      <div className="text-gray-500">{parametre.heuresMaxSemaine}h/semaine</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActif(parametre.id)}
                      className={`flex items-center ${
                        parametre.actif ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {parametre.actif ? (
                        <>
                          <ToggleRight className="w-6 h-6 mr-2" />
                          <span className="text-sm font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 mr-2" />
                          <span className="text-sm">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSimulation(parametre)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Simuler"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(parametre)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(parametre)}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(parametre.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingParametre(null);
        }}
        title={editingParametre ? 'Modifier la configuration' : 'Nouvelle configuration'}
        size="xl"
      >
        <ParametreForm />
      </Modal>

      {/* Modal de simulation */}
      <Modal
        isOpen={isSimulationModalOpen}
        onClose={() => {
          setIsSimulationModalOpen(false);
          setSelectedParametre(null);
        }}
        title="Simulation des Calculs"
        size="lg"
      >
        <SimulationModal />
      </Modal>
    </div>
  );
};