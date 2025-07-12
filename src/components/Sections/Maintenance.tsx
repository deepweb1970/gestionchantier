import React, { useState } from 'react';
import { Plus, Edit, Trash2, Wrench, Calendar, Download, Filter, Search, Clock, CheckCircle, AlertTriangle, PenTool as Tool, FileText, User, Settings, BarChart3, Gauge, ArrowRight, Cog, Clipboard, Eye } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { maintenanceService } from '../../services/maintenanceService';
import { materielService } from '../../services/materielService';
import { ouvrierService } from '../../services/ouvrierService';
import { Maintenance, MaintenanceType, Materiel, Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const MaintenanceSection: React.FC = () => {
  // Data fetching
  const { data: maintenances, loading: maintenancesLoading, error: maintenancesError, refresh: refreshMaintenances } = useRealtimeSupabase({
    table: 'maintenances',
    fetchFunction: maintenanceService.getAllMaintenances
  });
  
  const { data: maintenanceTypes, loading: typesLoading } = useRealtimeSupabase({
    table: 'maintenance_types',
    fetchFunction: maintenanceService.getAllMaintenanceTypes
  });
  
  const { data: materiel, loading: materielLoading } = useRealtimeSupabase({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });
  
  const { data: ouvriers, loading: ouvriersLoading } = useRealtimeSupabase({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [materielFilter, setMaterielFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Filtered data
  const filteredMaintenances = (maintenances || []).filter(maintenance => {
    const matchesSearch = 
      maintenance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maintenance.materielNom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maintenance.typeNom || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || maintenance.statut === statusFilter;
    const matchesMateriel = materielFilter === 'all' || maintenance.materielId === materielFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const maintenanceDate = new Date(maintenance.datePlanifiee);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = maintenanceDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
          matchesDate = maintenanceDate >= startOfWeek && maintenanceDate <= endOfWeek;
          break;
        case 'this_month':
          matchesDate = 
            maintenanceDate.getMonth() === today.getMonth() && 
            maintenanceDate.getFullYear() === today.getFullYear();
          break;
        case 'overdue':
          matchesDate = 
            maintenanceDate < today && 
            (maintenance.statut === 'planifiee' || maintenance.statut === 'en_cours');
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesMateriel && matchesDate;
  });

  // Helper functions
  const getMateriel = (id: string): Materiel | undefined => {
    return materiel?.find(m => m.id === id);
  };

  const getMaintenanceType = (id: string): MaintenanceType | undefined => {
    return maintenanceTypes?.find(t => t.id === id);
  };

  const getOuvrier = (id?: string): Ouvrier | undefined => {
    if (!id) return undefined;
    return ouvriers?.find(o => o.id === id);
  };

  const getPriorityColor = (priority: MaintenanceType['priorite']) => {
    switch (priority) {
      case 'basse': return 'bg-blue-100 text-blue-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // CRUD operations
  const handleCreate = () => {
    setEditingMaintenance(null);
    setIsModalOpen(true);
  };

  const handleCreateType = () => {
    setEditingType(null);
    setIsTypeModalOpen(true);
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setIsModalOpen(true);
  };

  const handleEditType = (type: MaintenanceType) => {
    setEditingType(type);
    setIsTypeModalOpen(true);
  };

  const handleViewDetails = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      try {
        await maintenanceService.deleteMaintenance(id);
        refreshMaintenances();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la maintenance');
      }
    }
  };

  const handleDeleteType = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type de maintenance ?')) {
      try {
        await maintenanceService.deleteMaintenanceType(id);
        refreshMaintenances();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du type de maintenance');
      }
    }
  };

  const handleSaveMaintenance = async (formData: FormData) => {
    try {
      const materielId = formData.get('materielId') as string;
      const selectedMateriel = getMateriel(materielId);
      
      const maintenanceData: Omit<Maintenance, 'id' | 'materielNom' | 'typeNom' | 'executantNom'> = {
        materielId,
        typeId: formData.get('typeId') as string,
        datePlanifiee: formData.get('datePlanifiee') as string,
        dateExecution: formData.get('dateExecution') as string || undefined,
        heuresMachineDebut: selectedMateriel?.machineHours || 0,
        heuresMachineFin: parseFloat(formData.get('heuresMachineFin') as string) || undefined,
        dureeHeures: parseFloat(formData.get('dureeHeures') as string) || undefined,
        cout: parseFloat(formData.get('cout') as string) || 0,
        statut: formData.get('statut') as Maintenance['statut'],
        description: formData.get('description') as string,
        notes: formData.get('notes') as string || undefined,
        executantId: formData.get('executantId') as string || undefined
      };

      if (editingMaintenance) {
        await maintenanceService.updateMaintenance(editingMaintenance.id, maintenanceData);
      } else {
        await maintenanceService.createMaintenance(maintenanceData);
      }
      
      refreshMaintenances();
      setIsModalOpen(false);
      setEditingMaintenance(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la maintenance');
    }
  };

  const handleSaveType = async (formData: FormData) => {
    try {
      const typeData: Omit<MaintenanceType, 'id'> = {
        nom: formData.get('nom') as string,
        description: formData.get('description') as string || undefined,
        intervalleHeures: parseFloat(formData.get('intervalleHeures') as string) || undefined,
        intervalleJours: parseInt(formData.get('intervalleJours') as string) || undefined,
        priorite: formData.get('priorite') as MaintenanceType['priorite']
      };

      if (editingType) {
        await maintenanceService.updateMaintenanceType(editingType.id, typeData);
      } else {
        await maintenanceService.createMaintenanceType(typeData);
      }
      
      refreshMaintenances();
      setIsTypeModalOpen(false);
      setEditingType(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du type de maintenance');
    }
  };

  // Statistics
  const getMaintenanceStats = () => {
    const total = maintenances?.length || 0;
    const planned = maintenances?.filter(m => m.statut === 'planifiee').length || 0;
    const inProgress = maintenances?.filter(m => m.statut === 'en_cours').length || 0;
    const completed = maintenances?.filter(m => m.statut === 'terminee').length || 0;
    
    const today = new Date();
    const overdue = maintenances?.filter(m => 
      new Date(m.datePlanifiee) < today && 
      (m.statut === 'planifiee' || m.statut === 'en_cours')
    ).length || 0;
    
    const totalCost = maintenances?.reduce((sum, m) => sum + m.cout, 0) || 0;
    
    return { total, planned, inProgress, completed, overdue, totalCost };
  };

  const stats = getMaintenanceStats();

  // Form components
  const MaintenanceForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSaveMaintenance(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matériel</label>
            <select
              name="materielId"
              required
              defaultValue={editingMaintenance?.materielId || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un matériel</option>
              {materiel?.map(item => (
                <option key={item.id} value={item.id}>
                  {item.nom} - {item.marque} {item.modele} ({item.machineHours || 0}h machine)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de maintenance</label>
            <select
              name="typeId"
              required
              defaultValue={editingMaintenance?.typeId || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un type</option>
              {maintenanceTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.nom} - Priorité: {type.priorite}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date planifiée</label>
            <input
              name="datePlanifiee"
              type="date"
              required
              defaultValue={editingMaintenance?.datePlanifiee || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'exécution</label>
            <input
              name="dateExecution"
              type="date"
              defaultValue={editingMaintenance?.dateExecution || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              required
              defaultValue={editingMaintenance?.statut || 'planifiee'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heures machine fin</label>
            <input
              name="heuresMachineFin"
              type="number"
              step="0.1"
              min="0"
              defaultValue={editingMaintenance?.heuresMachineFin || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Heures machine après maintenance
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (heures)</label>
            <input
              name="dureeHeures"
              type="number"
              step="0.25"
              min="0"
              defaultValue={editingMaintenance?.dureeHeures || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût (€)</label>
            <input
              name="cout"
              type="number"
              step="0.01"
              min="0"
              defaultValue={editingMaintenance?.cout || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exécutant</label>
          <select
            name="executantId"
            defaultValue={editingMaintenance?.executantId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un exécutant</option>
            {ouvriers?.map(ouvrier => (
              <option key={ouvrier.id} value={ouvrier.id}>
                {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            required
            defaultValue={editingMaintenance?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description des travaux de maintenance..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={editingMaintenance?.notes || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes supplémentaires..."
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingMaintenance ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const MaintenanceTypeForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSaveType(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du type</label>
          <input
            name="nom"
            type="text"
            required
            defaultValue={editingType?.nom || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editingType?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalle en heures</label>
            <input
              name="intervalleHeures"
              type="number"
              step="0.1"
              min="0"
              defaultValue={editingType?.intervalleHeures || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Heures machine entre chaque maintenance
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalle en jours</label>
            <input
              name="intervalleJours"
              type="number"
              min="0"
              defaultValue={editingType?.intervalleJours || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jours calendaires entre chaque maintenance
            </p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <select
            name="priorite"
            required
            defaultValue={editingType?.priorite || 'moyenne'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsTypeModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingType ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const MaintenanceDetailModal = () => {
    if (!selectedMaintenance) return null;

    const materiel = getMateriel(selectedMaintenance.materielId);
    const type = getMaintenanceType(selectedMaintenance.typeId);
    const executant = selectedMaintenance.executantId ? getOuvrier(selectedMaintenance.executantId) : undefined;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{type?.nom || 'Maintenance'}</h2>
              <p className="mt-1 text-blue-100">{selectedMaintenance.description}</p>
              <div className="mt-3 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20`}>
                  {selectedMaintenance.statut === 'planifiee' ? 'Planifiée' :
                   selectedMaintenance.statut === 'en_cours' ? 'En cours' :
                   selectedMaintenance.statut === 'terminee' ? 'Terminée' :
                   'Annulée'}
                </span>
                {type && (
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(type.priorite)}`}>
                    Priorité: {type.priorite}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedMaintenance.cout.toLocaleString()} €</div>
              <div className="text-sm text-blue-100">Coût total</div>
            </div>
          </div>
        </div>

        {/* Matériel */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-blue-500" />
            Matériel
          </h3>
          {materiel ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium">{materiel.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marque / Modèle</p>
                <p className="font-medium">{materiel.marque} {materiel.modele}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Numéro de série</p>
                <p className="font-medium">{materiel.numeroSerie}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Heures machine</p>
                <p className="font-medium">{materiel.machineHours || 0}h</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Matériel non trouvé</p>
          )}
        </div>

        {/* Dates et heures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              Planification
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Date planifiée</p>
                <p className="font-medium">{new Date(selectedMaintenance.datePlanifiee).toLocaleDateString()}</p>
              </div>
              {selectedMaintenance.dateExecution && (
                <div>
                  <p className="text-sm text-gray-600">Date d'exécution</p>
                  <p className="font-medium">{new Date(selectedMaintenance.dateExecution).toLocaleDateString()}</p>
                </div>
              )}
              {selectedMaintenance.dureeHeures !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="font-medium">{selectedMaintenance.dureeHeures}h</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-orange-500" />
              Compteurs
            </h3>
            <div className="space-y-3">
              {selectedMaintenance.heuresMachineDebut !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Heures machine début</p>
                  <p className="font-medium">{selectedMaintenance.heuresMachineDebut}h</p>
                </div>
              )}
              {selectedMaintenance.heuresMachineFin !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Heures machine fin</p>
                  <p className="font-medium">{selectedMaintenance.heuresMachineFin}h</p>
                </div>
              )}
              {selectedMaintenance.heuresMachineDebut !== undefined && 
               selectedMaintenance.heuresMachineFin !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Différence</p>
                  <p className="font-medium">
                    {(selectedMaintenance.heuresMachineFin - selectedMaintenance.heuresMachineDebut).toFixed(1)}h
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exécutant et notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {executant && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-500" />
                Exécutant
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{executant.prenom} {executant.nom}</p>
                <p className="text-sm text-gray-600">{executant.qualification}</p>
                <p className="text-sm text-gray-600">{executant.telephone}</p>
              </div>
            </div>
          )}
          
          {selectedMaintenance.notes && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-500" />
                Notes
              </h3>
              <p className="text-sm text-gray-600">{selectedMaintenance.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedMaintenance)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedMaintenance.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion de la Maintenance</h1>
        <div className="flex space-x-3">
          <Button onClick={handleCreateType} variant="secondary">
            <Settings className="w-4 h-4 mr-2" />
            Types de Maintenance
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Maintenance
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planifiées</p>
              <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une maintenance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="planifiee">Planifiées</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminées</option>
                <option value="annulee">Annulées</option>
              </select>
              <select
                value={materielFilter}
                onChange={(e) => setMaterielFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tout le matériel</option>
                {materiel?.map(item => (
                  <option key={item.id} value={item.id}>{item.nom}</option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="this_week">Cette semaine</option>
                <option value="this_month">Ce mois</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des maintenances */}
        {maintenancesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        ) : maintenancesError ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des données</p>
            <p className="text-sm">{maintenancesError.message}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matériel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heures Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaintenances.map((maintenance) => {
                  const materiel = getMateriel(maintenance.materielId);
                  const type = getMaintenanceType(maintenance.typeId);
                  const isOverdue = new Date(maintenance.datePlanifiee) < new Date() && 
                                   (maintenance.statut === 'planifiee' || maintenance.statut === 'en_cours');
                  
                  return (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <Wrench className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{materiel?.nom}</div>
                            <div className="text-sm text-gray-500">{materiel?.marque} {materiel?.modele}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{type?.nom}</div>
                        {type && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(type.priorite)}`}>
                            {type.priorite}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                              {new Date(maintenance.datePlanifiee).toLocaleDateString()}
                            </span>
                            {isOverdue && <AlertTriangle className="w-4 h-4 ml-1 text-red-500" />}
                          </div>
                          {maintenance.dateExecution && (
                            <div className="flex items-center mt-1 text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <span>{new Date(maintenance.dateExecution).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {maintenance.heuresMachineDebut !== undefined && (
                            <div>Début: {maintenance.heuresMachineDebut}h</div>
                          )}
                          {maintenance.heuresMachineFin !== undefined && (
                            <div>Fin: {maintenance.heuresMachineFin}h</div>
                          )}
                          {maintenance.heuresMachineDebut !== undefined && 
                           maintenance.heuresMachineFin !== undefined && (
                            <div className="text-xs text-blue-600 mt-1">
                              Diff: {(maintenance.heuresMachineFin - maintenance.heuresMachineDebut).toFixed(1)}h
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          maintenance.statut === 'planifiee' ? 'bg-blue-100 text-blue-800' :
                          maintenance.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                          maintenance.statut === 'terminee' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {maintenance.statut === 'planifiee' ? 'Planifiée' :
                           maintenance.statut === 'en_cours' ? 'En cours' :
                           maintenance.statut === 'terminee' ? 'Terminée' :
                           'Annulée'}
                        </span>
                        {maintenance.dureeHeures !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            Durée: {maintenance.dureeHeures}h
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {maintenance.cout.toLocaleString()} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(maintenance)}
                            className="text-green-600 hover:text-green-900"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(maintenance)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(maintenance.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredMaintenances.length === 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                      Aucune maintenance trouvée
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Types de maintenance */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Types de maintenance</h2>
          <Button size="sm" onClick={handleCreateType}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Type
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intervalle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(maintenanceTypes || []).map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <Tool className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{type.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{type.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {type.intervalleHeures && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-blue-500" />
                          <span>Tous les {type.intervalleHeures}h</span>
                        </div>
                      )}
                      {type.intervalleJours && (
                        <div className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1 text-green-500" />
                          <span>Tous les {type.intervalleJours} jours</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(type.priorite)}`}>
                      {type.priorite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditType(type)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
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

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaintenance(null);
        }}
        title={editingMaintenance ? 'Modifier la maintenance' : 'Nouvelle maintenance'}
        size="xl"
      >
        <MaintenanceForm />
      </Modal>

      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setEditingType(null);
        }}
        title={editingType ? 'Modifier le type de maintenance' : 'Nouveau type de maintenance'}
        size="lg"
      >
        <MaintenanceTypeForm />
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMaintenance(null);
        }}
        title="Détails de la maintenance"
        size="xl"
      >
        <MaintenanceDetailModal />
      </Modal>
    </div>
  );
};