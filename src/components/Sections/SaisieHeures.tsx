import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Download, Filter, Search, Calendar, User, Building2, Wrench, Play, Square, Timer, FileText, Eye, AlertTriangle, Euro, Calculator, TrendingUp, Settings } from 'lucide-react';
import { mockSaisiesHeures, mockOuvriers, mockChantiers, mockMateriel } from '../../data/mockData';
import { SaisieHeure, Ouvrier, Chantier, Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ParametresHeuresSup } from './ParametresHeuresSup';

interface ParametresHeuresSupType {
  id: string;
  nom: string;
  description: string;
  seuilHeuresNormales: number;
  tauxMajorationSup: number;
  seuilHeuresExceptionnelles: number;
  tauxMajorationExceptionnelles: number;
  joursTravaillesSemaine: number;
  heuresMaxJour: number;
  heuresMaxSemaine: number;
  actif: boolean;
}

const parametresDefaut: ParametresHeuresSupType = {
  id: '1',
  nom: 'Configuration Standard',
  description: 'Paramètres par défaut selon la convention collective du BTP',
  seuilHeuresNormales: 8.00,
  tauxMajorationSup: 0.00,
  seuilHeuresExceptionnelles: 10.00,
  tauxMajorationExceptionnelles: 0.00,
  joursTravaillesSemaine: 5,
  heuresMaxJour: 10.00,
  heuresMaxSemaine: 48.00,
  actif: true
};

