import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Download, Filter, Search, Calendar, CheckCircle, X, User, Building2, Wrench, AlertTriangle, FileText, Check, CalendarRange, Euro } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { saisieHeureService } from '../../services/saisieHeureService';
import { ouvrierService } from '../../services/ouvrierService';
import { chantierService } from '../../services/chantierService';
import { materielService } from '../../services/materielService';
import { SaisieHeure, Ouvrier, Chantier, Materiel, SimpleSaisieHeure } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { ExportModal } from '../Common/ExportModal';
import { PointageDigital } from './PointageDigital';

export const SaisieHeures: React.FC = () => {
  const [showPointageDigital, setShowPointageDigital] = useState(false);
  const { data: saisies, loading: saisiesLoading, error: saisiesError, refresh: refreshSaisies } = useRealtimeSupabase<SaisieHeure>({
    table: 'saisies_heures',
    fetchFunction: saisieHeureService.getAll
  });
  
  const { data: ouvriers, loading: ouvriersLoading } = useRealtimeSupabase<Ouvrier>({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const { data: chantiers, loading: chantiersLoading } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: materiel, loading: materielLoading } = useRealtimeSupabase<Materiel>({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [editingSaisie, setEditingSaisie] = useState<SaisieHeure | null>(null);
  const [selectedSaisies, setSelectedSaisies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ouvrierFilter, setOuvrierFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [validationFilter, setValidationFilter] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [isDateRangeFilterActive, setIsDateRangeFilterActive] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const getOuvrier = (ouvrierId: string): Ouvrier | undefined => {
    if (!ouvriers) return undefined;
    return ouvriers.find(o => o.id === ouvrierId);
  };

  const getChantier = (chantierId: string): Chantier | undefined => {
    if (!chantiers) return undefined;
    return chantiers.find(c => c.id === chantierId);
  };

  const getMateriel = (materielId?: string): Materiel | undefined => {
    if (!materielId) return undefined;
    if (!materiel) return undefined;
    return materiel.find(m => m.id === materielId);
  };

  const filteredSaisies = (saisies || []).filter(saisie => {
    const ouvrier = getOuvrier(saisie.ouvrierId);
    const chantier = getChantier(saisie.chantierId);
    
    const matchesSearch = 
      (ouvrier && `${ouvrier.prenom} ${ouvrier.nom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chantier && chantier.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      saisie.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOuvrier = ouvrierFilter === 'all' || saisie.ouvrierId === ouvrierFilter;
    const matchesChantier = chantierFilter === 'all' || saisie.chantierId === chantierFilter;
    const matchesValidation = validationFilter === 'all' || 
                            (validationFilter === 'valide' && saisie.valide) ||
                            (validationFilter === 'non_valide' && !saisie.valide);
    
    let matchesDate = true;
    if (isDateRangeFilterActive && dateRangeStart && dateRangeEnd) {
      // Filtre par plage de dates personnalisée
      const saisieDate = new Date(saisie.date);
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      // Ajuster endDate pour inclure toute la journée
      endDate.setHours(23, 59, 59, 999);
      
      matchesDate = saisieDate >= startDate && saisieDate <= endDate;
    } else if (dateFilter !== 'all') {
      const today = new Date();
      const saisieDate = new Date(saisie.date);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saisieDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesDate = saisieDate >= startOfWeek;
          break;
        case 'this_month':
          matchesDate = saisieDate.getMonth() === today.getMonth() && saisieDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesOuvrier && matchesChantier && matchesDate && matchesValidation;
  });

  const calculateHours = (heureDebut: string, heureFin: string): number => {
    const [debutHours, debutMinutes] = heureDebut.split(':').map(Number);
    const [finHours, finMinutes] = heureFin.split(':').map(Number);

    const debutMinutesTotal = debutHours * 60 + debutMinutes;
    const finMinutesTotal = finHours * 60 + finMinutes;

    const totalMinutes = finMinutesTotal - debutMinutesTotal;
    return totalMinutes / 60;
  };

  // Calcule les heures nettes en soustrayant l'heure de table
  const calculateNetHours = (heureDebut: string, heureFin: string, heureTable?: string): number => {
    const totalHours = calculateHours(heureDebut, heureFin);
    
    if (!heureTable) return totalHours;
    
    // Convertir l'heure de table en heures décimales
    const [tableHours, tableMinutes] = heureTable.split(':').map(Number);
    const tableDecimal = tableHours + (tableMinutes / 60);
    
    return Math.max(0, totalHours - tableDecimal);
  };

  // Calcul des heures avec pause déjeuner
  const calculateHoursWithLunch = (heureDebut: string, heureFin: string, heureTable?: string): number => {
    let totalHours = calculateHours(heureDebut, heureFin);
    
    // Si une pause déjeuner est spécifiée, la soustraire
    if (heureTable) {
      const [tableHours, tableMinutes] = heureTable.split(':').map(Number);
      const tableHoursDecimal = tableHours + (tableMinutes / 60);
      totalHours -= tableHoursDecimal;
    }
    
    return Math.max(0, totalHours); // Éviter les valeurs négatives
  };

  // Conversion d'une saisie existante vers le format simplifié
  const convertToSimpleSaisie = (saisie: SaisieHeure): SimpleSaisieHeure => {
    const heuresTotal = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);

    return {
      id: saisie.id,
      ouvrierId: saisie.ouvrierId,
      chantierId: saisie.chantierId,
      materielId: saisie.materielId,
      heureTable: saisie.heureTable,
      date: saisie.date,
      heureDebut: saisie.heureDebut,
      heureFin: saisie.heureFin,
      heureTable: saisie.heureTable,
      heuresTotal: heuresTotal,
      description: saisie.description,
      valide: saisie.valide
    };
  };

  const handleEdit = (saisie: SaisieHeure) => {
    // Convertir les données de Supabase au format attendu par le formulaire
    const formattedSaisie: SaisieHeure = {
      id: saisie.id,
      ouvrierId: saisie.ouvrierId,
      chantierId: saisie.chantierId,
      materielId: saisie.materielId,
      date: saisie.date,
      heureDebut: saisie.heureDebut,
      heureFin: saisie.heureFin,
      heureTable: saisie.heureTable,
      heuresNormales: saisie.heuresNormales,
      heuresSupplementaires: saisie.heuresSupplementaires,
      heuresExceptionnelles: saisie.heuresExceptionnelles,
      description: saisie.description,
      valide: saisie.valide
    };
    
    setEditingSaisie(formattedSaisie);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette saisie d\'heures ?')) {
      try {
        await saisieHeureService.delete(id);
        // Refresh data immediately
        refreshSaisies();
        refreshSaisies();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la saisie');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const heureDebut = formData.get('heureDebut') as string;
    const heureFin = formData.get('heureFin') as string;
    const heureTable = formData.get('heureTable') as string;
    const heuresTotal = calculateHoursWithLunch(heureDebut, heureFin, heureTable);
    
    const saisieData: SimpleSaisieHeure = {
      id: editingSaisie?.id || Date.now().toString(),
      ouvrierId: formData.get('ouvrierId') as string,
      chantierId: formData.get('chantierId') as string,
      materielId: formData.get('materielId') as string || undefined,
      heureTable: heureTable || undefined,
      date: formData.get('date') as string,
      heureDebut,
      heureFin,
      heureTable: heureTable || undefined,
      heuresTotal,
      description: formData.get('description') as string,
      valide: editingSaisie?.valide || false
    };

    try {
      if (editingSaisie) {
        const updatedSaisie = await saisieHeureService.update(editingSaisie.id, saisieData);
        console.log('Saisie mise à jour:', updatedSaisie);
      } else {
        const newSaisie = await saisieHeureService.create(saisieData);
        console.log('Nouvelle saisie créée:', newSaisie);
      }
      
      // Refresh data immediately
      refreshSaisies();
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsModalOpen(false);
      setEditingSaisie(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la saisie');
    }
  };

  const handleValidation = async () => {
    if (selectedSaisies.length === 0) {
      alert('Veuillez sélectionner au moins une saisie à valider');
      return;
    }
    
    setIsValidationModalOpen(true);
  };

  const confirmValidation = async () => {
    try {
      await saisieHeureService.validateMany(selectedSaisies);
      // Refresh data immediately
      refreshSaisies();
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsValidationModalOpen(false);
      setSelectedSaisies([]);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation des saisies');
    }
  };

  const toggleSelectSaisie = (id: string) => {
    if (selectedSaisies.includes(id)) {
      setSelectedSaisies(selectedSaisies.filter(s => s !== id));
    } else {
      setSelectedSaisies([...selectedSaisies, id]);
    }
  };

  const selectAllSaisies = () => {
    if (selectedSaisies.length === filteredSaisies.length) {
      setSelectedSaisies([]);
    } else {
      setSelectedSaisies(filteredSaisies.map(s => s.id));
    }
  };

  const getTotalHours = () => {
    return (filteredSaisies || []).reduce((total, saisie) => {
      return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
    }, 0);
  };

  const getTotalCost = () => {
    const totalCost = (filteredSaisies || []).reduce((total, saisie) => {
      const ouvrier = getOuvrier(saisie.ouvrierId);
      if (!ouvrier) return total;
      
      const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      return total + (totalHeures * ouvrier.tauxHoraire);
    }, 0);
    
    return totalCost;
  };
  
  const getValidatedCost = () => {
    return (filteredSaisies || [])
      .filter(saisie => saisie.valide)
      .reduce((total, saisie) => {
        const ouvrier = getOuvrier(saisie.ouvrierId);
        if (!ouvrier) return total;
        
        const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
        return total + (totalHeures * ouvrier.tauxHoraire);
      }, 0);
  };
  
  const getPendingCost = () => {
    return (filteredSaisies || [])
      .filter(saisie => !saisie.valide)
      .reduce((total, saisie) => {
        const ouvrier = getOuvrier(saisie.ouvrierId);
        if (!ouvrier) return total;
        
        const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
        return total + (totalHeures * ouvrier.tauxHoraire);
      }, 0);
  };

  const getValidatedHours = () => {
    return (filteredSaisies || [])
      .filter(saisie => saisie.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
  };

  const getPendingHours = () => {
    return (filteredSaisies || [])
      .filter(saisie => !saisie.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
  };

  const toggleDateRangeFilter = () => {
    setIsDateRangeFilterActive(!isDateRangeFilterActive);
    if (!isDateRangeFilterActive) {
      // Initialiser les dates si elles sont vides
      if (!dateRangeStart) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateRangeStart(firstDayOfMonth.toISOString().split('T')[0]);
      }
      if (!dateRangeEnd) {
        const today = new Date();
        setDateRangeEnd(today.toISOString().split('T')[0]);
      }
      // Désactiver le filtre de date prédéfini
      setDateFilter('all');
    }
  };

  const SaisieForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
            <select
              name="ouvrierId"
              required
              defaultValue={editingSaisie?.ouvrierId || undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="">Sélectionner un ouvrier</option>
              {ouvriers?.sort((a, b) => {
                // Trier d'abord par statut (actif en premier)
                if (a.statut === 'actif' && b.statut !== 'actif') return -1;
                if (a.statut !== 'actif' && b.statut === 'actif') return 1;
                // Puis par nom
                return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
              }).map(ouvrier => (
                <option key={ouvrier.id} value={ouvrier.id}>
                  {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification} 
                  {ouvrier.statut !== 'actif' ? ` (${ouvrier.statut})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              name="chantierId"
              required
              defaultValue={editingSaisie?.chantierId || undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="">Sélectionner un chantier</option>
              {chantiers?.sort((a, b) => {
                // Trier d'abord par statut (actif en premier)
                if (a.statut === 'actif' && b.statut !== 'actif') return -1;
                if (a.statut !== 'actif' && b.statut === 'actif') return 1;
                // Puis par nom
                return a.nom.localeCompare(b.nom);
              }).map(chantier => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom} {chantier.statut !== 'actif' ? ` (${chantier.statut})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Matériel utilisé (optionnel)</label>
          <select
            name="materielId"
            defaultValue={editingSaisie?.materielId || undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          >
            <option value="">Aucun matériel</option>
            {materiel?.sort((a, b) => {
              // Trier d'abord par statut (disponible et en_service en premier)
              const aStatus = a.statut === 'disponible' || a.statut === 'en_service' ? 0 : 1;
              const bStatus = b.statut === 'disponible' || b.statut === 'en_service' ? 0 : 1;
              if (aStatus !== bStatus) return aStatus - bStatus;
              // Puis par nom
              return a.nom.localeCompare(b.nom);
            }).map(materiel => (
              <option key={materiel.id} value={materiel.id}>
                {materiel.nom} - {materiel.marque} {materiel.modele} 
                {materiel.statut !== 'disponible' && materiel.statut !== 'en_service' ? ` (${materiel.statut})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={editingSaisie?.date || (dateRangeStart && isDateRangeFilterActive ? dateRangeStart : new Date().toISOString().split('T')[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
            <input
              name="heureDebut"
              type="time"
              required
              defaultValue={editingSaisie?.heureDebut || '08:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
            <input
              name="heureFin"
              type="time"
              required
              defaultValue={editingSaisie?.heureFin || '17:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pause déjeuner</label>
            <input
              name="heureTable"
              type="time"
              defaultValue={editingSaisie?.heureTable || '01:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Durée de la pause (sera déduite du total)</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description des travaux</label>
          <textarea
            name="description"
            rows={3}
            required
            defaultValue={editingSaisie?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Aperçu du calcul des heures */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Calcul des heures</h4>
          <div className="flex items-center">
            <div className="flex-1">
              <Clock className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-sm text-blue-600">
                Les heures sont calculées automatiquement en fonction des horaires saisis.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                <strong>Formule:</strong> Heures totales = (Heure fin - Heure début) - Pause déjeuner
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
          {editingSaisie ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const ValidationModal = () => {
    const selectedSaisiesData = (saisies || []).filter(s => selectedSaisies.includes(s.id));
    const totalHeures = selectedSaisiesData.reduce((total, s) => 
      total + s.heuresNormales + s.heuresSupplementaires + (s.heuresExceptionnelles || 0), 0);
    const totalCout = selectedSaisiesData.reduce((total, s) => {
      const ouvrier = getOuvrier(s.ouvrierId);
      if (!ouvrier) return total;
      const heures = s.heuresNormales + s.heuresSupplementaires + (s.heuresExceptionnelles || 0);
      return total + (heures * ouvrier.tauxHoraire);
    }, 0);
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Vous êtes sur le point de valider {selectedSaisies.length} saisie(s) d'heures.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Résumé des saisies à valider</h3>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-medium text-gray-900">Total : {totalHeures.toFixed(1)} heures</div>
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <Euro className="w-4 h-4 mr-1 text-green-600" />
                  <span>Coût : {totalCout.toLocaleString()}€</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">{selectedSaisies.length} saisie(s)</span>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedSaisiesData.map(saisie => {
                const ouvrier = getOuvrier(saisie.ouvrierId);
                const chantier = getChantier(saisie.chantierId);
                
                return (
                  <div key={saisie.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {ouvrier?.prenom} {ouvrier?.nom}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ouvrier?.qualification}
                      </div>
                      <div className="text-sm text-gray-600">
                        {chantier?.nom} - {new Date(saisie.date).toLocaleDateString()}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {(saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)).toFixed(1)}h
                        </span>
                        {ouvrier && (
                          <span className="text-green-600 font-medium">
                            {((saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)) * ouvrier.tauxHoraire).toLocaleString()} €
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSaisies(selectedSaisies.filter(id => id !== saisie.id))}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsValidationModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={confirmValidation}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmer la validation
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Saisie des Heures</h1>
        <div className="flex space-x-3">
          <Button 
            variant="secondary"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button 
            onClick={() => setShowPointageDigital(!showPointageDigital)} 
            variant={showPointageDigital ? "success" : "secondary"}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pointage Digital
          </Button>
          <Button onClick={() => setIsModalOpen(true)} disabled={ouvriersLoading || chantiersLoading || materielLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Saisie
          </Button>
          <Button 
            onClick={() => {
              const totalCost = getTotalCost();
              const validatedCost = getValidatedCost();
              const pendingCost = getPendingCost();
              
              alert(`Résumé des coûts:\n\nCoût total: ${totalCost.toLocaleString()}€\nCoût validé: ${validatedCost.toLocaleString()}€\nCoût en attente: ${pendingCost.toLocaleString()}€`);
            }}
            variant="secondary"
          >
            <Euro className="w-4 h-4 mr-2" />
            Résumé Coûts
          </Button>
          <Button onClick={handleValidation} disabled={selectedSaisies.length === 0} variant="success">
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider Sélection
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {showPointageDigital && <PointageDigital />}
      
      {saisiesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      ) : saisiesError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">Erreur lors du chargement des données</p>
          <p className="text-sm text-red-600 mt-1">{saisiesError.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Heures</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalHours().toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <Euro className="w-4 h-4 mr-1 text-blue-500" />
            <span>Coût: <span className="font-medium">{getTotalCost().toLocaleString()} €</span></span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures Validées</p>
              <p className="text-2xl font-bold text-green-600">
                {getValidatedHours().toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <Euro className="w-4 h-4 mr-1 text-green-500" />
            <span>Coût: <span className="font-medium">{getValidatedCost().toLocaleString()} €</span></span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures En Attente</p>
              <p className="text-2xl font-bold text-orange-600">
                {getPendingHours().toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <Euro className="w-4 h-4 mr-1 text-orange-500" />
            <span>Coût: <span className="font-medium">{getPendingCost().toLocaleString()} €</span></span>
          </div>
        </div>
      </div>)}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleDateRangeFilter();
                    setIsFilterExpanded(true);
                  }}
                  className={`px-3 py-2 border rounded-md flex items-center ${
                    isDateRangeFilterActive 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                  title="Filtrer par plage de dates"
                >
                  <CalendarRange className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Plage de dates</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                {isFilterExpanded ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
                <span className="ml-1">{isFilterExpanded ? '▲' : '▼'}</span>
              </button>
              
              {isDateRangeFilterActive && (
                <div className="mt-2 flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date début</label>
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date fin</label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {isFilterExpanded && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ouvrier</label>
                  <select
                    value={ouvrierFilter}
                    onChange={(e) => setOuvrierFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les ouvriers</option>
                    {ouvriers?.sort((a, b) => 
                      `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
                    ).map(ouvrier => (
                      <option key={ouvrier.id} value={ouvrier.id}>
                        {ouvrier.prenom} {ouvrier.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chantier</label>
                  <select
                    value={chantierFilter}
                    onChange={(e) => setChantierFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les chantiers</option>
                    {chantiers?.sort((a, b) => a.nom.localeCompare(b.nom)).map(chantier => (
                      <option key={chantier.id} value={chantier.id}>
                        {chantier.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Période</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isDateRangeFilterActive}
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="this_week">Cette semaine</option>
                    <option value="this_month">Ce mois</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Statut</label>
                  <select
                    value={validationFilter}
                    onChange={(e) => setValidationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="valide">Validées</option>
                    <option value="non_valide">Non validées</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredSaisies.length > 0 && selectedSaisies.length === filteredSaisies.length}
                    onChange={selectAllSaisies}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ouvrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chantier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heures
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matériel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`bg-white divide-y divide-gray-200 ${saisiesLoading ? 'opacity-50' : ''}`}>
              {filteredSaisies.map((saisie) => {
                const ouvrier = getOuvrier(saisie.ouvrierId);
                const chantier = getChantier(saisie.chantierId);
                const materiel = getMateriel(saisie.materielId);
                
                return (
                  <tr key={saisie.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSaisies.includes(saisie.id)}
                        onChange={() => toggleSelectSaisie(saisie.id)}
                        disabled={saisie.valide}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${ouvrier?.statut === 'actif' ? 'bg-blue-500' : 'bg-gray-400'} flex items-center justify-center`}>
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ouvrier?.prenom} {ouvrier?.nom}
                          </div>
                          <div className="text-sm text-gray-500">{ouvrier?.qualification}</div>
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            {ouvrier?.tauxHoraire} €/h
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{chantier?.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{new Date(saisie.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {saisie.heureDebut} - {saisie.heureFin}
                      </div>
                      {saisie.heureTable && (
                        <div className="text-xs text-gray-500">
                          <span className="text-orange-600">Pause: {saisie.heureTable}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const ouvrier = getOuvrier(saisie.ouvrierId);
                          if (!ouvrier) return '';
                          const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
                          const cout = Math.round(totalHeures * ouvrier.tauxHoraire * 100) / 100;
                          return (
                            <span className="flex items-center">
                              <Euro className="w-3 h-3 mr-1 text-green-600" />
                              <span className="font-medium">{cout.toLocaleString()} €</span>
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {(() => {
                            const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
                            return (
                              <div className="flex flex-col">
                                <span>{totalHeures.toFixed(1)}h total</span>
                                {saisie.heureTable && (
                                  <span className="text-xs text-orange-600">
                                    (Pause: {saisie.heureTable})
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {saisie.heureDebut} - {saisie.heureFin}
                          {saisie.heureTable && <span> (pause: {saisie.heureTable})</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {materiel ? (
                        <div className="flex items-center">
                          <Wrench className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{materiel.nom}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(saisie)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!saisie.valide && (
                          <button
                            onClick={() => {
                              setSelectedSaisies([saisie.id]);
                              setIsValidationModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Valider"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(saisie.id)}
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
            {filteredSaisies.length === 0 && !saisiesLoading && (
              <tfoot>
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                    Aucune saisie d'heures trouvée
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSaisie(null);
        }}
        title={editingSaisie ? 'Modifier la saisie' : 'Nouvelle saisie'}
        size="lg"
      >
        <SaisieForm />
      </Modal>

      {/* Modal de validation */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Validation des saisies d'heures et coûts"
        size="md"
      >
        <ValidationModal />
      </Modal>

      {/* Modal d'export */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter les saisies d'heures" 
        data={(filteredSaisies || []).map(saisie => {
          const ouvrier = getOuvrier(saisie.ouvrierId);
          const chantier = getChantier(saisie.chantierId);
          const materiel = getMateriel(saisie.materielId);
          const totalHeures = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
          const cout = ouvrier ? totalHeures * ouvrier.tauxHoraire : 0;
          
          return {
            Date: new Date(saisie.date).toLocaleDateString(),
            Ouvrier: `${ouvrier?.prenom} ${ouvrier?.nom}`,
            Chantier: chantier?.nom || '-',
            'Horaires': `${saisie.heureDebut} - ${saisie.heureFin}${saisie.heureTable ? ` (Pause: ${saisie.heureTable})` : ''}`,
            'Pause déjeuner': saisie.heureTable || '-',
            'Total heures': totalHeures.toFixed(1),
            'Coût': `${cout.toFixed(2)} €`,
            'Matériel': materiel?.nom || '-',
            Description: saisie.description,
            Statut: saisie.valide ? 'Validée' : 'En attente'
          };
        })}
        filename="saisies-heures"
      />
    </div>
  );
};