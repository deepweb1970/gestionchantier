import { useState } from 'react';
import { Plus, Edit, Trash2, Wrench, Calendar, Download, Filter, Search, Clock, CheckCircle, AlertTriangle, PenTool as Tool, FileText, User, Settings, BarChart3, Gauge, ArrowRight, Cog, Clipboard, Eye, SkipForward, Calculator } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { maintenanceService } from '../../services/maintenanceService';
import { materielService } from '../../services/materielService';
import { ouvrierService } from '../../services/ouvrierService';
import { Maintenance, MaintenanceType, Materiel, Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
const prevRefreshReg = window.$RefreshReg$;

export const MaintenanceSection: React.FC = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPreventiveAlerts, setShowPreventiveAlerts] = useState(true);

  // Utilisation des hooks de temps réel
  useRealtimeSupabase('maintenances', setMaintenances);
  useRealtimeSupabase('maintenance_types', setMaintenanceTypes);
  useRealtimeSupabase('materiel', setMateriels);
  useRealtimeSupabase('ouvriers', setOuvriers);

  // Chargement initial des données
  useState(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintenancesData, typesData, materielsData, ouvriersData] = await Promise.all([
        maintenanceService.getAll(),
        maintenanceService.getTypes(),
        materielService.getAll(),
        ouvrierService.getAll()
      ]);
      
      setMaintenances(maintenancesData);
      setMaintenanceTypes(typesData);
      setMateriels(materielsData);
      setOuvriers(ouvriersData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcul des alertes préventives
  const getPreventiveAlerts = () => {
    return materiels.filter(materiel => {
      if (!materiel.usage_hours || !materiel.next_maintenance_hours) return false;
      
      const pourcentageUtilisation = (materiel.usage_hours / materiel.next_maintenance_hours) * 100;
      return pourcentageUtilisation >= 80; // Alerte à 80% d'utilisation
    });
  };

  const preventiveAlerts = getPreventiveAlerts();

  // Filtrage des maintenances
  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchesSearch = maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         materiels.find(m => m.id === maintenance.materiel_id)?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || maintenance.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveMaintenance = async (formData: any) => {
    try {
      if (editingMaintenance) {
        await maintenanceService.update(editingMaintenance.id, formData);
      } else {
        await maintenanceService.create(formData);
      }
      setShowModal(false);
      setEditingMaintenance(null);
      loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleSaveType = async (formData: any) => {
    try {
      if (editingType) {
        await maintenanceService.updateType(editingType.id, formData);
      } else {
        await maintenanceService.createType(formData);
      }
      setShowTypeModal(false);
      setEditingType(null);
      loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du type:', error);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      try {
        await maintenanceService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteType = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de maintenance ?')) {
      try {
        await maintenanceService.deleteType(id);
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression du type:', error);
      }
    }
  };

  const planifierMaintenancePreventive = async (materiel: Materiel) => {
    // Trouver le type de maintenance approprié
    const typeMaintenancePreventive = maintenanceTypes.find(type => 
      type.nom.toLowerCase().includes('préventive') || 
      type.nom.toLowerCase().includes('preventive')
    );

    const nouvelleMaintenanceData = {
      materiel_id: materiel.id,
      type_id: typeMaintenancePreventive?.id || null,
      description: `Maintenance préventive programmée pour ${materiel.nom}`,
      date_planifiee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dans 7 jours
      heures_machine_debut: materiel.usage_hours || 0,
      statut: 'planifiee'
    };

    setEditingMaintenance(nouvelleMaintenanceData as any);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setEditingType(null);
              setShowTypeModal(true);
            }}
            variant="outline"
            icon={Settings}
          >
            Types de maintenance
          </Button>
          <Button
            onClick={() => {
              setEditingMaintenance(null);
              setShowModal(true);
            }}
            icon={Plus}
          >
            Nouvelle maintenance
          </Button>
        </div>
      </div>

      {/* Alertes préventives */}
      {showPreventiveAlerts && preventiveAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-medium text-orange-800">
                Alertes de maintenance préventive ({preventiveAlerts.length})
              </h3>
            </div>
            <button
              onClick={() => setShowPreventiveAlerts(false)}
              className="text-orange-600 hover:text-orange-800"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {preventiveAlerts.map(materiel => {
              const pourcentage = materiel.next_maintenance_hours 
                ? (materiel.usage_hours! / materiel.next_maintenance_hours) * 100 
                : 0;
              
              return (
                <div key={materiel.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <Gauge className="h-4 w-4 text-orange-600" />
                    <div>
                      <span className="font-medium">{materiel.nom}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({materiel.usage_hours}h / {materiel.next_maintenance_hours}h - {pourcentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => planifierMaintenancePreventive(materiel)}
                    size="sm"
                    variant="outline"
                    icon={Calendar}
                  >
                    Planifier
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher une maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste des maintenances */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matériel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date planifiée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coût
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaintenances.map((maintenance) => {
                const materiel = materiels.find(m => m.id === maintenance.materiel_id);
                const type = maintenanceTypes.find(t => t.id === maintenance.type_id);
                
                return (
                  <tr key={maintenance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tool className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {materiel?.nom || 'Matériel supprimé'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type?.nom || 'Type non défini'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {maintenance.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.date_planifiee ? new Date(maintenance.date_planifiee).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={maintenance.statut} type="maintenance" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.cout ? `${maintenance.cout}€` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingMaintenance(maintenance);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaintenance(maintenance.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de maintenance */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingMaintenance(null);
          }}
          title={editingMaintenance ? 'Modifier la maintenance' : 'Nouvelle maintenance'}
        >
          <MaintenanceForm
            maintenance={editingMaintenance}
            materiels={materiels}
            maintenanceTypes={maintenanceTypes}
            ouvriers={ouvriers}
            onSave={handleSaveMaintenance}
            onCancel={() => {
              setShowModal(false);
              setEditingMaintenance(null);
            }}
          />
        </Modal>
      )}

      {/* Modal des types de maintenance */}
      {showTypeModal && (
        <Modal
          isOpen={showTypeModal}
          onClose={() => {
            setShowTypeModal(false);
            setEditingType(null);
          }}
          title={editingType ? 'Modifier le type' : 'Nouveau type de maintenance'}
        >
          <MaintenanceTypeForm
            maintenanceType={editingType}
            onSave={handleSaveType}
            onCancel={() => {
              setShowTypeModal(false);
              setEditingType(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

// Composant formulaire de maintenance
const MaintenanceForm: React.FC<{
  maintenance: Maintenance | null;
  materiels: Materiel[];
  maintenanceTypes: MaintenanceType[];
  ouvriers: Ouvrier[];
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ maintenance, materiels, maintenanceTypes, ouvriers, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    materiel_id: maintenance?.materiel_id || '',
    type_id: maintenance?.type_id || '',
    description: maintenance?.description || '',
    date_planifiee: maintenance?.date_planifiee || '',
    date_execution: maintenance?.date_execution || '',
    heures_machine_debut: maintenance?.heures_machine_debut || '',
    heures_machine_fin: maintenance?.heures_machine_fin || '',
    duree_heures: maintenance?.duree_heures || '',
    cout: maintenance?.cout || '',
    statut: maintenance?.statut || 'planifiee',
    notes: maintenance?.notes || '',
    executant_id: maintenance?.executant_id || '',
    pieces_utilisees: maintenance?.pieces_utilisees?.join(', ') || '',
    temps_reel_heures: maintenance?.temps_reel_heures || '',
    kilometrage: maintenance?.kilometrage || '',
    observations: maintenance?.observations || ''
  });

  const selectedMateriel = materiels.find(m => m.id === formData.materiel_id);
  const selectedType = maintenanceTypes.find(t => t.id === formData.type_id);

  // Calcul automatique de la prochaine maintenance
  const calculateNextMaintenance = () => {
    if (selectedMateriel && selectedType && selectedType.intervalle_heures) {
      const currentHours = selectedMateriel.usage_hours || 0;
      const nextMaintenanceHours = currentHours + selectedType.intervalle_heures;
      return nextMaintenanceHours;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      pieces_utilisees: formData.pieces_utilisees ? formData.pieces_utilisees.split(',').map(p => p.trim()) : [],
      heures_machine_debut: formData.heures_machine_debut ? parseFloat(formData.heures_machine_debut.toString()) : null,
      heures_machine_fin: formData.heures_machine_fin ? parseFloat(formData.heures_machine_fin.toString()) : null,
      duree_heures: formData.duree_heures ? parseFloat(formData.duree_heures.toString()) : null,
      cout: formData.cout ? parseFloat(formData.cout.toString()) : null,
      temps_reel_heures: formData.temps_reel_heures ? parseFloat(formData.temps_reel_heures.toString()) : null,
      kilometrage: formData.kilometrage ? parseFloat(formData.kilometrage.toString()) : null
    };

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matériel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Matériel *
          </label>
          <select
            value={formData.materiel_id}
            onChange={(e) => setFormData({ ...formData, materiel_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Sélectionner un matériel</option>
            {materiels.map(materiel => (
              <option key={materiel.id} value={materiel.id}>
                {materiel.nom} ({materiel.usage_hours || 0}h)
              </option>
            ))}
          </select>
        </div>

        {/* Type de maintenance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de maintenance
          </label>
          <select
            value={formData.type_id}
            onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un type</option>
            {maintenanceTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.nom} {type.intervalle_heures && `(${type.intervalle_heures}h)`}
              </option>
            ))}
          </select>
        </div>

        {/* Date planifiée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date planifiée
          </label>
          <input
            type="date"
            value={formData.date_planifiee}
            onChange={(e) => setFormData({ ...formData, date_planifiee: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date d'exécution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'exécution
          </label>
          <input
            type="date"
            value={formData.date_execution}
            onChange={(e) => setFormData({ ...formData, date_execution: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Heures machine début */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heures machine début
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.heures_machine_debut}
            onChange={(e) => setFormData({ ...formData, heures_machine_debut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={selectedMateriel ? `Actuel: ${selectedMateriel.usage_hours || 0}h` : ''}
          />
        </div>

        {/* Heures machine fin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heures machine fin
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.1"
              value={formData.heures_machine_fin}
              onChange={(e) => setFormData({ ...formData, heures_machine_fin: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedType && selectedType.intervalle_heures && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Calculator}
                onClick={() => {
                  const nextHours = calculateNextMaintenance();
                  if (nextHours) {
                    setFormData({ ...formData, heures_machine_fin: nextHours.toString() });
                  }
                }}
              >
                Auto
              </Button>
            )}
          </div>
          {selectedType && selectedType.intervalle_heures && (
            <p className="text-xs text-gray-500 mt-1">
              Prochaine maintenance suggérée: {calculateNextMaintenance()}h
            </p>
          )}
        </div>

        {/* Durée estimée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée estimée (heures)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.duree_heures}
            onChange={(e) => setFormData({ ...formData, duree_heures: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={selectedType ? `Estimé: ${selectedType.temps_estime_heures || 1}h` : ''}
          />
        </div>

        {/* Coût */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coût (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cout}
            onChange={(e) => setFormData({ ...formData, cout: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={selectedType ? `Estimé: ${selectedType.cout_estime || 0}€` : ''}
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        {/* Exécutant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exécutant
          </label>
          <select
            value={formData.executant_id}
            onChange={(e) => setFormData({ ...formData, executant_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un ouvrier</option>
            {ouvriers.map(ouvrier => (
              <option key={ouvrier.id} value={ouvrier.id}>
                {ouvrier.prenom} {ouvrier.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
        />
      </div>

      {/* Pièces utilisées */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pièces utilisées (séparées par des virgules)
        </label>
        <input
          type="text"
          value={formData.pieces_utilisees}
          onChange={(e) => setFormData({ ...formData, pieces_utilisees: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={selectedType?.pieces_necessaires?.join(', ') || 'Ex: Filtre à huile, Joint, Bougie'}
        />
        {selectedType?.pieces_necessaires && (
          <p className="text-xs text-gray-500 mt-1">
            Pièces suggérées: {selectedType.pieces_necessaires.join(', ')}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {maintenance ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

// Composant formulaire de type de maintenance
const MaintenanceTypeForm: React.FC<{
  maintenanceType: MaintenanceType | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ maintenanceType, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: maintenanceType?.nom || '',
    description: maintenanceType?.description || '',
    intervalle_heures: maintenanceType?.intervalle_heures || '',
    intervalle_jours: maintenanceType?.intervalle_jours || '',
    priorite: maintenanceType?.priorite || 'moyenne',
    seuil_alerte_pourcentage: maintenanceType?.seuil_alerte_pourcentage || 80,
    pieces_necessaires: maintenanceType?.pieces_necessaires?.join(', ') || '',
    cout_estime: maintenanceType?.cout_estime || '',
    temps_estime_heures: maintenanceType?.temps_estime_heures || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      pieces_necessaires: formData.pieces_necessaires ? formData.pieces_necessaires.split(',').map(p => p.trim()) : [],
      intervalle_heures: formData.intervalle_heures ? parseFloat(formData.intervalle_heures.toString()) : null,
      intervalle_jours: formData.intervalle_jours ? parseInt(formData.intervalle_jours.toString()) : null,
      cout_estime: formData.cout_estime ? parseFloat(formData.cout_estime.toString()) : 0,
      temps_estime_heures: formData.temps_estime_heures ? parseFloat(formData.temps_estime_heures.toString()) : 1
    };

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du type *
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Intervalle heures */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervalle (heures)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.intervalle_heures}
            onChange={(e) => setFormData({ ...formData, intervalle_heures: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Intervalle jours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervalle (jours)
          </label>
          <input
            type="number"
            value={formData.intervalle_jours}
            onChange={(e) => setFormData({ ...formData, intervalle_jours: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priorité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </label>
          <select
            value={formData.priorite}
            onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>
        </div>

        {/* Seuil d'alerte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seuil d'alerte (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.seuil_alerte_pourcentage}
            onChange={(e) => setFormData({ ...formData, seuil_alerte_pourcentage: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Coût estimé */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coût estimé (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cout_estime}
            onChange={(e) => setFormData({ ...formData, cout_estime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Temps estimé */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps estimé (heures)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.temps_estime_heures}
            onChange={(e) => setFormData({ ...formData, temps_estime_heures: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Pièces nécessaires */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pièces nécessaires (séparées par des virgules)
        </label>
        <input
          type="text"
          value={formData.pieces_necessaires}
          onChange={(e) => setFormData({ ...formData, pieces_necessaires: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Filtre à huile, Joint, Bougie"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {maintenanceType ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

var _c;
$RefreshReg$(_c, "MaintenanceSection");

if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
}