export const SaisieHeures: React.FC = () => {
  const [saisies, setSaisies] = useState<SaisieHeure[]>(mockSaisiesHeures);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isPointageModalOpen, setIsPointageModalOpen] = useState(false);
  const [isParametresModalOpen, setIsParametresModalOpen] = useState(false);
  const [editingSaisie, setEditingSaisie] = useState<SaisieHeure | null>(null);
  const [selectedSaisie, setSelectedSaisie] = useState<SaisieHeure | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [ouvrierFilter, setOuvrierFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [pointageActif, setPointageActif] = useState<{[key: string]: boolean}>({});
  const [heureDebut, setHeureDebut] = useState<{[key: string]: string}>({});
  const [selectedChantierPointage, setSelectedChantierPointage] = useState('');
  const [parametresActuels, setParametresActuels] = useState<ParametresHeuresSupType>(parametresDefaut);

  const filteredSaisies = saisies.filter(saisie => {
    const ouvrier = mockOuvriers.find(o => o.id === saisie.ouvrierId);
    const chantier = mockChantiers.find(c => c.id === saisie.chantierId);
    
    const matchesSearch = ouvrier?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ouvrier?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chantier?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         saisie.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'valide' && saisie.valide) ||
                         (statusFilter === 'non_valide' && !saisie.valide);
    
    const matchesOuvrier = ouvrierFilter === 'all' || saisie.ouvrierId === ouvrierFilter;
    const matchesChantier = chantierFilter === 'all' || saisie.chantierId === chantierFilter;
    
    let matchesDate = true;
    if (dateFilter === 'custom' && dateDebut && dateFin) {
      matchesDate = saisie.date >= dateDebut && saisie.date <= dateFin;
    } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const today = new Date();
      const saisieDate = new Date(saisie.date);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saisieDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
          matchesDate = saisieDate >= weekStart;
          break;
        case 'this_month':
          matchesDate = saisieDate.getMonth() === today.getMonth() && saisieDate.getFullYear() === today.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
          matchesDate = saisieDate.getMonth() === lastMonth.getMonth() && saisieDate.getFullYear() === lastMonth.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesOuvrier && matchesChantier && matchesDate;
  });

  const getOuvrier = (id: string): Ouvrier | undefined => {
    return mockOuvriers.find(o => o.id === id);
  };

  const getChantier = (id: string): Chantier | undefined => {
    return mockChantiers.find(c => c.id === id);
  };

  const getMateriel = (id: string): Materiel | undefined => {
    return mockMateriel.find(m => m.id === id);
  };

  const calculateHeuresAvecParametres = (debut: string, fin: string, parametres: ParametresHeuresSupType) => {
    const [heureDebut, minuteDebut] = debut.split(':').map(Number);
    const [heureFin, minuteFin] = fin.split(':').map(Number);
    
    const totalMinutes = (heureFin * 60 + minuteFin) - (heureDebut * 60 + minuteDebut);
    const totalHeures = totalMinutes / 60;
    
    let heuresNormales = 0;
    let heuresSupplementaires = 0;
    let heuresExceptionnelles = 0;

    if (totalHeures <= parametres.seuilHeuresNormales) {
      heuresNormales = totalHeures;
    } else if (totalHeures <= parametres.seuilHeuresExceptionnelles) {
      heuresNormales = parametres.seuilHeuresNormales;
      heuresSupplementaires = totalHeures - parametres.seuilHeuresNormales;
    } else {
      heuresNormales = parametres.seuilHeuresNormales;
      heuresSupplementaires = parametres.seuilHeuresExceptionnelles - parametres.seuilHeuresNormales;
      heuresExceptionnelles = totalHeures - parametres.seuilHeuresExceptionnelles;
    }
    
    return { heuresNormales, heuresSupplementaires, heuresExceptionnelles, totalHeures };
  };

  const calculateCostAvecParametres = (saisie: SaisieHeure, parametres: ParametresHeuresSupType): number => {
    const ouvrier = getOuvrier(saisie.ouvrierId);
    if (!ouvrier) return 0;
    
    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
      saisie.heureDebut, 
      saisie.heureFin, 
      parametres
    );
    
    const coutNormal = heuresNormales * ouvrier.tauxHoraire;
    const coutSupplementaire = heuresSupplementaires * ouvrier.tauxHoraire * (1 + parametres.tauxMajorationSup / 100);
    const coutExceptionnel = heuresExceptionnelles * ouvrier.tauxHoraire * (1 + parametres.tauxMajorationExceptionnelles / 100);
    
    return coutNormal + coutSupplementaire + coutExceptionnel;
  };

  const startPointage = (ouvrierId: string) => {
    if (!selectedChantierPointage) {
      alert('Veuillez sélectionner un chantier');
      return;
    }

    const now = new Date();
    const heureActuelle = now.toTimeString().slice(0, 5);
    const key = `${ouvrierId}-${selectedChantierPointage}`;
    
    setPointageActif({ ...pointageActif, [key]: true });
    setHeureDebut({ ...heureDebut, [key]: heureActuelle });
  };

  const stopPointage = (ouvrierId: string) => {
    if (!selectedChantierPointage) return;

    const now = new Date();
    const heureFin = now.toTimeString().slice(0, 5);
    const key = `${ouvrierId}-${selectedChantierPointage}`;
    const debut = heureDebut[key];
    
    if (debut) {
      const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
        debut, 
        heureFin, 
        parametresActuels
      );
      
      const nouvelleSaisie: SaisieHeure = {
        id: Date.now().toString(),
        ouvrierId,
        chantierId: selectedChantierPointage,
        date: now.toISOString().split('T')[0],
        heureDebut: debut,
        heureFin,
        heuresNormales,
        heuresSupplementaires,
        description: 'Pointage automatique',
        valide: false
      };
      
      setSaisies([...saisies, nouvelleSaisie]);
      setPointageActif({ ...pointageActif, [key]: false });
      setHeureDebut({ ...heureDebut, [key]: '' });
    }
  };

  const handleEdit = (saisie: SaisieHeure) => {
    setEditingSaisie(saisie);
    setIsModalOpen(true);
  };

  const handleViewDetails = (saisie: SaisieHeure) => {
    setSelectedSaisie(saisie);
    setIsDetailModalOpen(true);
  };

  const handleValidation = (saisie: SaisieHeure) => {
    setSelectedSaisie(saisie);
    setIsValidationModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette saisie ?')) {
      setSaisies(saisies.filter(s => s.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const debut = formData.get('heureDebut') as string;
    const fin = formData.get('heureFin') as string;
    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
      debut, 
      fin, 
      parametresActuels
    );
    
    const saisieData: SaisieHeure = {
      id: editingSaisie?.id || Date.now().toString(),
      ouvrierId: formData.get('ouvrierId') as string,
      chantierId: formData.get('chantierId') as string,
      materielId: formData.get('materielId') as string || undefined,
      date: formData.get('date') as string,
      heureDebut: debut,
      heureFin: fin,
      heuresNormales,
      heuresSupplementaires,
      description: formData.get('description') as string,
      valide: editingSaisie?.valide || false
    };

    if (editingSaisie) {
      setSaisies(saisies.map(s => s.id === editingSaisie.id ? saisieData : s));
    } else {
      setSaisies([...saisies, saisieData]);
    }
    
    setIsModalOpen(false);
    setEditingSaisie(null);
  };

  const validateSaisie = (valide: boolean) => {
    if (!selectedSaisie) return;
    
    setSaisies(saisies.map(s => 
      s.id === selectedSaisie.id 
        ? { ...s, valide }
        : s
    ));
    setIsValidationModalOpen(false);
    setSelectedSaisie(null);
  };

  const getStatistics = () => {
    const totalHeures = filteredSaisies.reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const heuresValidees = filteredSaisies.filter(s => s.valide).reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const heuresEnAttente = filteredSaisies.filter(s => !s.valide).reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const heuresSupplementaires = filteredSaisies.reduce((sum, s) => sum + s.heuresSupplementaires, 0);
    const coutTotal = filteredSaisies.reduce((sum, s) => sum + calculateCostAvecParametres(s, parametresActuels), 0);
    const coutValide = filteredSaisies.filter(s => s.valide).reduce((sum, s) => sum + calculateCostAvecParametres(s, parametresActuels), 0);
    
    return { totalHeures, heuresValidees, heuresEnAttente, heuresSupplementaires, coutTotal, coutValide };
  };

  const exportPaie = () => {
    const saisiesValidees = filteredSaisies.filter(s => s.valide);
    const dataByOuvrier = mockOuvriers.map(ouvrier => {
      const saisiesOuvrier = saisiesValidees.filter(s => s.ouvrierId === ouvrier.id);
      const totalNormales = saisiesOuvrier.reduce((sum, s) => sum + s.heuresNormales, 0);
      const totalSupplementaires = saisiesOuvrier.reduce((sum, s) => sum + s.heuresSupplementaires, 0);
      
      const salaireBase = totalNormales * ouvrier.tauxHoraire;
      const salaireSupplementaire = totalSupplementaires * ouvrier.tauxHoraire * (1 + parametresActuels.tauxMajorationSup / 100);
      
      return {
        ouvrier: `${ouvrier.prenom} ${ouvrier.nom}`,
        heuresNormales: totalNormales,
        heuresSupplementaires: totalSupplementaires,
        tauxHoraire: ouvrier.tauxHoraire,
        salaireBase,
        salaireSupplementaire,
        salaireTotal: salaireBase + salaireSupplementaire
      };
    }).filter(data => data.heuresNormales > 0 || data.heuresSupplementaires > 0);
    
    console.log('Export paie:', dataByOuvrier);
    
    // Génération CSV
    const csvContent = [
      'Ouvrier,Heures Normales,Heures Supplémentaires,Taux Horaire,Salaire Base,Salaire Supplémentaire,Salaire Total',
      ...dataByOuvrier.map(data => 
        `${data.ouvrier},${data.heuresNormales},${data.heuresSupplementaires},${data.tauxHoraire},${data.salaireBase.toFixed(2)},${data.salaireSupplementaire.toFixed(2)},${data.salaireTotal.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-paie-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                  {ouvrier.prenom} {ouvrier.nom} - {ouvrier.tauxHoraire}€/h
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
                  {chantier.nom} - {chantier.client}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Matériel (optionnel)</label>
          <select
            name="materielId"
            defaultValue={editingSaisie?.materielId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun matériel</option>
            {mockMateriel.map(materiel => (
              <option key={materiel.id} value={materiel.id}>
                {materiel.nom} - {materiel.marque}
              </option>
            ))}
          </select>
        </div>
        
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
            <input
              name="heureDebut"
              type="time"
              required
              defaultValue={editingSaisie?.heureDebut || '08:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description des tâches</label>
          <textarea
            name="description"
            rows={3}
            required
            defaultValue={editingSaisie?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Aperçu du calcul avec les paramètres actuels */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Calcul avec paramètres actuels: {parametresActuels.nom}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Seuil heures normales:</p>
              <p className="font-medium text-blue-900">{parametresActuels.seuilHeuresNormales}h</p>
            </div>
            <div>
              <p className="text-blue-700">Majoration heures sup:</p>
              <p className="font-medium text-blue-900">+{parametresActuels.tauxMajorationSup}%</p>
            </div>
            <div>
              <p className="text-blue-700">Majoration exceptionnelles:</p>
              <p className="font-medium text-blue-900">+{parametresActuels.tauxMajorationExceptionnelles}%</p>
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

  const PointageModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Pointage Digital</h3>
        <p className="text-gray-600">Sélectionnez un chantier et gérez le pointage des ouvriers</p>
      </div>

      {/* Sélection du chantier */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-800 mb-2">
          Chantier de travail
        </label>
        <select
          value={selectedChantierPointage}
          onChange={(e) => setSelectedChantierPointage(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Sélectionner un chantier</option>
          {mockChantiers.filter(c => c.statut === 'actif').map(chantier => (
            <option key={chantier.id} value={chantier.id}>
              {chantier.nom} - {chantier.client}
            </option>
          ))}
        </select>
        {selectedChantierPointage && (
          <div className="mt-2 text-sm text-blue-700">
            <Building2 className="w-4 h-4 inline mr-1" />
            Chantier sélectionné: {mockChantiers.find(c => c.id === selectedChantierPointage)?.nom}
          </div>
        )}
      </div>

      {!selectedChantierPointage && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Veuillez sélectionner un chantier pour commencer le pointage</p>
        </div>
      )}

      {selectedChantierPointage && (
        <div className="space-y-4">
          {mockOuvriers.filter(o => o.statut === 'actif').map(ouvrier => {
            const key = `${ouvrier.id}-${selectedChantierPointage}`;
            const isActive = pointageActif[key];
            
            return (
              <div key={ouvrier.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{ouvrier.prenom} {ouvrier.nom}</h4>
                      <p className="text-sm text-gray-600">{ouvrier.qualification}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Euro className="w-3 h-3 mr-1" />
                        <span>{ouvrier.tauxHoraire}€/h</span>
                      </div>
                      {isActive && heureDebut[key] && (
                        <p className="text-xs text-green-600 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Débuté à {heureDebut[key]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isActive ? (
                      <button
                        onClick={() => startPointage(ouvrier.id)}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Débuter
                      </button>
                    ) : (
                      <button
                        onClick={() => stopPointage(ouvrier.id)}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const DetailModal = () => {
    if (!selectedSaisie) return null;

    const ouvrier = getOuvrier(selectedSaisie.ouvrierId);
    const chantier = getChantier(selectedSaisie.chantierId);
    const materiel = selectedSaisie.materielId ? getMateriel(selectedSaisie.materielId) : null;
    const cost = calculateCostAvecParametres(selectedSaisie, parametresActuels);
    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
      selectedSaisie.heureDebut, 
      selectedSaisie.heureFin, 
      parametresActuels
    );

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Détails de la saisie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{new Date(selectedSaisie.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <div className="mt-1">
                {selectedSaisie.valide ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Validé
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    En attente
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horaires</p>
              <p className="font-medium">{selectedSaisie.heureDebut} - {selectedSaisie.heureFin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total heures</p>
              <p className="font-medium">{(heuresNormales + heuresSupplementaires + heuresExceptionnelles).toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ouvrier</h3>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{ouvrier?.prenom} {ouvrier?.nom}</h4>
                <p className="text-sm text-gray-600">{ouvrier?.qualification}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Euro className="w-4 h-4 mr-1" />
                  <span>Taux: {ouvrier?.tauxHoraire}€/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Chantier</h3>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{chantier?.nom}</h4>
                <p className="text-sm text-gray-600">{chantier?.client}</p>
                <p className="text-sm text-gray-600">{chantier?.adresse}</p>
              </div>
            </div>
          </div>
        </div>

        {materiel && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Matériel utilisé</h3>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{materiel.nom}</h4>
                  <p className="text-sm text-gray-600">{materiel.marque} {materiel.modele}</p>
                  {materiel.tarifHoraire && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Euro className="w-4 h-4 mr-1" />
                      <span>Tarif: {materiel.tarifHoraire}€/h</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Description des tâches</h3>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-900">{selectedSaisie.description}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Calcul des heures et coûts</h3>
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{heuresNormales.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Heures normales</p>
                <p className="text-xs text-gray-500">{ouvrier?.tauxHoraire}€/h</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{heuresSupplementaires.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Heures supplémentaires</p>
                <p className="text-xs text-gray-500">{ouvrier ? (ouvrier.tauxHoraire * (1 + parametresActuels.tauxMajorationSup / 100)).toFixed(2) : 0}€/h (+{parametresActuels.tauxMajorationSup}%)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{heuresExceptionnelles.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Heures exceptionnelles</p>
                <p className="text-xs text-gray-500">{ouvrier ? (ouvrier.tauxHoraire * (1 + parametresActuels.tauxMajorationExceptionnelles / 100)).toFixed(2) : 0}€/h (+{parametresActuels.tauxMajorationExceptionnelles}%)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{cost.toFixed(2)}€</p>
                <p className="text-sm text-gray-600">Coût total</p>
                <div className="text-xs text-gray-500 mt-1">
                  <p>Config: {parametresActuels.nom}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ValidationModal = () => {
    if (!selectedSaisie) return null;

    const ouvrier = getOuvrier(selectedSaisie.ouvrierId);
    const chantier = getChantier(selectedSaisie.chantierId);
    const cost = calculateCostAvecParametres(selectedSaisie, parametresActuels);
    const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
      selectedSaisie.heureDebut, 
      selectedSaisie.heureFin, 
      parametresActuels
    );

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Validation de la saisie d'heures
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Détails de la saisie</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-600">Ouvrier:</span> {ouvrier?.prenom} {ouvrier?.nom}</p>
            <p><span className="text-gray-600">Chantier:</span> {chantier?.nom}</p>
            <p><span className="text-gray-600">Date:</span> {new Date(selectedSaisie.date).toLocaleDateString()}</p>
            <p><span className="text-gray-600">Horaires:</span> {selectedSaisie.heureDebut} - {selectedSaisie.heureFin}</p>
            <p><span className="text-gray-600">Heures normales:</span> {heuresNormales.toFixed(1)}h</p>
            <p><span className="text-gray-600">Heures supplémentaires:</span> {heuresSupplementaires.toFixed(1)}h</p>
            {heuresExceptionnelles > 0 && (
              <p><span className="text-gray-600">Heures exceptionnelles:</span> {heuresExceptionnelles.toFixed(1)}h</p>
            )}
            <p><span className="text-gray-600">Coût total:</span> <span className="font-medium text-green-600">{cost.toFixed(2)}€</span></p>
            <p><span className="text-gray-600">Description:</span> {selectedSaisie.description}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsValidationModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => validateSaisie(false)}>
            <XCircle className="w-4 h-4 mr-2" />
            Rejeter
          </Button>
          <Button onClick={() => validateSaisie(true)}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider
          </Button>
        </div>
      </div>
    );
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Saisie des Heures</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsParametresModalOpen(true)} variant="secondary">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={() => setIsPointageModalOpen(true)} variant="success">
            <Timer className="w-4 h-4 mr-2" />
            Pointage Digital
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Saisie
          </Button>
          <Button variant="secondary" onClick={exportPaie}>
            <Download className="w-4 h-4 mr-2" />
            Export Paie
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Heures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHeures.toFixed(1)}h</p>
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
              <p className="text-2xl font-bold text-green-600">{stats.heuresValidees.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.heuresEnAttente.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures Sup.</p>
              <p className="text-2xl font-bold text-purple-600">{stats.heuresSupplementaires.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Timer className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coût Total</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.coutTotal.toLocaleString()}€</p>
              <p className="text-xs text-gray-500">{stats.coutValide.toLocaleString()}€ validé</p>
            </div>
            <div className="p-3 rounded-full bg-indigo-500">
              <Euro className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
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
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="valide">Validées</option>
                <option value="non_valide">En attente</option>
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
                <option value="last_month">Mois dernier</option>
                <option value="custom">Période personnalisée</option>
              </select>
              {dateFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Date début"
                  />
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Date fin"
                  />
                </>
              )}
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
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Horaires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heures
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux / Coût
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
                const materiel = saisie.materielId ? getMateriel(saisie.materielId) : null;
                const cost = calculateCostAvecParametres(saisie, parametresActuels);
                const { heuresNormales, heuresSupplementaires, heuresExceptionnelles } = calculateHeuresAvecParametres(
                  saisie.heureDebut, 
                  saisie.heureFin, 
                  parametresActuels
                );
                
                return (
                  <tr key={saisie.id} className="hover:bg-gray-50">
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
                      <div className="text-sm text-gray-900">{chantier?.nom}</div>
                      <div className="text-sm text-gray-500">{chantier?.client}</div>
                      {materiel && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Wrench className="w-3 h-3 mr-1" />
                          {materiel.nom}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(saisie.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {saisie.heureDebut} - {saisie.heureFin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{heuresNormales.toFixed(1)}h</span> normales
                      </div>
                      {heuresSupplementaires > 0 && (
                        <div className="text-sm text-orange-600">
                          <span className="font-medium">+{heuresSupplementaires.toFixed(1)}h</span> sup.
                        </div>
                      )}
                      {heuresExceptionnelles > 0 && (
                        <div className="text-sm text-red-600">
                          <span className="font-medium">+{heuresExceptionnelles.toFixed(1)}h</span> except.
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">{ouvrier?.tauxHoraire}€/h</span>
                          <span className="text-gray-500 text-xs ml-1">taux</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-green-600">{cost.toFixed(2)}€</span>
                          <span className="text-gray-500 text-xs ml-1">coût</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {saisie.valide ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validé
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
                          onClick={() => handleViewDetails(saisie)}
                          className="text-green-600 hover:text-green-900"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!saisie.valide && (
                          <button
                            onClick={() => handleValidation(saisie)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Valider"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(saisie)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
        title={editingSaisie ? 'Modifier la saisie' : 'Nouvelle saisie d\'heures'}
        size="lg"
      >
        <SaisieForm />
      </Modal>

      {/* Modal de pointage */}
      <Modal
        isOpen={isPointageModalOpen}
        onClose={() => {
          setIsPointageModalOpen(false);
          setSelectedChantierPointage('');
        }}
        title="Pointage Digital"
        size="xl"
      >
        <PointageModal />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSaisie(null);
        }}
        title="Détails de la saisie"
        size="xl"
      >
        <DetailModal />
      </Modal>

      {/* Modal de validation */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedSaisie(null);
        }}
        title="Validation de la saisie"
        size="md"
      >
        <ValidationModal />
      </Modal>

      {/* Modal de paramètres */}
      <Modal
        isOpen={isParametresModalOpen}
        onClose={() => {
          setIsParametresModalOpen(false);
        }}
        title="Paramètres des Heures Supplémentaires"
        size="xl"
      >
        <ParametresHeuresSup />
      </Modal>
    </div>
  );
};