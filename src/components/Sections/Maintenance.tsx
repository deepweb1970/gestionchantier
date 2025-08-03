import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Wrench, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  PenTool as Tool, 
  FileText, 
  User, 
  Settings, 
  BarChart3, 
  Gauge, 
  ArrowRight, 
  Cog, 
  Clipboard, 
  Eye, 
  SkipForward, 
  Calculator,
  TrendingUp,
  Euro,
  Activity,
  Target,
  Zap,
  Shield,
  RefreshCw,
  Bell,
  MapPin,
  Camera,
  Smartphone,
  QrCode,
  History,
  Archive
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { maintenanceService } from '../../services/maintenanceService';
import { materielService } from '../../services/materielService';
import { ouvrierService } from '../../services/ouvrierService';
import { Maintenance, MaintenanceType, Materiel, Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ExportModal } from '../Common/ExportModal';

export const MaintenanceSection: React.FC = () => {
  const { data: maintenances = [], loading: maintenancesLoading, error: maintenancesError, refresh: refreshMaintenances } = useRealtimeSupabase<Maintenance>({
    table: 'maintenances',
    fetchFunction: maintenanceService.getAllMaintenances
  });
  
  const { data: maintenanceTypes = [], loading: typesLoading, error: typesError, refresh: refreshTypes } = useRealtimeSupabase<MaintenanceType>({
    table: 'maintenance_types',
    fetchFunction: maintenanceService.getAllMaintenanceTypes
  });
  
  const { data: materiels = [], loading: materielsLoading, error: materielsError, refresh: refreshMateriels } = useRealtimeSupabase<Materiel>({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });
  
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [maintenancesAPrevoir, setMaintenancesAPrevoir] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPlanificationModal, setShowPlanificationModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [selectedMaterielForPlan, setSelectedMaterielForPlan] = useState<Materiel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [materielFilter, setMaterielFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'maintenances' | 'types' | 'preventive' | 'stats'>('maintenances');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'cost' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isEditMaintenanceModalOpen, setIsEditMaintenanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
  const [isQuickPlanModalOpen, setIsQuickPlanModalOpen] = useState(false);

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

  // Planification rapide state
  const [planificationData, setPlanificationData] = useState({
    type_id: '',
    date_planifiee: '',
    executant_id: '',
    notes: ''
  });

  const combinedLoading = maintenancesLoading || typesLoading || materielsLoading || loading;
  const combinedError = maintenancesError || typesError || materielsError || error;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
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

  const loadOuvriers = async () => {
    const data = await ouvrierService.getAll();
    setOuvriers(data);
  };

  const loadMaintenancesAPrevoir = async () => {
    const data = await maintenanceService.getMaintenancesAPrevoir();
    setMaintenancesAPrevoir(data);
  };

  const handleViewMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailModalOpen(true);
  };

  const handleEditMaintenance = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setIsEditMaintenanceModalOpen(true);
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      try {
        await maintenanceService.deleteMaintenance(id);
        refreshMaintenances();
        alert('Maintenance supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la maintenance');
      }
    }
  };

  const handleSaveMaintenance = async (formData: FormData) => {
    const maintenanceData = {
      materielId: formData.get('materielId') as string,
      typeId: formData.get('typeId') as string || null,
      datePlanifiee: formData.get('datePlanifiee') as string,
      dateExecution: formData.get('dateExecution') as string || null,
      statut: formData.get('statut') as string,
      description: formData.get('description') as string,
      executantId: formData.get('executantId') as string || null,
      dureeHeures: parseFloat(formData.get('dureeHeures') as string) || null,
      heuresMachineDebut: parseFloat(formData.get('heuresMachineDebut') as string) || null,
      heuresMachineFin: parseFloat(formData.get('heuresMachineFin') as string) || null,
      cout: parseFloat(formData.get('cout') as string) || 0,
      piecesUtilisees: (formData.get('piecesUtilisees') as string)?.split(',').map(p => p.trim()).filter(p => p) || [],
      notes: formData.get('notes') as string || null,
      observations: formData.get('observations') as string || null
    };

    try {
      if (editingMaintenance) {
        const updatedMaintenance = await maintenanceService.updateMaintenance(editingMaintenance.id, maintenanceData);
        console.log('Maintenance mise à jour:', updatedMaintenance);
      } else {
        const newMaintenance = await maintenanceService.createMaintenance(maintenanceData);
        console.log('Nouvelle maintenance créée:', newMaintenance);
      }
      
      refreshMaintenances();
      setIsMaintenanceModalOpen(false);
      setIsEditMaintenanceModalOpen(false);
      setEditingMaintenance(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la maintenance');
    }
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
        await maintenanceService.updateMaintenance(editingMaintenance.id, maintenanceData);
      } else {
        await maintenanceService.createMaintenance(maintenanceData);
      }

      refreshMaintenances();
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
        await maintenanceService.updateMaintenanceType(editingType.id, typeData);
      } else {
        await maintenanceService.createMaintenanceType(typeData);
      }

      refreshTypes();
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
        await maintenanceService.deleteMaintenance(id);
        refreshMaintenances();
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
        await maintenanceService.deleteMaintenanceType(id);
        refreshTypes();
      } catch (err) {
        setError('Erreur lors de la suppression du type');
        console.error(err);
      }
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      materiel_id: maintenance.materielId || '',
      type_id: maintenance.typeId || '',
      date_planifiee: maintenance.datePlanifiee || '',
      date_execution: maintenance.dateExecution || '',
      heures_machine_debut: maintenance.heuresMachineDebut?.toString() || '',
      heures_machine_fin: maintenance.heuresMachineFin?.toString() || '',
      duree_heures: maintenance.dureeHeures?.toString() || '',
      cout: maintenance.cout?.toString() || '',
      statut: maintenance.statut || 'planifiee',
      description: maintenance.description || '',
      notes: maintenance.notes || '',
      executant_id: maintenance.executantId || '',
      pieces_utilisees: maintenance.piecesUtilisees || [],
      temps_reel_heures: maintenance.tempsReelHeures?.toString() || '',
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
      intervalle_heures: type.intervalleHeures?.toString() || '',
      intervalle_jours: type.intervalleJours?.toString() || '',
      priorite: type.priorite || 'moyenne',
      seuil_alerte_pourcentage: type.seuilAlertePourcentage || 80,
      pieces_necessaires: type.piecesNecessaires || [],
      cout_estime: type.coutEstime?.toString() || '',
      temps_estime_heures: type.tempsEstimeHeures?.toString() || ''
    });
    setShowTypeModal(true);
  };

  const handleViewDetails = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setShowDetailModal(true);
  };

  const handleQuickPlan = (materiel: Materiel) => {
    setSelectedMaterielForPlan(materiel);
    setPlanificationData({
      type_id: '',
      date_planifiee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      executant_id: '',
      notes: `Maintenance préventive planifiée automatiquement pour ${materiel.nom}`
    });
    setShowPlanificationModal(true);
  };

  const handlePlanificationRapide = async () => {
    if (!selectedMaterielForPlan || !planificationData.type_id) return;
    
    try {
      const maintenanceData = {
        materiel_id: selectedMaterielForPlan.id,
        type_id: planificationData.type_id,
        date_planifiee: planificationData.date_planifiee,
        statut: 'planifiee' as const,
        description: `Maintenance préventive - ${selectedMaterielForPlan.nom}`,
        notes: planificationData.notes,
        executant_id: planificationData.executant_id || null,
        cout: 0
      };

      await maintenanceService.createMaintenance(maintenanceData);
      refreshMaintenances();
      await loadMaintenancesAPrevoir();
      setShowPlanificationModal(false);
      setSelectedMaterielForPlan(null);
    } catch (err) {
      setError('Erreur lors de la planification');
      console.error(err);
    }
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
    
    if (materiel && type && type.intervalleHeures) {
      const currentHours = materiel.usageHours || 0;
      const nextMaintenanceHours = currentHours + type.intervalleHeures;
      return nextMaintenanceHours;
    }
    return null;
  };

  const planPreventiveMaintenance = async (maintenanceAPrevoir: any) => {
    const nextMaintenanceHours = calculateNextMaintenance(maintenanceAPrevoir.materiel_id, maintenanceAPrevoir.type_maintenance_id);
    
    setFormData({
      materiel_id: maintenanceAPrevoir.materiel_id,
      type_id: maintenanceAPrevoir.type_maintenance_id,
      date_planifiee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
                         materiels.find(m => m.id === maintenance.materielId)?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || maintenance.statut === statusFilter;
    const matchesType = typeFilter === 'all' || maintenance.typeId === typeFilter;
    const matchesMateriel = materielFilter === 'all' || maintenance.materielId === materielFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const maintenanceDate = new Date(maintenance.datePlanifiee || '');
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = maintenanceDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          matchesDate = maintenanceDate >= weekStart && maintenanceDate <= weekEnd;
          break;
        case 'this_month':
          matchesDate = maintenanceDate.getMonth() === today.getMonth() && 
                       maintenanceDate.getFullYear() === today.getFullYear();
          break;
        case 'overdue':
          matchesDate = maintenanceDate < today && maintenance.statut === 'planifiee';
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesMateriel && matchesDate;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.datePlanifiee || '').getTime();
        bValue = new Date(b.datePlanifiee || '').getTime();
        break;
      case 'priority':
        const aPriority = maintenanceTypes.find(t => t.id === a.typeId)?.priorite || 'moyenne';
        const bPriority = maintenanceTypes.find(t => t.id === b.typeId)?.priorite || 'moyenne';
        const priorityOrder = { 'critique': 4, 'haute': 3, 'moyenne': 2, 'basse': 1 };
        aValue = priorityOrder[aPriority];
        bValue = priorityOrder[bPriority];
        break;
      case 'cost':
        aValue = a.cout || 0;
        bValue = b.cout || 0;
        break;
      case 'status':
        aValue = a.statut;
        bValue = b.statut;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const toggleSort = (field: 'date' | 'priority' | 'cost' | 'status') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getMaintenanceStats = () => {
    const total = maintenances.length;
    const planifiees = maintenances.filter(m => m.statut === 'planifiee').length;
    const enCours = maintenances.filter(m => m.statut === 'en_cours').length;
    const terminees = maintenances.filter(m => m.statut === 'terminee').length;
    const coutTotal = maintenances.reduce((sum, m) => sum + (m.cout || 0), 0);
    const coutMoyen = total > 0 ? coutTotal / total : 0;
    
    const today = new Date();
    const thisMonth = maintenances.filter(m => {
      const date = new Date(m.datePlanifiee || '');
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }).length;
    
    const enRetard = maintenances.filter(m => {
      const date = new Date(m.datePlanifiee || '');
      return date < today && m.statut === 'planifiee';
    }).length;
    
    return {
      total,
      planifiees,
      enCours,
      terminees,
      coutTotal,
      coutMoyen,
      thisMonth,
      enRetard
    };
  };

  const getTypeStats = () => {
    const typeUsage = maintenances.reduce((acc, maintenance) => {
      const type = maintenanceTypes.find(t => t.id === maintenance.typeId);
      if (type) {
        acc[type.nom] = (acc[type.nom] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeUsage).map(([nom, count]) => ({ nom, count }));
  };

  const getMaterielMaintenanceStatus = () => {
    return materiels.map(materiel => {
      const maintenanceHistory = maintenances.filter(m => m.materielId === materiel.id);
      const lastMaintenance = maintenanceHistory
        .filter(m => m.statut === 'terminee')
        .sort((a, b) => new Date(b.dateExecution || '').getTime() - new Date(a.dateExecution || '').getTime())[0];
      
      const nextMaintenance = maintenances.find(m => 
        m.materielId === materiel.id && m.statut === 'planifiee'
      );
      
      const utilizationRate = materiel.utilizationRate || 0;
      const needsMaintenance = utilizationRate > 80 || 
        (materiel.machineHours && materiel.nextMaintenanceHours && 
         materiel.machineHours >= materiel.nextMaintenanceHours);
      
      return {
        materiel,
        maintenanceCount: maintenanceHistory.length,
        lastMaintenance,
        nextMaintenance,
        needsMaintenance,
        utilizationRate
      };
    });
  };

  const stats = getMaintenanceStats();
  const typeStats = getTypeStats();
  const materielStatus = getMaterielMaintenanceStatus();

  const MaintenanceForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSaveMaintenance(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          
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
                {materiels?.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nom} - {item.marque} {item.modele}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de maintenance</label>
              <select
                name="typeId"
                defaultValue={editingMaintenance?.typeId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun type spécifique</option>
                {maintenanceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom} - {type.priorite}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              required
              defaultValue={editingMaintenance?.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description détaillée de la maintenance..."
            />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Planification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date planifiée</label>
              <input
                name="datePlanifiee"
                type="date"
                required
                defaultValue={editingMaintenance?.datePlanifiee || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'exécution</label>
              <input
                name="dateExecution"
                type="date"
                defaultValue={editingMaintenance?.dateExecution || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingMaintenance?.statut || 'planifiee'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Exécution
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exécutant</label>
              <select
                name="executantId"
                defaultValue={editingMaintenance?.executantId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Aucun exécutant assigné</option>
                {ouvriers?.filter(o => o.statut === 'actif').map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée (heures)</label>
              <input
                name="dureeHeures"
                type="number"
                step="0.5"
                min="0"
                defaultValue={editingMaintenance?.dureeHeures || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: 2.5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures machine début</label>
              <input
                name="heuresMachineDebut"
                type="number"
                step="0.1"
                min="0"
                defaultValue={editingMaintenance?.heuresMachineDebut || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Compteur avant maintenance"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures machine fin</label>
              <input
                name="heuresMachineFin"
                type="number"
                step="0.1"
                min="0"
                defaultValue={editingMaintenance?.heuresMachineFin || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Compteur après maintenance"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût (€)</label>
            <input
              name="cout"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={editingMaintenance?.cout || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Coût total de la maintenance"
            />
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Notes et observations
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pièces utilisées (séparées par des virgules)</label>
              <textarea
                name="piecesUtilisees"
                rows={2}
                defaultValue={editingMaintenance?.piecesUtilisees?.join(', ') || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Ex: Filtre à huile, Joint de culasse, Courroie"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editingMaintenance?.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Notes internes sur la maintenance"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
              <textarea
                name="observations"
                rows={3}
                defaultValue={editingMaintenance?.observations || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Observations techniques, problèmes rencontrés, recommandations..."
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => {
          setIsMaintenanceModalOpen(false);
          setIsEditMaintenanceModalOpen(false);
          setEditingMaintenance(null);
        }}>
          Annuler
        </Button>
        <Button type="submit">
          {editingMaintenance ? 'Mettre à jour' : 'Créer la maintenance'}
        </Button>
      </div>
    </form>
  );

  const MaintenanceDetailModal = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Matériel</p>
            <p className="font-medium">
              {materiels.find(m => m.id === selectedMaintenance?.materielId)?.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">
              {maintenanceTypes.find(t => t.id === selectedMaintenance?.typeId)?.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <StatusBadge status={selectedMaintenance?.statut} type="maintenance_status" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Coût</p>
            <p className="font-medium text-green-600">
              {selectedMaintenance?.cout ? `${selectedMaintenance.cout.toFixed(2)} €` : 'Non estimé'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Planning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date planifiée</p>
            <p className="font-medium">
              {selectedMaintenance?.datePlanifiee ? 
                new Date(selectedMaintenance.datePlanifiee).toLocaleDateString() : 
                'Non planifiée'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date d'exécution</p>
            <p className="font-medium">
              {selectedMaintenance?.dateExecution ? 
                new Date(selectedMaintenance.dateExecution).toLocaleDateString() : 
                'Non exécutée'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Exécutant</p>
            <p className="font-medium">
              {selectedMaintenance?.executantId ? 
                (() => {
                  const executant = ouvriers.find(o => o.id === selectedMaintenance.executantId);
                  return executant ? `${executant.prenom} ${executant.nom}` : 'Inconnu';
                })() : 
                'Non assigné'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Durée</p>
            <p className="font-medium">
              {selectedMaintenance?.dureeHeures ? 
                `${selectedMaintenance.dureeHeures}h` : 
                'Non estimée'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Description</h3>
        <p className="text-gray-700 bg-gray-50 p-3 rounded">
          {selectedMaintenance?.description}
        </p>
      </div>

      {selectedMaintenance?.notes && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            {selectedMaintenance.notes}
          </p>
        </div>
      )}

      {selectedMaintenance?.observations && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Observations</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            {selectedMaintenance.observations}
          </p>
        </div>
      )}
    </div>
  );

  if (combinedLoading) {
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
          <p className="text-gray-600">Gestion complète des maintenances et maintenance préventive</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowStatsModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiques</span>
          </Button>
          <Button
            onClick={() => setShowExportModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </Button>
          <Button
            onClick={() => setShowTypeModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Types</span>
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

      {combinedError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{combinedError}</p>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Maintenances</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">{stats.thisMonth} ce mois</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.planifiees}</p>
              {stats.enRetard > 0 && (
                <p className="text-xs text-red-500 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.enRetard} en retard
                </p>
              )}
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
              <p className="text-xs text-gray-500">
                {stats.total > 0 ? Math.round((stats.terminees / stats.total) * 100) : 0}% du total
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coût Total</p>
              <p className="text-2xl font-bold text-purple-600">{stats.coutTotal.toLocaleString()} €</p>
              <p className="text-xs text-gray-500">Moy: {stats.coutMoyen.toFixed(0)} €</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Euro className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

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
              <span>Maintenances ({stats.total})</span>
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
              <span>Types ({maintenanceTypes.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analyses</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Maintenances Tab */}
      {activeTab === 'maintenances' && (
        <>
          {/* Filtres avancés */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Tous</option>
                  <option value="planifiee">Planifiée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Tous</option>
                  {maintenanceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.nom}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matériel</label>
                <select
                  value={materielFilter}
                  onChange={(e) => setMaterielFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Tout</option>
                  {materiels.map(materiel => (
                    <option key={materiel.id} value={materiel.id}>{materiel.nom}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Toutes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="this_week">Cette semaine</option>
                  <option value="this_month">Ce mois</option>
                  <option value="overdue">En retard</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setMaterielFilter('all');
                    setDateFilter('all');
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Liste des maintenances */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matériel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type / Priorité
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center">
                        <span>Date planifiée</span>
                        {sortBy === 'date' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center">
                        <span>Statut</span>
                        {sortBy === 'status' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('cost')}
                    >
                      <div className="flex items-center">
                        <span>Coût</span>
                        {sortBy === 'cost' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
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
                    const materiel = materiels.find(m => m.id === maintenance.materielId);
                    const type = maintenanceTypes.find(t => t.id === maintenance.typeId);
                    const executant = ouvriers.find(o => o.id === maintenance.executantId);
                    const isOverdue = maintenance.datePlanifiee && 
                      new Date(maintenance.datePlanifiee) < new Date() && 
                      maintenance.statut === 'planifiee';

                    return (
                      <tr key={maintenance.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
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
                              {materiel?.machineHours && (
                                <div className="text-xs text-blue-600">
                                  {materiel.machineHours}h machine
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{type?.nom || 'Type supprimé'}</div>
                          <div className="text-sm text-gray-500">{maintenance.description}</div>
                          {type?.priorite && (
                            <StatusBadge status={type.priorite} type="maintenance_priority" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {maintenance.datePlanifiee ? new Date(maintenance.datePlanifiee).toLocaleDateString() : '-'}
                          </div>
                          {maintenance.dateExecution && (
                            <div className="text-sm text-green-600">
                              Exécutée: {new Date(maintenance.dateExecution).toLocaleDateString()}
                            </div>
                          )}
                          {isOverdue && (
                            <div className="text-xs text-red-600 flex items-center mt-1">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              En retard
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={maintenance.statut} type="maintenance_status" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maintenance.cout ? (
                            <div className="flex items-center">
                              <Euro className="w-4 h-4 mr-1 text-green-500" />
                              <span className="font-medium">{maintenance.cout.toFixed(2)} €</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Non estimé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {executant ? `${executant.prenom} ${executant.nom}` : 'Non assigné'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewMaintenance(maintenance)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditMaintenance(maintenance)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMaintenance(maintenance.id)}
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
                  <tbody>
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        Aucune maintenance trouvée
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Maintenance Préventive Tab */}
      {activeTab === 'preventive' && (
        <div className="space-y-6">
          {/* Alertes de maintenance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Maintenances à prévoir</h2>
              </div>
              <Button
                onClick={loadMaintenancesAPrevoir}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
            
            {maintenancesAPrevoir.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">Aucune maintenance préventive à prévoir pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">Tous vos équipements sont dans les normes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenancesAPrevoir.map((item) => (
                  <div key={`${item.materiel_id}-${item.type_maintenance_id}`} 
                       className={`border rounded-lg p-4 ${
                         item.pourcentage_utilisation >= 95 ? 'border-red-300 bg-red-50' :
                         item.pourcentage_utilisation >= 85 ? 'border-orange-300 bg-orange-50' :
                         'border-yellow-300 bg-yellow-50'
                       }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className={`w-5 h-5 ${
                          item.pourcentage_utilisation >= 95 ? 'text-red-500' :
                          item.pourcentage_utilisation >= 85 ? 'text-orange-500' :
                          'text-yellow-500'
                        }`} />
                        <h3 className="font-medium text-gray-900">{item.materiel_nom}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.pourcentage_utilisation >= 95 ? 'bg-red-100 text-red-800' :
                        item.pourcentage_utilisation >= 85 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.pourcentage_utilisation >= 95 ? 'URGENT' :
                         item.pourcentage_utilisation >= 85 ? 'IMPORTANT' : 'ATTENTION'}
                      </span>
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
                        <span className={`font-medium ${
                          item.pourcentage_utilisation >= 95 ? 'text-red-600' :
                          item.pourcentage_utilisation >= 85 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {item.pourcentage_utilisation}%
                        </span>
                      </div>
                      {item.cout_estime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Coût estimé:</span>
                          <span className="font-medium text-green-600">{item.cout_estime} €</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className={`h-3 rounded-full ${
                          item.pourcentage_utilisation >= 95 ? 'bg-red-500' :
                          item.pourcentage_utilisation >= 85 ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(item.pourcentage_utilisation, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => planPreventiveMaintenance(item)}
                        className="flex-1 flex items-center justify-center space-x-2"
                        size="sm"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Planifier</span>
                      </Button>
                      <Button
                        onClick={() => {
                          const materiel = materiels.find(m => m.id === item.materiel_id);
                          if (materiel) handleQuickPlan(materiel);
                        }}
                        variant="secondary"
                        size="sm"
                        title="Planification rapide"
                      >
                        <Zap className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statut du matériel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              État du matériel
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materielStatus.map((status) => (
                <div key={status.materiel.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{status.materiel.nom}</h4>
                      <p className="text-sm text-gray-500">{status.materiel.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status.needsMaintenance && (
                        <Bell className="w-4 h-4 text-red-500" title="Maintenance requise" />
                      )}
                      <StatusBadge status={status.materiel.statut} type="materiel" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maintenances:</span>
                      <span className="font-medium">{status.maintenanceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Utilisation:</span>
                      <span className={`font-medium ${
                        status.utilizationRate > 80 ? 'text-red-600' :
                        status.utilizationRate > 60 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {status.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                    {status.lastMaintenance && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dernière:</span>
                        <span className="font-medium">
                          {new Date(status.lastMaintenance.dateExecution || '').toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {status.nextMaintenance && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prochaine:</span>
                        <span className="font-medium text-blue-600">
                          {new Date(status.nextMaintenance.datePlanifiee || '').toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <Button
                      onClick={() => handleQuickPlan(status.materiel)}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Planifier
                    </Button>
                    {status.maintenanceCount > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Voir historique"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                    Nom / Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coûts / Temps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceTypes.map((type) => {
                  const usageCount = maintenances.filter(m => m.typeId === type.id).length;
                  
                  return (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{type.nom}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {type.intervalleHeures && (
                            <div className="text-gray-900">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {type.intervalleHeures}h machine
                            </div>
                          )}
                          {type.intervalleJours && (
                            <div className="text-gray-500">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {type.intervalleJours} jours
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={type.priorite} type="maintenance_priority" />
                        <div className="text-xs text-gray-500 mt-1">
                          Seuil: {type.seuilAlertePourcentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {type.coutEstime && (
                            <div className="text-gray-900 flex items-center">
                              <Euro className="w-4 h-4 mr-1 text-green-500" />
                              {type.coutEstime} €
                            </div>
                          )}
                          {type.tempsEstimeHeures && (
                            <div className="text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {type.tempsEstimeHeures}h
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium">{usageCount}</span>
                          <span className="text-sm text-gray-500 ml-1">fois</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleEditType(type)}
                            variant="secondary"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteType(type.id)}
                            variant="secondary"
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
      )}

      {/* Statistiques Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Graphiques de performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Répartition par type
              </h3>
              <div className="space-y-3">
                {typeStats.map((stat, index) => (
                  <div key={stat.nom} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded mr-3 ${
                        index % 4 === 0 ? 'bg-blue-500' :
                        index % 4 === 1 ? 'bg-green-500' :
                        index % 4 === 2 ? 'bg-orange-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{stat.nom}</span>
                    </div>
                    <span className="text-sm font-medium">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Indicateurs clés
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de réalisation</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.total > 0 ? (stats.terminees / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {stats.total > 0 ? Math.round((stats.terminees / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Respect des délais</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${stats.planifiees > 0 ? ((stats.planifiees - stats.enRetard) / stats.planifiees) * 100 : 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {stats.planifiees > 0 ? Math.round(((stats.planifiees - stats.enRetard) / stats.planifiees) * 100) : 100}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coût moyen</span>
                  <span className="text-sm font-medium text-purple-600">
                    {stats.coutMoyen.toFixed(0)} €
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Budget mensuel</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats.coutTotal.toLocaleString()} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Matériel nécessitant une attention */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Matériel nécessitant une attention
            </h3>
            
            <div className="space-y-3">
              {materielStatus
                .filter(status => status.needsMaintenance || status.utilizationRate > 70)
                .map((status) => (
                  <div key={status.materiel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.needsMaintenance ? 'bg-red-500' :
                        status.utilizationRate > 80 ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{status.materiel.nom}</h4>
                        <p className="text-sm text-gray-500">
                          Utilisation: {status.utilizationRate.toFixed(1)}% - 
                          {status.maintenanceCount} maintenance(s)
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleQuickPlan(status.materiel)}
                      size="sm"
                      variant="secondary"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Planifier
                    </Button>
                  </div>
                ))}
              
              {materielStatus.filter(status => status.needsMaintenance || status.utilizationRate > 70).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">Tout le matériel est en bon état</p>
                </div>
              )}
            </div>
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
        size="xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
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
                    {materiel.nom} - {materiel.type} ({materiel.statut})
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
                    {type.nom} ({type.priorite})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date planifiée *
              </label>
              <input
                type="date"
                value={formData.date_planifiee}
                onChange={(e) => setFormData({ ...formData, date_planifiee: e.target.value })}
                required
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
                  variant="secondary"
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
                {ouvriers.filter(o => o.statut === 'actif').map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
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
              placeholder="Décrivez les travaux de maintenance à effectuer..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes et observations
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Notes complémentaires, pièces nécessaires, précautions..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
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
        size="lg"
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
                placeholder="Ex: Révision générale"
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
                Intervalle (heures machine)
              </label>
              <input
                type="number"
                step="0.01"
                value={typeFormData.intervalle_heures}
                onChange={(e) => setTypeFormData({ ...typeFormData, intervalle_heures: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ex: 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalle (jours calendaires)
              </label>
              <input
                type="number"
                value={typeFormData.intervalle_jours}
                onChange={(e) => setTypeFormData({ ...typeFormData, intervalle_jours: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ex: 365"
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
              placeholder="Description détaillée du type de maintenance..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
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

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMaintenance(null);
        }}
        title={`Détails - ${selectedMaintenance?.description}`}
        size="xl"
      >
        {selectedMaintenance && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Matériel</p>
                  <p className="font-medium">
                    {materiels.find(m => m.id === selectedMaintenance.materielId)?.nom}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">
                    {maintenanceTypes.find(t => t.id === selectedMaintenance.typeId)?.nom}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <StatusBadge status={selectedMaintenance.statut} type="maintenance_status" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coût</p>
                  <p className="font-medium text-green-600">
                    {selectedMaintenance.cout ? `${selectedMaintenance.cout.toFixed(2)} €` : 'Non estimé'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date planifiée</p>
                  <p className="font-medium">
                    {selectedMaintenance.datePlanifiee ? 
                      new Date(selectedMaintenance.datePlanifiee).toLocaleDateString() : 
                      'Non planifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date d'exécution</p>
                  <p className="font-medium">
                    {selectedMaintenance.dateExecution ? 
                      new Date(selectedMaintenance.dateExecution).toLocaleDateString() : 
                      'Non exécutée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exécutant</p>
                  <p className="font-medium">
                    {selectedMaintenance.executantId ? 
                      (() => {
                        const executant = ouvriers.find(o => o.id === selectedMaintenance.executantId);
                        return executant ? `${executant.prenom} ${executant.nom}` : 'Inconnu';
                      })() : 
                      'Non assigné'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="font-medium">
                    {selectedMaintenance.dureeHeures ? 
                      `${selectedMaintenance.dureeHeures}h` : 
                      'Non estimée'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {selectedMaintenance.description}
              </p>
            </div>

            {selectedMaintenance.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedMaintenance.notes}
                </p>
              </div>
            )}

            {selectedMaintenance.observations && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Observations</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedMaintenance.observations}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de planification rapide */}
      <Modal
        isOpen={showPlanificationModal}
        onClose={() => {
          setShowPlanificationModal(false);
          setSelectedMaterielForPlan(null);
        }}
        title={`Planification rapide - ${selectedMaterielForPlan?.nom}`}
        size="md"
      >
        {selectedMaterielForPlan && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                {selectedMaterielForPlan.nom}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedMaterielForPlan.marque} {selectedMaterielForPlan.modele}
              </p>
              <div className="mt-2 flex items-center">
                <Gauge className="w-4 h-4 mr-1 text-blue-600" />
                <span className="text-sm font-medium">
                  Heures machine: {selectedMaterielForPlan.machineHours || 0}h
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de maintenance *
              </label>
              <select
                value={planificationData.type_id}
                onChange={(e) => setPlanificationData({ ...planificationData, type_id: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un type</option>
                {maintenanceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom} - {type.priorite}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date planifiée *
              </label>
              <input
                type="date"
                value={planificationData.date_planifiee}
                onChange={(e) => setPlanificationData({ ...planificationData, date_planifiee: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exécutant
              </label>
              <select
                value={planificationData.executant_id}
                onChange={(e) => setPlanificationData({ ...planificationData, executant_id: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un exécutant</option>
                {ouvriers.filter(o => o.statut === 'actif').map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={planificationData.notes}
                onChange={(e) => setPlanificationData({ ...planificationData, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowPlanificationModal(false);
                  setSelectedMaterielForPlan(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handlePlanificationRapide}>
                <Calendar className="w-4 h-4 mr-2" />
                Planifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal for Maintenance */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setEditingMaintenance(null);
        }}
        title="Nouvelle maintenance"
        size="xl"
      >
        <MaintenanceForm />
      </Modal>

      {/* Modal de modification de maintenance */}
      <Modal
        isOpen={isEditMaintenanceModalOpen}
        onClose={() => {
          setIsEditMaintenanceModalOpen(false);
          setEditingMaintenance(null);
        }}
        title="Modifier la maintenance"
        size="xl"
      >
        <MaintenanceForm />
      </Modal>

      {/* Modal de détails de maintenance */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMaintenance(null);
        }}
        title={`Détails - ${selectedMaintenance?.description}`}
        size="xl"
      >
        {selectedMaintenance && <MaintenanceDetailModal />}
      </Modal>

      {/* Modal d'export */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exporter les maintenances"
        data={filteredMaintenances.map(maintenance => {
          const materiel = materiels.find(m => m.id === maintenance.materielId);
          const type = maintenanceTypes.find(t => t.id === maintenance.typeId);
          const executant = ouvriers.find(o => o.id === maintenance.executantId);
          
          return {
            'Matériel': materiel?.nom || 'Inconnu',
            'Type': type?.nom || 'Inconnu',
            'Description': maintenance.description,
            'Date planifiée': maintenance.datePlanifiee ? new Date(maintenance.datePlanifiee).toLocaleDateString() : '',
            'Date exécution': maintenance.dateExecution ? new Date(maintenance.dateExecution).toLocaleDateString() : '',
            'Statut': maintenance.statut,
            'Coût': maintenance.cout ? `${maintenance.cout.toFixed(2)} €` : '',
            'Exécutant': executant ? `${executant.prenom} ${executant.nom}` : '',
            'Notes': maintenance.notes || ''
          };
        })}
        filename="maintenances"
      />
    </div>
  );
};