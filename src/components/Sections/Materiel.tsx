import React, { useState } from 'react';
import { Plus, Edit, Trash2, Wrench, Calendar, Download, Euro, Clock, TrendingUp, Calculator, Search, Filter, Eye, AlertTriangle, CheckCircle, Tool, Truck, MapPin, BarChart3, Percent } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { materielService } from '../../services/materielService';
import { chantierService } from '../../services/chantierService';
import { saisieHeureService } from '../../services/saisieHeureService';
import { Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const MaterielSection: React.FC = () => {
  const { data: materiel, loading, error, refresh } = useRealtimeSupabase<Materiel>({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });
  
  const { data: chantiers } = useRealtimeSupabase({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: saisiesHeures } = useRealtimeSupabase({
    table: 'saisies_heures',
    fetchFunction: saisieHeureService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'usage' | 'value' | 'rate'>('usage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredMateriel = (materiel || [])
  .filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marque.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter(item => 
    statusFilter === 'all' || item.statut === statusFilter
  )
  .filter(item => 
    typeFilter === 'all' || item.type.toLowerCase().includes(typeFilter.toLowerCase())
  )
  .sort((a, b) => {
    if (sortBy === 'usage') {
      return sortDirection === 'asc' 
        ? (a.usageHours || 0) - (b.usageHours || 0)
        : (b.usageHours || 0) - (a.usageHours || 0);
    } else if (sortBy === 'value') {
      return sortDirection === 'asc' ? a.valeur - b.valeur : b.valeur - a.valeur;
    } else { // rate
      return sortDirection === 'asc' 
        ? (a.tarifHoraire || 0) - (b.tarifHoraire || 0)
        : (b.tarifHoraire || 0) - (a.tarifHoraire || 0);
    }
  );

  // Get unique types for filter
  const uniqueTypes = React.useMemo(() => {
    const types = new Set<string>();
    (materiel || []).forEach(item => {
      types.add(item.type);
    });
    return Array.from(types);
  }, [materiel]);

  // Fonction pour calculer les heures d'utilisation d'un matériel
  const getMaterielUsageHours = (materielId: string) => {
    const materielItem = materiel?.find(m => m.id === materielId);
    return materielItem?.usageHours || 0;
  };

  // Fonction pour calculer le revenu généré par un matériel
  const getMaterielRevenue = (item: Materiel) => {
    const usageHours = getMaterielUsageHours(item.id);
    return item.tarifHoraire ? usageHours * item.tarifHoraire : 0;
  };

  // Fonction pour calculer le taux d'utilisation
  const getMaterielUtilizationRate = (materielId: string) => {
    const materielItem = materiel?.find(m => m.id === materielId);
    return materielItem?.utilizationRate || 0;
  };

  const handleEdit = (item: Materiel) => {
    setEditingMateriel(item);
    setIsModalOpen(true);
  };

  const handleViewDetails = (item: Materiel) => {
    setSelectedMateriel(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      try {
        await materielService.delete(id);
        // Force refresh immediately
        refresh();
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du matériel');
      }
    }
  };

  const toggleSort = (field: 'usage' | 'value' | 'rate') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = (materiel || []).length;
    const available = (materiel || []).filter(m => m.statut === 'disponible').length;
    const inService = (materiel || []).filter(m => m.statut === 'en_service').length;
    const maintenance = (materiel || []).filter(m => m.statut === 'maintenance').length;
    const outOfService = (materiel || []).filter(m => m.statut === 'hors_service').length;
    
    const totalValue = (materiel || []).reduce((sum, m) => sum + m.valeur, 0);
    const avgUtilization = (materiel || []).reduce((sum, m) => sum + (m.utilizationRate || 0), 0) / (total || 1);
    
    return { total, available, inService, maintenance, outOfService, totalValue, avgUtilization };
  };

  const stats = getStatistics();

  const handleSave = async (formData: FormData) => {
    const materielData = {
      nom: formData.get('nom') as string,
      type: formData.get('type') as string,
      marque: formData.get('marque') as string,
      modele: formData.get('modele') as string,
      numeroSerie: formData.get('numeroSerie') as string,
      dateAchat: formData.get('dateAchat') as string,
      valeur: parseInt(formData.get('valeur') as string),
      statut: formData.get('statut') as Materiel['statut'],
      prochaineMaintenance: formData.get('prochaineMaintenance') as string || undefined,
      localisation: formData.get('localisation') as string || undefined,
      tarifHoraire: parseFloat(formData.get('tarifHoraire') as string) || undefined,
    };

    try {
      if (editingMateriel) {
        const updatedMateriel = await materielService.update(editingMateriel.id, materielData);
        console.log('Matériel mis à jour:', updatedMateriel);
      } else {
        const newMateriel = await materielService.create(materielData);
        console.log('Nouveau matériel créé:', newMateriel);
      }
      
      // Force refresh immediately
      refresh();
      
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsModalOpen(false);
      setEditingMateriel(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du matériel');
    }
  };

  const MaterielForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du matériel</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingMateriel?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ex: Pelleteuse CAT320D"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                name="type"
                type="text"
                required
                defaultValue={editingMateriel?.type || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ex: Engin de terrassement"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
              <input
                name="marque"
                type="text"
                required
                defaultValue={editingMateriel?.marque || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ex: Caterpillar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
              <input
                name="modele"
                type="text"
                required
                defaultValue={editingMateriel?.modele || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ex: 320D"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <div className="relative">
                <Tool className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="numeroSerie"
                  type="text"
                  required
                  defaultValue={editingMateriel?.numeroSerie || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Ex: CAT320D001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="dateAchat"
                  type="date"
                  required
                  defaultValue={editingMateriel?.dateAchat || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Euro className="w-5 h-5 mr-2" />
            Informations financières
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur d'achat (€)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                <input
                  name="valeur"
                  type="number"
                  min="0"
                  required
                  defaultValue={editingMateriel?.valeur || 0}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 35000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarif horaire (€/h)
                <span className="text-xs text-gray-500 block">Pour facturation</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                <input
                  name="tarifHoraire"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingMateriel?.tarifHoraire || ''}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide si le matériel n'est pas facturable
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingMateriel?.statut || 'disponible'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="disponible">Disponible</option>
                <option value="en_service">En service</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          
          {editingMateriel?.tarifHoraire && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Aperçu de rentabilité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Tarif horaire:</p>
                  <p className="font-medium text-blue-900">{editingMateriel.tarifHoraire}€/h</p>
                </div>
                <div>
                  <p className="text-blue-700">Heures d'utilisation:</p>
                  <p className="font-medium text-blue-900">{getMaterielUsageHours(editingMateriel.id)}h</p>
                </div>
                <div>
                  <p className="text-blue-700">Revenu généré:</p>
                  <p className="font-medium text-blue-900">{getMaterielRevenue(editingMateriel).toLocaleString()}€</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Maintenance et localisation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prochaine maintenance</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="prochaineMaintenance"
                  type="date"
                  defaultValue={editingMateriel?.prochaineMaintenance || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localisation
                <span className="text-xs text-gray-500 block">Chantier où se trouve le matériel</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="localisation"
                  defaultValue={editingMateriel?.localisation || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="">Aucune localisation</option>
                  <option value="Dépôt principal">Dépôt principal</option>
                  <option value="Atelier">Atelier</option>
                  {(chantiers || []).map(chantier => (
                    <option key={chantier.id} value={chantier.nom}>
                      {chantier.nom}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {chantiers?.length || 0} chantier(s) disponible(s)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingMateriel ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
  
  const MaterielDetailModal = () => {
    if (!selectedMateriel) return null;
    
    const usageHours = getMaterielUsageHours(selectedMateriel.id);
    const revenue = getMaterielRevenue(selectedMateriel);
    const utilizationRate = getMaterielUtilizationRate(selectedMateriel.id);
    
    // Calculate age in years
    const purchaseDate = new Date(selectedMateriel.dateAchat);
    const today = new Date();
    const ageYears = today.getFullYear() - purchaseDate.getFullYear();
    const ageMonths = today.getMonth() - purchaseDate.getMonth();
    const ageInYears = ageYears + (ageMonths / 12);
    
    // Calculate depreciation (simple straight-line method)
    const estimatedLifespan = 10; // 10 years for equipment
    const annualDepreciation = selectedMateriel.valeur / estimatedLifespan;
    const currentDepreciation = annualDepreciation * ageInYears;
    const currentValue = Math.max(0, selectedMateriel.valeur - currentDepreciation);
    
    // Calculate ROI if applicable
    let roi = 0;
    if (selectedMateriel.tarifHoraire && revenue > 0) {
      roi = (revenue / selectedMateriel.valeur) * 100;
    }
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedMateriel.nom}</h2>
              <p className="mt-1 text-orange-100">{selectedMateriel.marque} {selectedMateriel.modele}</p>
              <div className="mt-3 flex items-center">
                <StatusBadge status={selectedMateriel.statut} type="materiel" />
                <span className="ml-3 text-sm bg-white/20 px-2 py-1 rounded">
                  {selectedMateriel.type}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedMateriel.valeur.toLocaleString()} €</div>
              <div className="text-sm text-orange-100">Valeur d'achat</div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Tool className="w-5 h-5 mr-2 text-orange-500" />
            Informations techniques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Marque</p>
              <p className="font-medium">{selectedMateriel.marque}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modèle</p>
              <p className="font-medium">{selectedMateriel.modele}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Numéro de série</p>
              <p className="font-medium">{selectedMateriel.numeroSerie}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{selectedMateriel.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date d'achat</p>
              <p className="font-medium">{new Date(selectedMateriel.dateAchat).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Âge</p>
              <p className="font-medium">{ageYears} an{ageYears > 1 ? 's' : ''} {ageMonths !== 0 ? `${Math.abs(ageMonths)} mois` : ''}</p>
            </div>
          </div>
        </div>
        
        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Utilisation
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Heures d'utilisation</p>
                <p className="text-2xl font-bold text-blue-600">{usageHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Taux d'utilisation</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className={`h-2.5 rounded-full ${
                        utilizationRate < 30 ? 'bg-red-500' :
                        utilizationRate < 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${utilizationRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{utilizationRate.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localisation actuelle</p>
                <p className="font-medium">{selectedMateriel.localisation || 'Non spécifiée'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-green-500" />
              Finances
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Valeur d'achat</p>
                  <p className="font-medium">{selectedMateriel.valeur.toLocaleString()} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valeur actuelle (est.)</p>
                  <p className="font-medium">{currentValue.toLocaleString()} €</p>
                </div>
              </div>
              
              {selectedMateriel.tarifHoraire && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Tarif horaire</p>
                    <p className="font-medium">{selectedMateriel.tarifHoraire} €/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenu généré</p>
                    <p className="text-xl font-bold text-green-600">{revenue.toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ROI</p>
                    <p className="font-medium">{roi.toFixed(1)}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Maintenance */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-purple-500" />
            Maintenance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Prochaine maintenance</p>
              <p className="font-medium">
                {selectedMateriel.prochaineMaintenance 
                  ? new Date(selectedMateriel.prochaineMaintenance).toLocaleDateString() 
                  : 'Non planifiée'}
              </p>
              
              {selectedMateriel.prochaineMaintenance && (() => {
                const maintenanceDate = new Date(selectedMateriel.prochaineMaintenance);
                const daysUntilMaintenance = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <p className={`text-xs mt-1 ${
                    daysUntilMaintenance < 0 ? 'text-red-600' :
                    daysUntilMaintenance < 7 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {daysUntilMaintenance < 0 
                      ? `En retard de ${Math.abs(daysUntilMaintenance)} jour(s)` 
                      : `Dans ${daysUntilMaintenance} jour(s)`}
                  </p>
                );
              })()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <StatusBadge status={selectedMateriel.statut} type="materiel" />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedMateriel)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedMateriel.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  // Calcul des statistiques globales
  const totalRevenue = (materiel || []).reduce((sum, item) => sum + getMaterielRevenue(item), 0);
  const averageUtilization = (materiel || []).length > 0 
    ? (materiel || []).reduce((sum, item) => sum + getMaterielUtilizationRate(item.id), 0) / (materiel || []).length 
    : 0;
  const billableMateriel = (materiel || []).filter(item => item.tarifHoraire && item.tarifHoraire > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion du Matériel</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Matériel
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques de rentabilité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matériel</p>
              <p className="text-2xl font-bold text-gray-900">{materiel?.length || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Matériel Facturable</p>
              <p className="text-2xl font-bold text-green-600">{billableMateriel}</p>
              <p className="text-xs text-gray-500">sur {materiel?.length || 0} total</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Euro className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenu Généré</p>
              <p className="text-2xl font-bold text-blue-600">{totalRevenue.toLocaleString()}€</p>
              <p className="text-xs text-gray-500">ce mois</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux d'Utilisation</p>
              <p className="text-2xl font-bold text-purple-600">{averageUtilization.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">moyenne</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher du matériel..."
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
                <option value="disponible">Disponible</option>
                <option value="en_service">En service</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          
          {uniqueTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  typeFilter === 'all' 
                    ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Tous types
              </button>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    typeFilter === type 
                      ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des données</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matériel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marque/Modèle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur / Tarif
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('usage')}
                    >
                      <div className="flex items-center">
                        <span>Utilisation</span>
                        {sortBy === 'usage' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMateriel.map((item) => {
                    const usageHours = getMaterielUsageHours(item.id);
                    const revenue = getMaterielRevenue(item);
                    const utilizationRate = getMaterielUtilizationRate(item.id);
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 hover:text-orange-600 cursor-pointer" onClick={() => handleViewDetails(item)}>
                                {item.nom}
                              </div>
                              <div className="text-sm text-gray-500">{item.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{item.marque}</div>
                          <div className="text-gray-500">{item.modele}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.statut} type="materiel" />
                          {item.tarifHoraire && item.usageHours && item.tarifHoraire * item.usageHours > 0 && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <span className="font-medium text-green-600">{(item.tarifHoraire * item.usageHours).toLocaleString()}€</span>
                              {item.localisation}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{item.valeur.toLocaleString()} €</span>
                              <span className="text-gray-500 text-xs ml-1">valeur</span>
                            </div>
                            {item.tarifHoraire ? (
                              <div className="text-sm">
                                <span className="font-medium text-green-600">{item.tarifHoraire} €/h</span>
                                <span className="text-gray-500 text-xs ml-1">tarif</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">Non facturable</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-1 text-blue-500" />
                              <span className="font-medium text-gray-900">{usageHours.toFixed(1)}h</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {utilizationRate.toFixed(1)}% utilisation
                            </div>
                            {item.tarifHoraire && revenue > 0 && (
                              <div className="text-xs">
                                <span className="font-medium text-green-600">{revenue.toLocaleString()}€</span>
                                <span className="text-gray-500 ml-1">généré</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.prochaineMaintenance ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                              {new Date(item.prochaineMaintenance).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">Non programmée</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
                {filteredMateriel.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                        Aucun matériel trouvé
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMateriel(null);
        }}
        title={editingMateriel ? 'Modifier le matériel' : 'Nouveau matériel'}
        size="lg"
      >
        {!loading && <MaterielForm />}
      </Modal>
      
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMateriel(null);
        }}
        title={selectedMateriel ? selectedMateriel.nom : 'Détails du matériel'}
        size="xl"
      >
        {selectedMateriel && <MaterielDetailModal />}
      </Modal>
    </div>
  );
};