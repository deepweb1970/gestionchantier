import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, Calendar, Download, Filter, Search, Eye, Camera, Clock, Users, Wrench, FileText, BarChart3, Map, CheckCircle, AlertTriangle, ArrowUpRight, Pencil, Image } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { clientService } from '../../services/clientService';
import { saisieHeureService } from '../../services/saisieHeureService';
import { planningService } from '../../services/planningService';
import { Chantier, Client, SaisieHeure, PlanningEvent, Photo } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ExportModal } from '../Common/ExportModal';

export const Chantiers: React.FC = () => {
  // Data fetching with realtime updates
  const { data: chantiers, loading: chantiersLoading, error: chantiersError, refresh: refreshChantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: clients, loading: clientsLoading } = useRealtimeSupabase<Client>({
    table: 'clients',
    fetchFunction: clientService.getAll
  });
  
  const { data: saisiesHeures, loading: saisiesLoading } = useRealtimeSupabase<SaisieHeure>({
    table: 'saisies_heures',
    fetchFunction: saisieHeureService.getAll
  });
  
  const { data: planningEvents, loading: planningLoading } = useRealtimeSupabase<PlanningEvent>({
    table: 'planning_events',
    fetchFunction: planningService.getAll
  });
  
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'progress' | 'budget'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'hours' | 'planning'>('info');
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.603354, 1.888334]); // France center
  const [mapZoom, setMapZoom] = useState(5);

  // Filter and sort chantiers
  const filteredChantiers = (chantiers || []).filter(chantier => {
    const matchesSearch = chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chantier.statut === statusFilter;
    const matchesClient = clientFilter === 'all' || chantier.client_id === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        : new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
    } else if (sortBy === 'name') {
      return sortDirection === 'asc'
        ? a.nom.localeCompare(b.nom)
        : b.nom.localeCompare(a.nom);
    } else if (sortBy === 'progress') {
      return sortDirection === 'asc'
        ? a.avancement - b.avancement
        : b.avancement - a.avancement;
    } else if (sortBy === 'budget') {
      return sortDirection === 'asc'
        ? a.budget - b.budget
        : b.budget - a.budget;
    }
    return 0;
  });

  // Helper functions
  const getClient = (clientId?: string): Client | undefined => {
    if (!clientId) return undefined;
    return clients?.find(c => c.id === clientId);
  };

  const getChantierSaisiesHeures = (chantierId: string): SaisieHeure[] => {
    return (saisiesHeures || []).filter(s => s.chantierId === chantierId);
  };

  const getChantierEvents = (chantierId: string): PlanningEvent[] => {
    return (planningEvents || []).filter(e => e.chantierId === chantierId);
  };

  const getTotalHoursForChantier = (chantierId: string): number => {
    const saisies = getChantierSaisiesHeures(chantierId);
    return saisies.reduce((total, saisie) => {
      return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
    }, 0);
  };

  const getValidatedHoursForChantier = (chantierId: string): number => {
    const saisies = getChantierSaisiesHeures(chantierId);
    return saisies
      .filter(s => s.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
  };

  const getPendingHoursForChantier = (chantierId: string): number => {
    const saisies = getChantierSaisiesHeures(chantierId);
    return saisies
      .filter(s => !s.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
  };

  const calculateCostPerHour = (chantierId: string): number => {
    const saisies = getChantierSaisiesHeures(chantierId);
    if (saisies.length === 0) return 0;
    
    const totalHours = getTotalHoursForChantier(chantierId);
    if (totalHours === 0) return 0;
    
    const chantier = chantiers?.find(c => c.id === chantierId);
    if (!chantier) return 0;
    
    return chantier.budget / totalHours;
  };

  const calculateCompletionDate = (chantier: Chantier): string => {
    if (chantier.statut === 'termine') {
      return chantier.dateFin || 'Terminé';
    }
    
    if (chantier.avancement === 0) {
      return 'Non commencé';
    }
    
    // Calculate estimated completion date based on progress and elapsed time
    const startDate = new Date(chantier.dateDebut);
    const today = new Date();
    const elapsedDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const progressPerDay = chantier.avancement / elapsedDays;
    
    if (progressPerDay <= 0) {
      return 'Indéterminé';
    }
    
    const remainingDays = Math.ceil((100 - chantier.avancement) / progressPerDay);
    const estimatedCompletionDate = new Date(today);
    estimatedCompletionDate.setDate(today.getDate() + remainingDays);
    
    return estimatedCompletionDate.toLocaleDateString();
  };

  // CRUD operations
  const handleCreate = () => {
    setEditingChantier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (chantier: Chantier) => {
    setEditingChantier(chantier);
    setIsModalOpen(true);
  };

  const handleViewDetails = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setIsDetailModalOpen(true);
    setActiveTab('info');
  };

  const handleViewMap = () => {
    setIsMapModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chantier ? Cette action est irréversible.')) {
      try {
        await chantierService.delete(id);
        refreshChantiers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du chantier');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
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

      if (editingChantier) {
        await chantierService.update(editingChantier.id, chantierData, clientId);
      } else {
        await chantierService.create(chantierData, clientId);
      }
      
      refreshChantiers();
      setIsModalOpen(false);
      setEditingChantier(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du chantier');
    }
  };

  // Form component
  const ChantierForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chantier</label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={editingChantier?.nom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              name="clientId"
              required
              defaultValue={editingChantier?.client_id || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un client</option>
              {clients?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom} ({client.type})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            required
            defaultValue={editingChantier?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <textarea
            name="adresse"
            rows={2}
            required
            defaultValue={editingChantier?.adresse || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optionnel)</label>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              defaultValue={editingChantier?.coordinates?.lat || ''}
              placeholder="Ex: 48.8566"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optionnel)</label>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              defaultValue={editingChantier?.coordinates?.lng || ''}
              placeholder="Ex: 2.3522"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              name="dateDebut"
              type="date"
              required
              defaultValue={editingChantier?.dateDebut || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
            <input
              name="dateFin"
              type="date"
              defaultValue={editingChantier?.dateFin || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              required
              defaultValue={editingChantier?.statut || 'planifie'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planifie">Planifié</option>
              <option value="actif">Actif</option>
              <option value="pause">En pause</option>
              <option value="termine">Terminé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avancement (%)</label>
            <input
              name="avancement"
              type="number"
              min="0"
              max="100"
              required
              defaultValue={editingChantier?.avancement || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
            <input
              name="budget"
              type="number"
              min="0"
              required
              defaultValue={editingChantier?.budget || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {editingChantier && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Heures travaillées
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Total heures:</p>
                <p className="font-medium text-blue-900">{getTotalHoursForChantier(editingChantier.id).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-blue-700">Heures validées:</p>
                <p className="font-medium text-blue-900">{getValidatedHoursForChantier(editingChantier.id).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-blue-700">Coût horaire moyen:</p>
                <p className="font-medium text-blue-900">{calculateCostPerHour(editingChantier.id).toFixed(2)}€/h</p>
              </div>
            </div>
          </div>
        )}
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

  // Detail modal component
  const ChantierDetailModal = () => {
    if (!selectedChantier) return null;

    const client = getClient(selectedChantier.client_id);
    const totalHours = getTotalHoursForChantier(selectedChantier.id);
    const validatedHours = getValidatedHoursForChantier(selectedChantier.id);
    const pendingHours = getPendingHoursForChantier(selectedChantier.id);
    const costPerHour = calculateCostPerHour(selectedChantier.id);
    const estimatedCompletionDate = calculateCompletionDate(selectedChantier);
    const events = getChantierEvents(selectedChantier.id);

    return (
      <div>
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('info')}
          >
            Informations
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'photos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos ({selectedChantier.photos?.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'hours' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('hours')}
          >
            Heures ({totalHours.toFixed(1)}h)
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'planning' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('planning')}
          >
            Planning ({events.length})
          </button>
        </div>

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedChantier.nom}</h2>
                  <p className="text-gray-600 mt-1">{selectedChantier.description}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <StatusBadge status={selectedChantier.statut} type="chantier" />
                </div>
              </div>
            </div>

            {/* Progress and budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Avancement</h3>
                <div className="flex items-center mb-2">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${
                          selectedChantier.avancement < 25 ? 'bg-red-500' :
                          selectedChantier.avancement < 50 ? 'bg-orange-500' :
                          selectedChantier.avancement < 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${selectedChantier.avancement}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{selectedChantier.avancement}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Date de début</p>
                    <p className="font-medium">{new Date(selectedChantier.dateDebut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de fin estimée</p>
                    <p className="font-medium">{estimatedCompletionDate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Budget et coûts</h3>
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Budget total</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedChantier.budget.toLocaleString()} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Coût horaire</p>
                    <p className="text-xl font-bold text-blue-600">{costPerHour.toFixed(2)} €/h</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Heures travaillées</p>
                    <p className="font-medium">{totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Coût main d'oeuvre estimé</p>
                    <p className="font-medium">{(totalHours * costPerHour).toLocaleString()} €</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client and location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Client</h3>
                {client ? (
                  <div>
                    <p className="font-medium text-gray-900">{client.nom}</p>
                    <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                    <p className="text-sm text-gray-600">{client.telephone}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.type === 'entreprise' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun client associé</p>
                )}
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Localisation</h3>
                <p className="text-gray-900">{selectedChantier.adresse}</p>
                {selectedChantier.coordinates?.lat && selectedChantier.coordinates?.lng ? (
                  <div className="mt-4">
                    <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <Map className="w-8 h-8 text-gray-400" />
                      <span className="ml-2 text-gray-500">Carte disponible</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (selectedChantier.coordinates?.lat && selectedChantier.coordinates?.lng) {
                          setMapCenter([selectedChantier.coordinates.lat, selectedChantier.coordinates.lng]);
                          setMapZoom(15);
                          setIsMapModalOpen(true);
                        }
                      }}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Voir sur la carte
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 text-gray-500 text-sm">
                    Coordonnées GPS non disponibles
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
              <Button variant="danger" onClick={() => {
                handleDelete(selectedChantier.id);
                setIsDetailModalOpen(false);
              }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Photos du chantier</h3>
              <Button size="sm" onClick={() => window.location.href = `/photos?chantier=${selectedChantier.id}`}>
                <Camera className="w-4 h-4 mr-2" />
                Gérer les photos
              </Button>
            </div>

            {selectedChantier.photos && selectedChantier.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedChantier.photos.map((photo: Photo) => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden">
                    <div className="h-48 bg-gray-100 relative">
                      <img 
                        src={photo.url} 
                        alt={photo.description} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <div className="text-sm font-medium truncate">{photo.description}</div>
                        <div className="text-xs">{new Date(photo.date).toLocaleDateString()}</div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          photo.category === 'avancement' ? 'bg-blue-100 text-blue-800' :
                          photo.category === 'probleme' ? 'bg-red-100 text-red-800' :
                          photo.category === 'materiel' ? 'bg-orange-100 text-orange-800' :
                          photo.category === 'securite' ? 'bg-yellow-100 text-yellow-800' :
                          photo.category === 'finition' ? 'bg-green-100 text-green-800' :
                          photo.category === 'avant' ? 'bg-purple-100 text-purple-800' :
                          photo.category === 'apres' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {photo.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune photo pour ce chantier</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => window.location.href = `/photos?chantier=${selectedChantier.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter des photos
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hours tab */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Heures travaillées</h3>
              <Button 
                size="sm" 
                onClick={() => window.location.href = `/heures?chantier=${selectedChantier.id}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle saisie
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Heures</p>
                    <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Heures Validées</p>
                    <p className="text-2xl font-bold text-green-600">{validatedHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Heures En Attente</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {getChantierSaisiesHeures(selectedChantier.id).length > 0 ? (
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ouvrier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heures
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getChantierSaisiesHeures(selectedChantier.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10) // Show only the 10 most recent entries
                      .map(saisie => (
                        <tr key={saisie.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {saisie.ouvrier?.prenom} {saisie.ouvrier?.nom}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(saisie.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)).toFixed(1)}h
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {saisie.valide ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Validée
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {saisie.description}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {getChantierSaisiesHeures(selectedChantier.id).length > 10 && (
                  <div className="p-3 text-center border-t">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => window.location.href = `/heures?chantier=${selectedChantier.id}`}
                    >
                      Voir toutes les saisies
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune saisie d'heures pour ce chantier</p>
              </div>
            )}
          </div>
        )}

        {/* Planning tab */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Planning du chantier</h3>
              <Button 
                size="sm" 
                onClick={() => window.location.href = `/planning?chantier=${selectedChantier.id}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </div>

            {events.length > 0 ? (
              <div className="space-y-4">
                {events
                  .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
                  .map(event => (
                    <div key={event.id} className={`p-4 rounded-lg border ${
                      event.type === 'chantier' ? 'bg-blue-50 border-blue-200' :
                      event.type === 'maintenance' ? 'bg-orange-50 border-orange-200' :
                      event.type === 'conge' ? 'bg-green-50 border-green-200' :
                      'bg-purple-50 border-purple-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.titre}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.type === 'chantier' ? 'bg-blue-100 text-blue-800' :
                          event.type === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                          event.type === 'conge' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="mt-3 text-sm">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                          <span>
                            {new Date(event.dateDebut).toLocaleDateString()} {new Date(event.dateDebut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {' - '}
                            {new Date(event.dateFin).toLocaleDateString()} {new Date(event.dateFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        {event.ouvrierId && (
                          <div className="flex items-center mt-1 text-gray-700">
                            <Users className="w-4 h-4 mr-1 text-gray-500" />
                            <span>Ouvrier assigné</span>
                          </div>
                        )}
                        {event.materielId && (
                          <div className="flex items-center mt-1 text-gray-700">
                            <Wrench className="w-4 h-4 mr-1 text-gray-500" />
                            <span>Matériel assigné</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun événement planifié pour ce chantier</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Map modal component
  const MapModal = () => (
    <div className="space-y-6">
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <Map className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Carte interactive</p>
          <p className="text-sm text-gray-500 mt-2">
            Latitude: {mapCenter[0].toFixed(6)}, Longitude: {mapCenter[1].toFixed(6)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chantiers?.filter(c => c.coordinates?.lat && c.coordinates?.lng).map(chantier => (
          <div 
            key={chantier.id} 
            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              selectedChantier?.id === chantier.id ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => {
              if (chantier.coordinates?.lat && chantier.coordinates?.lng) {
                setMapCenter([chantier.coordinates.lat, chantier.coordinates.lng]);
                setMapZoom(15);
                setSelectedChantier(chantier);
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">{chantier.nom}</div>
                <div className="text-sm text-gray-500">{chantier.adresse}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Chantiers</h1>
        <div className="flex space-x-3">
          <Button onClick={handleViewMap} variant="secondary">
            <MapPin className="w-4 h-4 mr-2" />
            Carte
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Chantier
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
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
          
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="planifie">Planifiés</option>
              <option value="actif">Actifs</option>
              <option value="pause">En pause</option>
              <option value="termine">Terminés</option>
            </select>
            
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les clients</option>
              {clients?.map(client => (
                <option key={client.id} value={client.id}>{client.nom}</option>
              ))}
            </select>
            
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [newSortBy, newSortDirection] = e.target.value.split('-');
                setSortBy(newSortBy as any);
                setSortDirection(newSortDirection as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Date (récent → ancien)</option>
              <option value="date-asc">Date (ancien → récent)</option>
              <option value="name-asc">Nom (A → Z)</option>
              <option value="name-desc">Nom (Z → A)</option>
              <option value="progress-desc">Avancement (élevé → faible)</option>
              <option value="progress-asc">Avancement (faible → élevé)</option>
              <option value="budget-desc">Budget (élevé → faible)</option>
              <option value="budget-asc">Budget (faible → élevé)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chantiers</p>
              <p className="text-2xl font-bold text-gray-900">{chantiers?.length || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers Actifs</p>
              <p className="text-2xl font-bold text-green-600">{chantiers?.filter(c => c.statut === 'actif').length || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {chantiers?.reduce((sum, c) => sum + c.budget, 0).toLocaleString()} €
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures Travaillées</p>
              <p className="text-2xl font-bold text-orange-600">
                {saisiesHeures?.reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires + (s.heuresExceptionnelles || 0), 0).toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Chantiers list */}
      <div className="bg-white rounded-lg shadow-sm border">
        {chantiersLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des chantiers...</p>
          </div>
        ) : chantiersError ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des chantiers</p>
            <p className="text-sm">{chantiersError.message}</p>
          </div>
        ) : (
          <>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avancement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heures
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChantiers.map((chantier) => {
                    const totalHours = getTotalHoursForChantier(chantier.id);
                    
                    return (
                      <tr key={chantier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                chantier.statut === 'actif' ? 'bg-green-500' :
                                chantier.statut === 'termine' ? 'bg-blue-500' :
                                chantier.statut === 'pause' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }`}>
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{chantier.nom}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(chantier.dateDebut).toLocaleDateString()}
                                {chantier.dateFin && ` → ${new Date(chantier.dateFin).toLocaleDateString()}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {chantier.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={chantier.statut} type="chantier" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  chantier.avancement < 25 ? 'bg-red-500' :
                                  chantier.avancement < 50 ? 'bg-orange-500' :
                                  chantier.avancement < 75 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${chantier.avancement}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{chantier.avancement}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {chantier.budget.toLocaleString()} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{totalHours.toFixed(1)}h</span>
                          </div>
                          {totalHours > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {(chantier.budget / totalHours).toFixed(0)}€/h
                            </div>
                          )}
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
                              onClick={() => handleEdit(chantier)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.location.href = `/photos?chantier=${chantier.id}`}
                              className="text-purple-600 hover:text-purple-900"
                              title="Photos"
                            >
                              <Image className="w-4 h-4" />
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
                    );
                  })}
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
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChantier(null);
        }}
        title={editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
        size="xl"
      >
        <ChantierForm />
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedChantier(null);
        }}
        title={selectedChantier?.nom || 'Détails du chantier'}
        size="xl"
      >
        <ChantierDetailModal />
      </Modal>

      <Modal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        title="Carte des chantiers"
        size="xl"
      >
        <MapModal />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter les chantiers"
        data={filteredChantiers.map(chantier => ({
          Nom: chantier.nom,
          Description: chantier.description,
          Client: chantier.client,
          Adresse: chantier.adresse,
          'Date début': new Date(chantier.dateDebut).toLocaleDateString(),
          'Date fin': chantier.dateFin ? new Date(chantier.dateFin).toLocaleDateString() : '',
          Statut: chantier.statut,
          'Avancement (%)': chantier.avancement,
          'Budget (€)': chantier.budget,
          'Heures travaillées': getTotalHoursForChantier(chantier.id).toFixed(1),
          'Coût horaire (€/h)': chantier.budget / Math.max(1, getTotalHoursForChantier(chantier.id))
        }))}
        filename="chantiers"
      />
    </div>
  );
};