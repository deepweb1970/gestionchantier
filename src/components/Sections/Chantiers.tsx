import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, Calendar, Download, Filter, Search, Eye, Camera, Clock, Users, Wrench, FileText, ChevronDown, ChevronUp, Map, Percent, DollarSign, CheckCircle, XCircle, AlertTriangle, Image } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { clientService } from '../../services/clientService';
import { saisieHeureService } from '../../services/saisieHeureService';
import { planningService } from '../../services/planningService';
import { Chantier, Client, SaisieHeure, PlanningEvent } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ExportModal } from '../Common/ExportModal';

export const Chantiers: React.FC = () => {
  // Data fetching with realtime updates
  const { data: chantiers, loading, error, refresh } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: clients } = useRealtimeSupabase<Client>({
    table: 'clients',
    fetchFunction: clientService.getAll
  });
  
  const { data: saisiesHeures } = useRealtimeSupabase<SaisieHeure>({
    table: 'saisies_heures',
    fetchFunction: saisieHeureService.getAll
  });

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortField, setSortField] = useState<'nom' | 'dateDebut' | 'budget' | 'avancement'>('dateDebut');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'heures' | 'planning'>('info');
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>([]);

  // Fetch planning events for selected chantier
  useEffect(() => {
    if (selectedChantier && activeTab === 'planning') {
      const fetchPlanningEvents = async () => {
        try {
          const events = await planningService.getByChantier(selectedChantier.id);
          setPlanningEvents(events);
        } catch (error) {
          console.error('Erreur lors de la récupération des événements du planning:', error);
        }
      };
      
      fetchPlanningEvents();
    }
  }, [selectedChantier, activeTab]);

  // Filter and sort chantiers
  const filteredChantiers = (chantiers || []).filter(chantier => {
    const matchesSearch = chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chantier.statut === statusFilter;
    const matchesClient = clientFilter === 'all' || chantier.client === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  }).sort((a, b) => {
    if (sortField === 'nom') {
      return sortDirection === 'asc' 
        ? a.nom.localeCompare(b.nom) 
        : b.nom.localeCompare(a.nom);
    } else if (sortField === 'dateDebut') {
      return sortDirection === 'asc' 
        ? new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime() 
        : new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
    } else if (sortField === 'budget') {
      return sortDirection === 'asc' 
        ? a.budget - b.budget 
        : b.budget - a.budget;
    } else if (sortField === 'avancement') {
      return sortDirection === 'asc' 
        ? a.avancement - b.avancement 
        : b.avancement - a.avancement;
    }
    return 0;
  });

  // Calculate total hours for a chantier
  const getChantierHeures = (chantierId: string): number => {
    if (!saisiesHeures) return 0;
    return saisiesHeures
      .filter(saisie => saisie.chantierId === chantierId)
      .reduce((total, saisie) => 
        total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0), 
      0);
  };

  // CRUD operations
  const handleEdit = (chantier: Chantier) => {
    setEditingChantier(chantier);
    setIsModalOpen(true);
  };

  const handleViewDetails = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setIsDetailModalOpen(true);
    setActiveTab('info');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chantier ? Cette action est irréversible.')) {
      try {
        await chantierService.delete(id);
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du chantier');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const clientId = formData.get('clientId') as string;
      const selectedClient = clients?.find(c => c.id === clientId);
      
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
      
      refresh();
      setIsModalOpen(false);
      setEditingChantier(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du chantier');
    }
  };

  // Sort handlers
  const handleSort = (field: 'nom' | 'dateDebut' | 'budget' | 'avancement') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Map initialization
  useEffect(() => {
    if (mapVisible && selectedChantier?.coordinates && mapRef.current) {
      // This is a placeholder for map initialization
      // In a real implementation, you would use a library like Leaflet or Google Maps
      const mapContainer = mapRef.current;
      mapContainer.innerHTML = `
        <div class="bg-blue-100 p-4 rounded-lg text-center">
          <p class="text-blue-800 font-medium">Carte interactive</p>
          <p class="text-blue-600">Latitude: ${selectedChantier.coordinates.lat}</p>
          <p class="text-blue-600">Longitude: ${selectedChantier.coordinates.lng}</p>
          <p class="text-sm text-blue-500 mt-2">Adresse: ${selectedChantier.adresse}</p>
        </div>
      `;
    }
  }, [mapVisible, selectedChantier]);

  // Form component
  const ChantierForm = () => {
    const [selectedClientId, setSelectedClientId] = useState<string>(
      editingChantier?.client_id || ''
    );

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave(new FormData(e.currentTarget));
      }} className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Construction Villa Moderne"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                name="clientId"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description détaillée du chantier..."
            />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
            Localisation
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
            <textarea
              name="adresse"
              rows={2}
              required
              defaultValue={editingChantier?.adresse || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numéro, rue, code postal, ville"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optionnel)</label>
              <input
                name="latitude"
                type="number"
                step="0.000001"
                defaultValue={editingChantier?.coordinates?.lat || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 48.8566"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optionnel)</label>
              <input
                name="longitude"
                type="number"
                step="0.000001"
                defaultValue={editingChantier?.coordinates?.lng || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 2.3522"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-600" />
            Dates et statut
          </h3>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avancement (%)
              </label>
              <div className="flex items-center">
                <input
                  name="avancement"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  defaultValue={editingChantier?.avancement || 0}
                  className="w-full mr-3"
                  id="avancementRange"
                />
                <output htmlFor="avancementRange" id="avancementOutput" className="w-12 text-center font-medium">
                  {editingChantier?.avancement || 0}%
                </output>
              </div>
              <script dangerouslySetInnerHTML={{
                __html: `
                  document.getElementById('avancementRange').addEventListener('input', function() {
                    document.getElementById('avancementOutput').textContent = this.value + '%';
                  });
                `
              }} />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
            Budget
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget total (€)</label>
            <input
              name="budget"
              type="number"
              min="0"
              step="1000"
              required
              defaultValue={editingChantier?.budget || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 150000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Budget total estimé pour l'ensemble du chantier
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingChantier ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    );
  };

  // Detail modal component
  const ChantierDetailModal = () => {
    if (!selectedChantier) return null;

    const totalHeures = getChantierHeures(selectedChantier.id);
    const client = clients?.find(c => c.id === selectedChantier.client_id);
    
    return (
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'info' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Informations
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'photos' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'heures' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('heures')}
          >
            Heures
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'planning' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('planning')}
          >
            Planning
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedChantier.nom}</h2>
                  <p className="text-gray-600 mt-1">{selectedChantier.description}</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedChantier.statut} type="chantier" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedChantier.budget.toLocaleString()} €
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <div className="w-full max-w-[150px] bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedChantier.avancement}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {selectedChantier.avancement}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Client
              </h3>
              <div className="bg-white border rounded-lg p-4">
                {client ? (
                  <>
                    <h4 className="font-medium text-gray-900">{client.nom}</h4>
                    <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                    <p className="text-sm text-gray-600">{client.telephone}</p>
                    <p className="text-sm text-gray-600 mt-1">{client.adresse}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Contact principal: {client.contactPrincipal}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Client non trouvé</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Localisation
              </h3>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-gray-900">{selectedChantier.adresse}</p>
                
                {selectedChantier.coordinates && (
                  <div className="mt-3">
                    <button
                      onClick={() => setMapVisible(!mapVisible)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      {mapVisible ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Masquer la carte
                        </>
                      ) : (
                        <>
                          <Map className="w-4 h-4 mr-1" />
                          Afficher la carte
                        </>
                      )}
                    </button>
                    
                    {mapVisible && (
                      <div 
                        ref={mapRef} 
                        className="mt-3 h-[200px] bg-gray-100 rounded-lg border"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Dates
              </h3>
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date de début</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedChantier.dateDebut).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de fin</p>
                    <p className="font-medium text-gray-900">
                      {selectedChantier.dateFin 
                        ? new Date(selectedChantier.dateFin).toLocaleDateString() 
                        : 'Non définie'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const start = new Date(selectedChantier.dateDebut);
                      const end = selectedChantier.dateFin 
                        ? new Date(selectedChantier.dateFin) 
                        : new Date();
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 30) {
                        return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                      } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        const remainingDays = diffDays % 30;
                        return `${months} mois${remainingDays > 0 ? ` et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}` : ''}`;
                      } else {
                        const years = Math.floor(diffDays / 365);
                        const remainingMonths = Math.floor((diffDays % 365) / 30);
                        return `${years} an${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` et ${remainingMonths} mois` : ''}`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Percent className="w-5 h-5 mr-2 text-orange-600" />
                Statistiques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Heures travaillées</p>
                      <p className="text-xl font-bold text-blue-600">{totalHeures.toFixed(1)}h</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Coût main d'œuvre</p>
                      <p className="text-xl font-bold text-green-600">
                        {(() => {
                          if (!saisiesHeures) return '0 €';
                          
                          const coutTotal = saisiesHeures
                            .filter(saisie => saisie.chantierId === selectedChantier.id)
                            .reduce((total, saisie) => {
                              // Simplified calculation - in a real app you would use the ouvrier's hourly rate
                              const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
                              return total + (totalHeures * 25); // Assuming average rate of 25€/h
                            }, 0);
                          
                          return `${coutTotal.toLocaleString()} €`;
                        })()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rentabilité estimée</p>
                      <p className="text-xl font-bold text-purple-600">
                        {(() => {
                          if (!saisiesHeures) return '0%';
                          
                          const coutTotal = saisiesHeures
                            .filter(saisie => saisie.chantierId === selectedChantier.id)
                            .reduce((total, saisie) => {
                              const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
                              return total + (totalHeures * 25);
                            }, 0);
                          
                          if (selectedChantier.budget === 0) return 'N/A';
                          
                          const rentabilite = ((selectedChantier.budget - coutTotal) / selectedChantier.budget) * 100;
                          return `${rentabilite.toFixed(1)}%`;
                        })()}
                      </p>
                    </div>
                    <Percent className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Photos du chantier</h3>
              <Button size="sm" onClick={() => window.location.href = '#/photos'}>
                <Camera className="w-4 h-4 mr-2" />
                Gérer les photos
              </Button>
            </div>
            
            {selectedChantier.photos && selectedChantier.photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedChantier.photos.map(photo => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.description} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900">{photo.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(photo.date).toLocaleDateString()}
                      </p>
                      {photo.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {photo.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune photo pour ce chantier</p>
                <Button size="sm" className="mt-4" onClick={() => window.location.href = '#/photos'}>
                  <Camera className="w-4 h-4 mr-2" />
                  Ajouter des photos
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'heures' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Heures travaillées</h3>
              <Button size="sm" onClick={() => window.location.href = '#/heures'}>
                <Clock className="w-4 h-4 mr-2" />
                Gérer les heures
              </Button>
            </div>
            
            {saisiesHeures && saisiesHeures.filter(s => s.chantierId === selectedChantier.id).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ouvrier
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heures
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {saisiesHeures
                      .filter(s => s.chantierId === selectedChantier.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(saisie => (
                        <tr key={saisie.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {new Date(saisie.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {/* In a real app, you would fetch the ouvrier's name */}
                            Ouvrier ID: {saisie.ouvrierId}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {(saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)).toFixed(1)}h
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {saisie.description}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
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
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune heure enregistrée pour ce chantier</p>
                <Button size="sm" className="mt-4" onClick={() => window.location.href = '#/heures'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter des heures
                </Button>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Résumé des heures</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Total heures</p>
                  <p className="text-xl font-bold text-blue-600">{totalHeures.toFixed(1)}h</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Heures validées</p>
                  <p className="text-xl font-bold text-green-600">
                    {saisiesHeures
                      ?.filter(s => s.chantierId === selectedChantier.id && s.valide)
                      .reduce((total, s) => total + s.heuresNormales + s.heuresSupplementaires + (s.heuresExceptionnelles || 0), 0)
                      .toFixed(1)}h
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Coût estimé</p>
                  <p className="text-xl font-bold text-orange-600">
                    {(totalHeures * 25).toLocaleString()} €
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Planning du chantier</h3>
              <Button size="sm" onClick={() => window.location.href = '#/planning'}>
                <Calendar className="w-4 h-4 mr-2" />
                Gérer le planning
              </Button>
            </div>
            
            {planningEvents.length > 0 ? (
              <div className="space-y-3">
                {planningEvents.map(event => (
                  <div key={event.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.titre}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            {new Date(event.dateDebut).toLocaleDateString()} {new Date(event.dateDebut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {' - '}
                            {new Date(event.dateFin).toLocaleDateString()} {new Date(event.dateFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.type === 'chantier' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                        event.type === 'conge' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {event.type === 'chantier' ? 'Chantier' :
                         event.type === 'maintenance' ? 'Maintenance' :
                         event.type === 'conge' ? 'Congé' :
                         'Formation'}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-2">
                      {event.ouvrierId && (
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 text-blue-500 mr-1" />
                          <span>Ouvrier assigné</span>
                        </div>
                      )}
                      {event.materielId && (
                        <div className="flex items-center text-sm">
                          <Wrench className="w-4 h-4 text-orange-500 mr-1" />
                          <span>Matériel requis</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun événement planifié pour ce chantier</p>
                <Button size="sm" className="mt-4" onClick={() => window.location.href = '#/planning'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Planifier un événement
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Chantiers</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Chantier
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
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
              <p className="text-2xl font-bold text-green-600">
                {chantiers?.filter(c => c.statut === 'actif').length || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers en Retard</p>
              <p className="text-2xl font-bold text-red-600">
                {(() => {
                  if (!chantiers) return 0;
                  
                  return chantiers.filter(c => {
                    if (c.statut !== 'actif' || !c.dateFin) return false;
                    return new Date(c.dateFin) < new Date();
                  }).length;
                })()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {chantiers
                  ? (chantiers.reduce((sum, c) => sum + c.budget, 0) / 1000).toFixed(0) + 'k€'
                  : '0€'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
                  <option key={client.id} value={client.nom}>{client.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chantiers list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des chantiers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des chantiers</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('nom')}
                  >
                    <div className="flex items-center">
                      Chantier
                      {sortField === 'nom' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('dateDebut')}
                  >
                    <div className="flex items-center">
                      Dates
                      {sortField === 'dateDebut' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('budget')}
                  >
                    <div className="flex items-center">
                      Budget
                      {sortField === 'budget' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('avancement')}
                  >
                    <div className="flex items-center">
                      Avancement
                      {sortField === 'avancement' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
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
                  const totalHeures = getChantierHeures(chantier.id);
                  const isLate = chantier.statut === 'actif' && chantier.dateFin && new Date(chantier.dateFin) < new Date();
                  
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
                            <div className="text-sm text-gray-500 truncate max-w-xs">{chantier.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chantier.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={chantier.statut} type="chantier" />
                        {isLate && (
                          <div className="flex items-center mt-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            <span>En retard</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(chantier.dateDebut).toLocaleDateString()}
                        </div>
                        {chantier.dateFin && (
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span>→</span>
                            <span className="ml-1">{new Date(chantier.dateFin).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {chantier.budget.toLocaleString()} €
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                            <div 
                              className={`h-2.5 rounded-full ${
                                chantier.avancement < 30 ? 'bg-red-600' :
                                chantier.avancement < 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${chantier.avancement}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{chantier.avancement}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-blue-500" />
                          <span>{totalHeures.toFixed(1)}h</span>
                        </div>
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
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                      Aucun chantier trouvé
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
          setMapVisible(false);
        }}
        title={`Détails du chantier - ${selectedChantier?.nom}`}
        size="xl"
      >
        <ChantierDetailModal />
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
          'Date fin': chantier.dateFin ? new Date(chantier.dateFin).toLocaleDateString() : 'Non définie',
          Statut: chantier.statut,
          Avancement: `${chantier.avancement}%`,
          Budget: `${chantier.budget.toLocaleString()} €`,
          'Heures travaillées': `${getChantierHeures(chantier.id).toFixed(1)}h`
        }))}
        filename="chantiers"
      />
    </div>
  );
};