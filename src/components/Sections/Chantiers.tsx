import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  MapPin, 
  Calendar, 
  Download, 
  Eye, 
  Image, 
  BarChart3, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Map, 
  Users, 
  Wrench, 
  DollarSign,
  User,
  Euro
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { clientService } from '../../services/clientService';
import { Chantier, Client } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { PhotosManager } from './PhotosManager';

export const Chantiers: React.FC = () => {
  const { data: chantiers, loading, error, refresh } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: clients } = useRealtimeSupabase<Client>({
    table: 'clients',
    fetchFunction: clientService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'budget' | 'avancement'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [mapView, setMapView] = useState(false);

  const filteredChantiers = (chantiers || []).filter(chantier => {
    const matchesSearch = chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chantier.statut === statusFilter;
    const matchesClient = clientFilter === 'all' || chantier.client === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        : new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
    } else if (sortBy === 'budget') {
      return sortDirection === 'asc' ? a.budget - b.budget : b.budget - a.budget;
    } else { // avancement
      return sortDirection === 'asc' ? a.avancement - b.avancement : b.avancement - a.avancement;
    }
  });

  const handleEdit = (chantier: Chantier) => {
    setEditingChantier(chantier);
    setIsModalOpen(true);
  };

  const handleViewDetails = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setIsDetailModalOpen(true);
  };

  const handleViewPhotos = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setIsPhotosModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chantier ?')) {
      try {
        await chantierService.delete(id);
        // Force refresh immediately
        refresh();
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du chantier');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const clientId = formData.get('clientId') as string;
    
    const chantierData = {
      nom: formData.get('nom') as string,
      description: formData.get('description') as string,
      adresse: formData.get('adresse') as string,
      dateDebut: formData.get('dateDebut') as string,
      dateFin: formData.get('dateFin') as string || undefined,
      statut: formData.get('statut') as Chantier['statut'],
      avancement: parseInt(formData.get('avancement') as string),
      budget: parseInt(formData.get('budget') as string),
      coordinates: {
        lat: parseFloat(formData.get('latitude') as string) || undefined,
        lng: parseFloat(formData.get('longitude') as string) || undefined
      }
    };

    try {
      if (editingChantier) {
        const updatedChantier = await chantierService.update(editingChantier.id, chantierData, clientId);
        console.log('Chantier mis à jour:', updatedChantier);
      } else {
        const newChantier = await chantierService.create(chantierData, clientId);
        console.log('Nouveau chantier créé:', newChantier);
      }
      
      // Force refresh immediately
      refresh();
      
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsModalOpen(false);
      setEditingChantier(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du chantier');
    }
  };

  const toggleSort = (field: 'date' | 'budget' | 'avancement') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getStatusCounts = () => {
    const counts = {
      actif: 0,
      planifie: 0,
      termine: 0,
      pause: 0
    };
    
    (chantiers || []).forEach(chantier => {
      counts[chantier.statut]++;
    });
    
    return counts;
  };

  const getTotalBudget = () => {
    return (chantiers || []).reduce((sum, chantier) => sum + chantier.budget, 0);
  };

  const getAverageProgress = () => {
    const activeChantiers = (chantiers || []).filter(c => c.statut === 'actif');
    if (activeChantiers.length === 0) return 0;
    return Math.round(activeChantiers.reduce((sum, c) => sum + c.avancement, 0) / activeChantiers.length);
  };

  const statusCounts = getStatusCounts();

  const ChantierForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chantier</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingChantier?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: Villa Moderne Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                name="clientId"
                required
                defaultValue={clients?.find(c => c.nom === editingChantier?.client)?.id || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Sélectionner un client</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom} ({client.type === 'particulier' ? 'Particulier' : 'Entreprise'})
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
              defaultValue={editingChantier?.description || ''}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Description détaillée du projet..."
            />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Localisation
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
            <textarea
              name="adresse"
              rows={2}
              required
              defaultValue={editingChantier?.adresse || ''}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Numéro, rue, code postal, ville"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optionnel)</label>
              <input
                name="latitude"
                type="number"
                step="0.00000001"
                defaultValue={editingChantier?.coordinates?.lat || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Ex: 48.8566"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optionnel)</label>
              <input
                name="longitude"
                type="number"
                step="0.00000001"
                defaultValue={editingChantier?.coordinates?.lng || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Ex: 2.3522"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Planification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                name="dateDebut"
                type="date"
                required
                defaultValue={editingChantier?.dateDebut || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (prévisionnelle)</label>
              <input
                name="dateFin"
                type="date"
                defaultValue={editingChantier?.dateFin || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                required
                defaultValue={editingChantier?.statut || 'planifie'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="planifie">Planifié</option>
                <option value="actif">Actif</option>
                <option value="pause">En pause</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avancement (%)</label>
              <div className="flex items-center">
                <input
                  name="avancement"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  defaultValue={editingChantier?.avancement || 0}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  onChange={(e) => {
                    const value = e.target.value;
                    const output = e.currentTarget.parentElement?.querySelector('output');
                    if (output) output.value = value;
                  }}
                />
                <output className="ml-2 w-12 text-center font-medium text-gray-700">
                  {editingChantier?.avancement || 0}
                </output>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
              <input
                name="budget"
                type="number"
                min="0"
                step="1000"
                required
                defaultValue={editingChantier?.budget || 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Ex: 150000"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingChantier ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const ChantierDetailModal = () => {
    if (!selectedChantier) return null;

    const client = clients?.find(c => c.nom === selectedChantier.client);
    const startDate = new Date(selectedChantier.dateDebut);
    const endDate = selectedChantier.dateFin ? new Date(selectedChantier.dateFin) : null;
    
    // Calculate duration in days
    const durationDays = endDate 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Calculate days elapsed
    const today = new Date();
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate days remaining
    const remainingDays = endDate && today < endDate
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Get worker hours and equipment usage
    const workerHours = selectedChantier.heuresOuvriersTotal || 0;
    const equipmentHours = selectedChantier.heuresMaterielTotal || 0;
    const laborCost = selectedChantier.coutMainOeuvre || 0;
    const equipmentCost = selectedChantier.coutMateriel || 0;
    const totalCost = laborCost + equipmentCost;
    const costPercentage = selectedChantier.budget > 0 ? (totalCost / selectedChantier.budget) * 100 : 0;
    
    // Calculate if project is on time, ahead, or behind schedule
    let scheduleStatus = 'on-time';
    if (selectedChantier.statut === 'actif' && endDate) {
      const expectedProgress = Math.min(100, Math.round((elapsedDays / durationDays!) * 100));
      if (selectedChantier.avancement > expectedProgress + 10) {
        scheduleStatus = 'ahead';
      } else if (selectedChantier.avancement < expectedProgress - 10) {
        scheduleStatus = 'behind';
      }
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedChantier.nom}</h2>
              <p className="mt-1 text-blue-100">{selectedChantier.description}</p>
              <div className="mt-3 flex items-center">
                <StatusBadge status={selectedChantier.statut} type="chantier" />
                <span className="ml-3 text-sm bg-white/20 px-2 py-1 rounded">
                  {selectedChantier.avancement}% complété
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedChantier.budget.toLocaleString()} €</div>
              <div className="text-sm text-blue-100">Budget total</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Avancement du projet</h3>
            <span className="text-sm text-gray-500">{selectedChantier.avancement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                selectedChantier.avancement < 30 ? 'bg-red-500' :
                selectedChantier.avancement < 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${selectedChantier.avancement}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Client and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Client
            </h3>
            <div className="space-y-2">
              <p className="text-gray-800 font-medium">{selectedChantier.client}</p>
              {client && (
                <>
                  <p className="text-gray-600">{client.email}</p>
                  <p className="text-gray-600">{client.telephone}</p>
                  <p className="text-gray-600">{client.adresse}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-500" />
              Localisation
            </h3>
            <p className="text-gray-800">{selectedChantier.adresse}</p>
            {selectedChantier.coordinates && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Latitude: {selectedChantier.coordinates.lat}</p>
                <p>Longitude: {selectedChantier.coordinates.lng}</p>
              </div>
            )}
            <div className="mt-3">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedChantier.adresse)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Map className="w-4 h-4 mr-1" />
                Voir sur Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-500" />
            Calendrier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700">Date de début</div>
              <div className="font-medium">{startDate.toLocaleDateString()}</div>
              <div className="text-xs text-blue-600 mt-1">Il y a {elapsedDays} jours</div>
            </div>
            
            {endDate && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-700">Date de fin prévue</div>
                <div className="font-medium">{endDate.toLocaleDateString()}</div>
                <div className="text-xs text-purple-600 mt-1">
                  {remainingDays > 0 
                    ? `Dans ${remainingDays} jours` 
                    : 'Date dépassée'}
                </div>
              </div>
            )}
            
            {durationDays && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-700">Durée totale</div>
                <div className="font-medium">{durationDays} jours</div>
                <div className={`text-xs mt-1 flex items-center ${
                  scheduleStatus === 'ahead' ? 'text-green-600' :
                  scheduleStatus === 'behind' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {scheduleStatus === 'ahead' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {scheduleStatus === 'behind' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {scheduleStatus === 'on-time' && <Clock className="w-3 h-3 mr-1" />}
                  {scheduleStatus === 'ahead' ? 'En avance' :
                   scheduleStatus === 'behind' ? 'En retard' :
                   'Dans les temps'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resource Usage */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Utilisation des ressources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Heures ouvriers</span>
                  </div>
                  <span className="text-sm font-medium">{workerHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Coût main d'œuvre</span>
                  <span className="text-xs font-medium text-blue-600">{laborCost.toLocaleString()} €</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Wrench className="w-4 h-4 mr-1 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Heures matériel</span>
                  </div>
                  <span className="text-sm font-medium">{equipmentHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Coût matériel</span>
                  <span className="text-xs font-medium text-orange-600">{equipmentCost.toLocaleString()} €</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Coût total</span>
                  <span className="text-sm font-medium">{totalCost.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Budget</span>
                  <span className="text-xs font-medium">{selectedChantier.budget.toLocaleString()} €</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${
                      costPercentage > 90 ? 'bg-red-500' :
                      costPercentage > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, costPercentage)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {costPercentage.toFixed(1)}% du budget utilisé
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700 flex items-center">
              <Image className="w-5 h-5 mr-2 text-indigo-500" />
              Photos
            </h3>
            <Button 
              size="sm" 
              onClick={() => handleViewPhotos(selectedChantier)}
            >
              Voir toutes les photos
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedChantier.photos.slice(0, 4).map(photo => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border">
                <img 
                  src={photo.url} 
                  alt={photo.description} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
            {selectedChantier.photos.length === 0 && (
              <div className="col-span-4 py-8 text-center text-gray-500">
                Aucune photo disponible
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedChantier)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedChantier.id)}>
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
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Chantiers</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Chantier
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setMapView(!mapView)}
          >
            <Map className="w-4 h-4 mr-2" />
            {mapView ? 'Vue Liste' : 'Vue Carte'}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers Actifs</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.actif}</p>
              <p className="text-xs text-gray-500">sur {chantiers?.length || 0} total</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avancement Moyen</p>
              <p className="text-2xl font-bold text-green-600">{getAverageProgress()}%</p>
              <p className="text-xs text-gray-500">chantiers actifs</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <p className="text-2xl font-bold text-purple-600">{getTotalBudget().toLocaleString()} €</p>
              <p className="text-xs text-gray-500">tous chantiers</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Euro className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers Planifiés</p>
              <p className="text-2xl font-bold text-orange-600">{statusCounts.planifie}</p>
              <p className="text-xs text-gray-500">à démarrer</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un chantier..."
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
                <option value="actif">Actifs</option>
                <option value="planifie">Planifiés</option>
                <option value="termine">Terminés</option>
                <option value="pause">En pause</option>
              </select>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les clients</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.nom}>{client.nom}</option>
                ))}
              </select>
            </div>
          </div>
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
            {mapView ? (
              <div className="p-4">
                <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center">
                  <p className="text-gray-500">Carte des chantiers (non implémentée)</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chantier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSort('date')}
                      >
                        <div className="flex items-center">
                          <span>Dates</span>
                          {sortBy === 'date' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSort('avancement')}
                      >
                        <div className="flex items-center">
                          <span>Avancement</span>
                          {sortBy === 'avancement' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSort('budget')}
                      >
                        <div className="flex items-center">
                          <span>Budget</span>
                          {sortBy === 'budget' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChantiers.map((chantier) => (
                      <tr key={chantier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{chantier.nom}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{chantier.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {chantier.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(chantier.dateDebut).toLocaleDateString()}
                          </div>
                          {chantier.dateFin && (
                            <div className="text-sm text-gray-500">
                              → {new Date(chantier.dateFin).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={chantier.statut} type="chantier" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  chantier.avancement < 30 ? 'bg-red-500' :
                                  chantier.avancement < 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${chantier.avancement}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{chantier.avancement}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {chantier.budget.toLocaleString()} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(chantier)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewPhotos(chantier)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Voir photos"
                            >
                              <Image className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(chantier)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(chantier.id)}
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
                  {filteredChantiers.length === 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                          Aucun chantier trouvé
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChantier(null);
        }}
        title={editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
        size="xl"
      >
        {!loading && <ChantierForm />}
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedChantier(null);
        }}
        title={`Détails - ${selectedChantier?.nom}`}
        size="xl"
      >
        {selectedChantier && <ChantierDetailModal />}
      </Modal>

      <Modal
        isOpen={isPhotosModalOpen}
        onClose={() => {
          setIsPhotosModalOpen(false);
          setSelectedChantier(null);
        }}
        title={`Photos - ${selectedChantier?.nom}`}
        size="xl"
      >
        {selectedChantier && <PhotosManager chantierId={selectedChantier.id} />}
      </Modal>
    </div>
  );
};
