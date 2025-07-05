import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Download, Filter, Search, Calendar, CheckCircle, X, User, Building2, Wrench, AlertTriangle, FileText, Check } from 'lucide-react';
import { mockSaisiesHeures, mockOuvriers, mockChantiers, mockMateriel } from '../../data/mockData';
import { SaisieHeure, Ouvrier, Chantier, Materiel, SimpleSaisieHeure } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { ExportModal } from '../Common/ExportModal';

export const SaisieHeures: React.FC = () => {
  const [saisies, setSaisies] = useState<SaisieHeure[]>(mockSaisiesHeures);
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

  const filteredSaisies = saisies.filter(saisie => {
    const ouvrier = mockOuvriers.find(o => o.id === saisie.ouvrierId);
    const chantier = mockChantiers.find(c => c.id === saisie.chantierId);
    
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
    if (dateFilter !== 'all') {
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

  const getOuvrier = (ouvrierId: string): Ouvrier | undefined => {
    return mockOuvriers.find(o => o.id === ouvrierId);
  };

  const getChantier = (chantierId: string): Chantier | undefined => {
    return mockChantiers.find(c => c.id === chantierId);
  };

  const getMateriel = (materielId?: string): Materiel | undefined => {
    if (!materielId) return undefined;
    return mockMateriel.find(m => m.id === materielId);
  };

  const calculateHours = (heureDebut: string, heureFin: string): number => {
    const [debutHours, debutMinutes] = heureDebut.split(':').map(Number);
    const [finHours, finMinutes] = heureFin.split(':').map(Number);
    
    const debutMinutesTotal = debutHours * 60 + debutMinutes;
    const finMinutesTotal = finHours * 60 + finMinutes;
    
    const totalMinutes = finMinutesTotal - debutMinutesTotal;
    return totalMinutes / 60;
  };

  // Conversion d'une saisie existante vers le format simplifié
  const convertToSimpleSaisie = (saisie: SaisieHeure): SimpleSaisieHeure => {
    const heuresTotal = saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
    
    return {
      id: saisie.id,
      ouvrierId: saisie.ouvrierId,
      chantierId: saisie.chantierId,
      materielId: saisie.materielId,
      date: saisie.date,
      heureDebut: saisie.heureDebut,
      heureFin: saisie.heureFin,
      heuresTotal: heuresTotal,
      description: saisie.description,
      valide: saisie.valide
    };
  };

  const handleEdit = (saisie: SaisieHeure) => {
    setEditingSaisie(saisie);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette saisie d\'heures ?')) {
      setSaisies(saisies.filter(s => s.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const heureDebut = formData.get('heureDebut') as string;
    const heureFin = formData.get('heureFin') as string;
    const heuresTotal = calculateHours(heureDebut, heureFin);
    
    const saisieData: SimpleSaisieHeure = {
      id: editingSaisie?.id || Date.now().toString(),
      ouvrierId: formData.get('ouvrierId') as string,
      chantierId: formData.get('chantierId') as string,
      materielId: formData.get('materielId') as string || undefined,
      date: formData.get('date') as string,
      heureDebut,
      heureFin,
      heuresTotal,
      description: formData.get('description') as string,
      valide: editingSaisie?.valide || false
    };

    if (editingSaisie) {
      // Convertir les saisies existantes au nouveau format
      setSaisies(saisies.map(s => {
        if (s.id === editingSaisie.id) {
          return {
            ...s,
            ouvrierId: saisieData.ouvrierId,
            chantierId: saisieData.chantierId,
            materielId: saisieData.materielId,
            date: saisieData.date,
            heureDebut: saisieData.heureDebut,
            heureFin: saisieData.heureFin,
            heuresNormales: saisieData.heuresTotal, // Toutes les heures sont maintenant "normales"
            heuresSupplementaires: 0, // Plus d'heures supplémentaires
            heuresExceptionnelles: 0, // Plus d'heures exceptionnelles
            description: saisieData.description,
            valide: saisieData.valide
          };
        }
        return s;
      }));
    } else {
      // Ajouter une nouvelle saisie au format existant pour compatibilité
      setSaisies([...saisies, {
        ...saisieData,
        heuresNormales: saisieData.heuresTotal, // Toutes les heures sont maintenant "normales"
        heuresSupplementaires: 0, // Plus d'heures supplémentaires
        heuresExceptionnelles: 0 // Plus d'heures exceptionnelles
      }]);
    }
    
    setIsModalOpen(false);
    setEditingSaisie(null);
  };

  const handleValidation = () => {
    if (selectedSaisies.length === 0) {
      alert('Veuillez sélectionner au moins une saisie à valider');
      return;
    }
    
    setIsValidationModalOpen(true);
  };

  const confirmValidation = () => {
    setSaisies(saisies.map(saisie => 
      selectedSaisies.includes(saisie.id) 
        ? { ...saisie, valide: true }
        : saisie
    ));
    
    setIsValidationModalOpen(false);
    setSelectedSaisies([]);
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
    return filteredSaisies.reduce((total, saisie) => {
      return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
    }, 0);
  };

  const getValidatedHours = () => {
    return filteredSaisies
      .filter(saisie => saisie.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
  };

  const getPendingHours = () => {
    return filteredSaisies
      .filter(saisie => !saisie.valide)
      .reduce((total, saisie) => {
        return total + saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0);
      }, 0);
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
              defaultValue={editingSaisie?.ouvrierId || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un ouvrier</option>
              {mockOuvriers.map(ouvrier => (
                <option key={ouvrier.id} value={ouvrier.id}>
                  {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              name="chantierId"
              required
              defaultValue={editingSaisie?.chantierId || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un chantier</option>
              {mockChantiers.map(chantier => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Matériel utilisé (optionnel)</label>
          <select
            name="materielId"
            defaultValue={editingSaisie?.materielId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun matériel</option>
            {mockMateriel.map(materiel => (
              <option key={materiel.id} value={materiel.id}>
                {materiel.nom} - {materiel.marque} {materiel.modele}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={editingSaisie?.date || new Date().toISOString().split('T')[0]}
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
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-sm text-blue-600">
              Les heures sont maintenant calculées en heures totales, sans distinction entre heures normales et supplémentaires.
            </p>
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
    const selectedSaisiesData = saisies.filter(s => selectedSaisies.includes(s.id));
    const totalHeures = selectedSaisiesData.reduce((total, s) => 
      total + s.heuresNormales + s.heuresSupplementaires + (s.heuresExceptionnelles || 0), 0);
    
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
              <span className="font-medium text-gray-900">Total : {totalHeures.toFixed(1)} heures</span>
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
                        {chantier?.nom} - {new Date(saisie.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)} heures
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Saisie
          </Button>
          <Button onClick={handleValidation} disabled={selectedSaisies.length === 0} variant="success">
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider Sélection
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Heures</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalHours().toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures Validées</p>
              <p className="text-2xl font-bold text-green-600">{getValidatedHours().toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{getPendingHours().toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <AlertTriangle className="w-6 h-6 text-white" />
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
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={ouvrierFilter}
                onChange={(e) => setOuvrierFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les ouvriers</option>
                {mockOuvriers.map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom}
                  </option>
                ))}
              </select>
              <select
                value={chantierFilter}
                onChange={(e) => setChantierFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les chantiers</option>
                {mockChantiers.map(chantier => (
                  <option key={chantier.id} value={chantier.id}>
                    {chantier.nom}
                  </option>
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
              </select>
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="valide">Validées</option>
                <option value="non_valide">Non validées</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSaisies.length > 0 && selectedSaisies.length === filteredSaisies.length}
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
            <tbody className="bg-white divide-y divide-gray-200">
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
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ouvrier?.prenom} {ouvrier?.nom}
                          </div>
                          <div className="text-sm text-gray-500">{ouvrier?.qualification}</div>
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
                      <div className="text-xs text-gray-500 mt-1">
                        {saisie.heureDebut} - {saisie.heureFin}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {(saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0)).toFixed(1)}h total
                        </div>
                        <div className="text-xs text-gray-500">
                          {saisie.heureDebut} - {saisie.heureFin}
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
        title="Validation des saisies d'heures"
        size="md"
      >
        <ValidationModal />
      </Modal>

      {/* Modal d'export */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter les saisies d'heures"
        data={filteredSaisies.map(saisie => {
          const ouvrier = getOuvrier(saisie.ouvrierId);
          const chantier = getChantier(saisie.chantierId);
          const materiel = getMateriel(saisie.materielId);
          
          return {
            Date: new Date(saisie.date).toLocaleDateString(),
            Ouvrier: `${ouvrier?.prenom} ${ouvrier?.nom}`,
            Chantier: chantier?.nom,
            Matériel: materiel?.nom || '-',
            'Horaires': `${saisie.heureDebut} - ${saisie.heureFin}`,
            'Total heures': saisie.heuresNormales + saisie.heuresSupplementaires + (saisie.heuresExceptionnelles || 0),
            Description: saisie.description,
            Statut: saisie.valide ? 'Validée' : 'En attente'
          };
        })}
        filename="saisies-heures"
      />
    </div>
  );
};