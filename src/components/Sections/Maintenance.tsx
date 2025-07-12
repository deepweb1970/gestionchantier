import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wrench, Calendar, Download, Filter, Search, Clock, CheckCircle, AlertTriangle, PenTool as Tool, FileText, User, Settings, BarChart3, Gauge, ArrowRight, Cog, Clipboard, Eye, SkipForward, Calculator } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { maintenanceService } from '../../services/maintenanceService';
import { materielService } from '../../services/materielService';
import { ouvrierService } from '../../services/ouvrierService';
import { Maintenance, MaintenanceType, Materiel, Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const MaintenanceSection: React.FC = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [maintenancesAPrevoir, setMaintenancesAPrevoir] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'maintenances' | 'types' | 'preventive'>('maintenances');

  // Form state for maintenance
  const [formData, setFormData] = useState({
    materiel_id: '',
    type_id: '',
    date_planifiee: '',
    date_execution: '',
    heures_machine_debut: '',
    heures_machine_fin: '',
    duree_heures: '',
    cout: '',
    statut: 'planifiee' as const,
    description: '',
    notes: '',
    executant_id: '',
    pieces_utilisees: [] as string[],
    temps_reel_heures: '',
    kilometrage: '',
    observations: ''
  });

  // Form state for maintenance type
  const [typeFormData, setTypeFormData] = useState({
    nom: '',
    description: '',
    intervalle_heures: '',
    intervalle_jours: '',
    priorite: 'moyenne' as const,
    seuil_alerte_pourcentage: 80,
    pieces_necessaires: [] as string[],
    cout_estime: '',
    temps_estime_heures: ''
  });

  useRealtimeSupabase('maintenances', () => {
    loadMaintenances();
  });

  useRealtimeSupabase('maintenance_types', () => {
    loadMaintenanceTypes();
  });

  useRealtimeSupabase('materiel', () => {
    loadMateriels();
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMaintenances(),
        loadMaintenanceTypes(),
        loadMateriels(),
        loadOuvriers(),
        loadMaintenancesAPrevoir()
      ]);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenances = async () => {
    const data = await maintenanceService.getAll();
    setMaintenances(data);
  };

  const loadMaintenanceTypes = async () => {
    const data = await maintenanceService.getTypes();
    setMaintenanceTypes(data);
  };

  const loadMateriels = async () => {
    const data = await materielService.getAll();
    setMateriels(data);
  };

  const loadOuvriers = async () => {
    const data = await ouvrierService.getAll();
    setOuvriers(data);
  };

  const loadMaintenancesAPrevoir = async () => {
    const data = await maintenanceService.getMaintenancesAPrevoir();
    setMaintenancesAPrevoir(data);
  };

  const handleSave = async () => {
    try {
      const maintenanceData = {
        ...formData,
        heures_machine_debut: formData.heures_machine_debut ? parseFloat(formData.heures_machine_debut) : null,
        heures_machine_fin: formData.heures_machine_fin ? parseFloat(formData.heures_machine_fin) : null,
        duree_heures: formData.duree_heures ? parseFloat(formData.duree_heures) : null,
        cout: formData.cout ? parseFloat(formData.cout) : 0,
        temps_reel_heures: formData.temps_reel_heures ? parseFloat(formData.temps_reel_heures) : null,
        kilometrage: formData.kilometrage ? parseFloat(formData.kilometrage) : null
      };

      if (editingMaintenance) {
        await maintenanceService.update(editingMaintenance.id, maintenanceData);
      } else {
        await maintenanceService.create(maintenanceData);
      }

      await loadMaintenances();
      await loadMaintenancesAPrevoir();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  const handleSaveType = async () => {
    try {
      const typeData = {
        ...typeFormData,
        intervalle_heures: typeFormData.intervalle_heures ? parseFloat(typeFormData.intervalle_heures) : null,
        intervalle_jours: typeFormData.intervalle_jours ? parseInt(typeFormData.intervalle_jours) : null,
        cout_estime: typeFormData.cout_estime ? parseFloat(typeFormData.cout_estime) : 0,
        temps_estime_heures: typeFormData.temps_estime_heures ? parseFloat(typeFormData.temps_estime_heures) : 1
      };

      if (editingType) {
        await maintenanceService.updateType(editingType.id, typeData);
      } else {
        await maintenanceService.createType(typeData);
      }

      await loadMaintenanceTypes();
      setShowTypeModal(false);
      resetTypeForm();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du type');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      try {
        await maintenanceService.delete(id);
        await loadMaintenances();
        await loadMaintenancesAPrevoir();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const handleDeleteType = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de maintenance ?')) {
      try {
        await maintenanceService.deleteType(id);
        await loadMaintenanceTypes();
      } catch (err) {
        setError('Erreur lors de la suppression du type');
        console.error(err);
      }
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      materiel_id: maintenance.materiel_id || '',
      type_id: maintenance.type_id || '',
      date_planifiee: maintenance.date_planifiee || '',
      date_execution: maintenance.date_execution || '',
      heures_machine_debut: maintenance.heures_machine_debut?.toString() || '',
      heures_machine_fin: maintenance.heures_machine_fin?.toString() || '',
      duree_heures: maintenance.duree_heures?.toString() || '',
      cout: maintenance.cout?.toString() || '',
      statut: maintenance.statut || 'planifiee',
      description: maintenance.description || '',
      notes: maintenance.notes || '',
      executant_id: maintenance.executant_id || '',
      pieces_utilisees: maintenance.pieces_utilisees || [],
      temps_reel_heures: maintenance.temps_reel_heures?.toString() || '',
      kilometrage: maintenance.kilometrage?.toString() || '',
      observations: maintenance.observations || ''
    });
    setShowModal(true);
  };

  const handleEditType = (type: MaintenanceType) => {
    setEditingType(type);
    setTypeFormData({
      nom: type.nom,
      description: type.description || '',
      intervalle_heures: type.intervalle_heures?.toString() || '',
      intervalle_jours: type.intervalle_jours?.toString() || '',
      priorite: type.priorite || 'moyenne',
      seuil_alerte_pourcentage: type.seuil_alerte_pourcentage || 80,
      pieces_necessaires: type.pieces_necessaires || [],
      cout_estime: type.cout_estime?.toString() || '',
      temps_estime_heures: type.temps_estime_heures?.toString() || ''
    });
    setShowTypeModal(true);
  };

  const resetForm = () => {
    setFormData({
      materiel_id: '',
      type_id: '',
      date_planifiee: '',
      date_execution: '',
      heures_machine_debut: '',
      heures_machine_fin: '',
      duree_heures: '',
      cout: '',
      statut: 'planifiee',
      description: '',
      notes: '',
      executant_id: '',
      pieces_utilisees: [],
      temps_reel_heures: '',
      kilometrage: '',
      observations: ''
    });
    setEditingMaintenance(null);
  };

  const resetTypeForm = () => {
    setTypeFormData({
      nom: '',
      description: '',
      intervalle_heures: '',
      intervalle_jours: '',
      priorite: 'moyenne',
      seuil_alerte_pourcentage: 80,
      pieces_necessaires: [],
      cout_estime: '',
      temps_estime_heures: ''
    });
    setEditingType(null);
  };

  const calculateNextMaintenance = (materielId: string, typeId: string) => {
    const materiel = materiels.find(m => m.id === materielId);
    const type = maintenanceTypes.find(t => t.id === typeId);
    
    if (materiel && type && type.intervalle_heures) {
      const currentHours = materiel.usage_hours || 0;
      const nextMaintenanceHours = currentHours + type.intervalle_heures;
      return nextMaintenanceHours;
    }
    return null;
  };

  const planPreventiveMaintenance = async (maintenanceAPrevoir: any) => {
    const nextMaintenanceHours = calculateNextMaintenance(maintenanceAPrevoir.materiel_id, maintenanceAPrevoir.type_maintenance_id);
    
    setFormData({
      materiel_id: maintenanceAPrevoir.materiel_id,
      type_id: maintenanceAPrevoir.type_maintenance_id,
      date_planifiee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dans 7 jours
      date_execution: '',
      heures_machine_debut: maintenanceAPrevoir.heures_actuelles?.toString() || '',
      heures_machine_fin: nextMaintenanceHours?.toString() || '',
      duree_heures: maintenanceAPrevoir.temps_estime_heures?.toString() || '',
      cout: maintenanceAPrevoir.cout_estime?.toString() || '',
      statut: 'planifiee',
      description: `Maintenance préventive - ${maintenanceAPrevoir.type_maintenance_nom}`,
      notes: `Planifiée automatiquement à ${maintenanceAPrevoir.pourcentage_utilisation}% d'utilisation`,
      executant_id: '',
      pieces_utilisees: maintenanceAPrevoir.pieces_necessaires || [],
      temps_reel_heures: '',
      kilometrage: '',
      observations: ''
    });
    setShowModal(true);
  };

  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchesSearch = maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         materiels.find(m => m.id === maintenance.materiel_id)?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || maintenance.statut === statusFilter;
    const matchesType = typeFilter === 'all' || maintenance.type_id === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'planifiee': return 'bg-blue-100 text-blue-800';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800';
      case 'terminee': return 'bg-green-100 text-green-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'basse': return 'bg-green-100 text-green-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">Gestion des maintenances et maintenance préventive</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowTypeModal(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Types de maintenance</span>
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle maintenance</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('maintenances')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenances'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>Maintenances</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preventive')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preventive'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Maintenance préventive</span>
              {maintenancesAPrevoir.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {maintenancesAPrevoir.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'types'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Types de maintenance</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Maintenances Tab */}
      {activeTab === 'maintenances' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="planifiee">Planifiée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Tous les types</option>
                  {maintenanceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Maintenances List */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
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
                      Date planifiée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exécutant
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
                    const executant = ouvriers.find(o => o.id === maintenance.executant_id);

                    return (
                      <tr key={maintenance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Tool className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {materiel?.nom || 'Matériel supprimé'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {materiel?.type} - {materiel?.marque}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{type?.nom || 'Type supprimé'}</div>
                          <div className="text-sm text-gray-500">{maintenance.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.date_planifiee ? new Date(maintenance.date_planifiee).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={maintenance.statut}
                            className={getStatusColor(maintenance.statut)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.cout ? `${maintenance.cout.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {executant ? `${executant.prenom} ${executant.nom}` : 'Non assigné'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              onClick={() => handleEdit(maintenance)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(maintenance.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Maintenance Préventive Tab */}
      {activeTab === 'preventive' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Maintenances à prévoir</h2>
            </div>
            
            {maintenancesAPrevoir.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">Aucune maintenance préventive à prévoir pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenancesAPrevoir.map((item) => (
                  <div key={`${item.materiel_id}-${item.type_maintenance_id}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-5 h-5 text-orange-500" />
                        <h3 className="font-medium text-gray-900">{item.materiel_nom}</h3>
                      </div>
                      <StatusBadge
                        status={item.pourcentage_utilisation >= 90 ? 'critique' : 'attention'}
                        className={item.pourcentage_utilisation >= 90 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                      />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{item.materiel_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Maintenance:</span>
                        <span className="font-medium">{item.type_maintenance_nom}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Heures actuelles:</span>
                        <span className="font-medium">{item.heures_actuelles}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Prochaine maintenance:</span>
                        <span className="font-medium">{item.heures_prochaine_maintenance}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Utilisation:</span>
                        <span className={`font-medium ${item.pourcentage_utilisation >= 90 ? 'text-red-600' : 'text-orange-600'}`}>
                          {item.pourcentage_utilisation}%
                        </span>
                      </div>
                      {item.cout_estime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Coût estimé:</span>
                          <span className="font-medium">{item.cout_estime} €</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full ${
                          item.pourcentage_utilisation >= 90 ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(item.pourcentage_utilisation, 100)}%` }}
                      ></div>
                    </div>

                    <Button
                      onClick={() => planPreventiveMaintenance(item)}
                      className="w-full flex items-center justify-center space-x-2"
                      size="sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Planifier maintenance</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Types de Maintenance Tab */}
      {activeTab === 'types' && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Types de maintenance</h2>
              <Button
                onClick={() => setShowTypeModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau type</span>
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervalle (heures)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seuil d'alerte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût estimé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.nom}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.intervalle_heures ? `${type.intervalle_heures}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={type.priorite}
                        className={getPriorityColor(type.priorite)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.seuil_alerte_pourcentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.cout_estime ? `${type.cout_estime} €` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleEditType(type)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteType(type.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Maintenance */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMaintenance ? 'Modifier la maintenance' : 'Nouvelle maintenance'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matériel *
              </label>
              <select
                value={formData.materiel_id}
                onChange={(e) => setFormData({ ...formData, materiel_id: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un matériel</option>
                {materiels.map(materiel => (
                  <option key={materiel.id} value={materiel.id}>
                    {materiel.nom} - {materiel.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de maintenance *
              </label>
              <select
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un type</option>
                {maintenanceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date planifiée
              </label>
              <input
                type="date"
                value={formData.date_planifiee}
                onChange={(e) => setFormData({ ...formData, date_planifiee: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'exécution
              </label>
              <input
                type="date"
                value={formData.date_execution}
                onChange={(e) => setFormData({ ...formData, date_execution: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures machine début
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.heures_machine_debut}
                onChange={(e) => setFormData({ ...formData, heures_machine_debut: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures machine fin
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.heures_machine_fin}
                  onChange={(e) => setFormData({ ...formData, heures_machine_fin: e.target.value })}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextMaintenance = calculateNextMaintenance(formData.materiel_id, formData.type_id);
                    if (nextMaintenance) {
                      setFormData({ ...formData, heures_machine_fin: nextMaintenance.toString() });
                    }
                  }}
                  className="flex items-center space-x-1"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Auto</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée estimée (heures)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.duree_heures}
                onChange={(e) => setFormData({ ...formData, duree_heures: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coût estimé (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cout}
                onChange={(e) => setFormData({ ...formData, cout: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exécutant
              </label>
              <select
                value={formData.executant_id}
                onChange={(e) => setFormData({ ...formData, executant_id: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un exécutant</option>
                {ouvriers.map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit">
              {editingMaintenance ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Maintenance Type */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => {
          setShowTypeModal(false);
          resetTypeForm();
        }}
        title={editingType ? 'Modifier le type de maintenance' : 'Nouveau type de maintenance'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveType(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={typeFormData.nom}
                onChange={(e) => setTypeFormData({ ...typeFormData, nom: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                value={typeFormData.priorite}
                onChange={(e) => setTypeFormData({ ...typeFormData, priorite: e.target.value as any })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
                <option value="critique">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalle (heures)
              </label>
              <input
                type="number"
                step="0.01"
                value={typeFormData.intervalle_heures}
                onChange={(e) => setTypeFormData({ ...typeFormData, intervalle_heures: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalle (jours)
              </label>
              <input
                type="number"
                value={typeFormData.intervalle_jours}
                onChange={(e) => setTypeFormData({ ...typeFormData, intervalle_jours: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil d'alerte (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={typeFormData.seuil_alerte_pourcentage}
                onChange={(e) => setTypeFormData({ ...typeFormData, seuil_alerte_pourcentage: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coût estimé (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={typeFormData.cout_estime}
                onChange={(e) => setTypeFormData({ ...typeFormData, cout_estime: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temps estimé (heures)
              </label>
              <input
                type="number"
                step="0.01"
                value={typeFormData.temps_estime_heures}
                onChange={(e) => setTypeFormData({ ...typeFormData, temps_estime_heures: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={typeFormData.description}
              onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTypeModal(false);
                resetTypeForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit">
              {editingType ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};