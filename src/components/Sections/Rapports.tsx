import React, { useState } from 'react';
import { Plus, Edit, Trash2, BarChart3, Download, Filter, Search, Calendar, TrendingUp, TrendingDown, DollarSign, Clock, Users, Building2, Wrench, FileText, Eye, Settings, PieChart, Activity, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { mockChantiers, mockOuvriers, mockMateriel, mockSaisiesHeures, mockFactures, mockClients } from '../../data/mockData';
import { Rapport, RapportType } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';

export const Rapports: React.FC = () => {
  const [rapports, setRapports] = useState<Rapport[]>([
    {
      id: '1',
      nom: 'Rapport Mensuel Janvier 2024',
      type: 'performance',
      dateDebut: '2024-01-01',
      dateFin: '2024-01-31',
      parametres: {
        chantiers: ['1', '2'],
        ouvriers: ['1', '2'],
        materiel: ['1']
      },
      dateCreation: '2024-02-01',
      creePar: 'Admin'
    },
    {
      id: '2',
      nom: 'Analyse Coûts Q1 2024',
      type: 'couts',
      dateDebut: '2024-01-01',
      dateFin: '2024-03-31',
      parametres: {
        chantiers: ['1', '2', '3']
      },
      dateCreation: '2024-04-01',
      creePar: 'Manager'
    }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [editingRapport, setEditingRapport] = useState<Rapport | null>(null);
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedChantiers, setSelectedChantiers] = useState<string[]>([]);
  const [selectedOuvriers, setSelectedOuvriers] = useState<string[]>([]);
  const [selectedMateriel, setSelectedMateriel] = useState<string[]>([]);

  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = rapport.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rapport.creePar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || rapport.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (rapport: Rapport) => {
    setEditingRapport(rapport);
    setDateDebut(rapport.dateDebut);
    setDateFin(rapport.dateFin);
    setSelectedChantiers(rapport.parametres.chantiers || []);
    setSelectedOuvriers(rapport.parametres.ouvriers || []);
    setSelectedMateriel(rapport.parametres.materiel || []);
    setIsModalOpen(true);
  };

  const handleViewDetails = (rapport: Rapport) => {
    setSelectedRapport(rapport);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      setRapports(rapports.filter(r => r.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const rapportData: Rapport = {
      id: editingRapport?.id || Date.now().toString(),
      nom: formData.get('nom') as string,
      type: formData.get('type') as RapportType,
      dateDebut,
      dateFin,
      parametres: {
        chantiers: selectedChantiers,
        ouvriers: selectedOuvriers,
        materiel: selectedMateriel
      },
      dateCreation: editingRapport?.dateCreation || new Date().toISOString().split('T')[0],
      creePar: editingRapport?.creePar || 'Admin'
    };

    if (editingRapport) {
      setRapports(rapports.map(r => r.id === editingRapport.id ? rapportData : r));
    } else {
      setRapports([...rapports, rapportData]);
    }
    
    setIsModalOpen(false);
    setEditingRapport(null);
    resetForm();
  };

  const resetForm = () => {
    setDateDebut('');
    setDateFin('');
    setSelectedChantiers([]);
    setSelectedOuvriers([]);
    setSelectedMateriel([]);
  };

  const generateRapport = () => {
    if (!dateDebut || !dateFin) {
      alert('Veuillez sélectionner une période');
      return;
    }

    const data = analyzeData(dateDebut, dateFin, selectedChantiers, selectedOuvriers, selectedMateriel);
    console.log('Données du rapport:', data);
    // Ici on pourrait générer un PDF ou Excel
  };

  const analyzeData = (debut: string, fin: string, chantiers: string[], ouvriers: string[], materiel: string[]) => {
    // Filtrer les données selon les critères
    const saisiesFiltrees = mockSaisiesHeures.filter(saisie => {
      const dateOk = saisie.date >= debut && saisie.date <= fin;
      const chantierOk = chantiers.length === 0 || chantiers.includes(saisie.chantierId);
      const ouvrierOk = ouvriers.length === 0 || ouvriers.includes(saisie.ouvrierId);
      const materielOk = materiel.length === 0 || !saisie.materielId || materiel.includes(saisie.materielId);
      return dateOk && chantierOk && ouvrierOk && materielOk;
    });

    const facturesFiltrees = mockFactures.filter(facture => {
      const dateOk = facture.dateEmission >= debut && facture.dateEmission <= fin;
      const chantierOk = chantiers.length === 0 || chantiers.includes(facture.chantierId);
      return dateOk && chantierOk;
    });

    // Calculs
    const totalHeures = saisiesFiltrees.reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const heuresValidees = saisiesFiltrees.filter(s => s.valide).reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const chiffreAffaires = facturesFiltrees.reduce((sum, f) => sum + f.montantTTC, 0);
    const facturespayees = facturesFiltrees.filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montantTTC, 0);

    // Coûts de main d'œuvre
    const coutMainOeuvre = saisiesFiltrees.reduce((sum, saisie) => {
      const ouvrier = mockOuvriers.find(o => o.id === saisie.ouvrierId);
      if (!ouvrier) return sum;
      return sum + (saisie.heuresNormales * ouvrier.tauxHoraire) + 
                   (saisie.heuresSupplementaires * ouvrier.tauxHoraire * 1.25);
    }, 0);

    return {
      periode: { debut, fin },
      heures: { total: totalHeures, validees: heuresValidees },
      finances: { chiffreAffaires, facturespayees, coutMainOeuvre },
      rentabilite: chiffreAffaires > 0 ? ((chiffreAffaires - coutMainOeuvre) / chiffreAffaires * 100) : 0,
      saisies: saisiesFiltrees,
      factures: facturesFiltrees
    };
  };

  const getGlobalStats = () => {
    const totalChantiers = mockChantiers.length;
    const chantiersActifs = mockChantiers.filter(c => c.statut === 'actif').length;
    const totalOuvriers = mockOuvriers.length;
    const ouvriersActifs = mockOuvriers.filter(o => o.statut === 'actif').length;
    const totalMateriel = mockMateriel.length;
    const materielDisponible = mockMateriel.filter(m => m.statut === 'disponible').length;
    
    const chiffreAffairesTotal = mockFactures.reduce((sum, f) => sum + f.montantTTC, 0);
    const facturesPayees = mockFactures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montantTTC, 0);
    const facturesEnAttente = mockFactures.filter(f => f.statut === 'envoyee').reduce((sum, f) => sum + f.montantTTC, 0);
    
    const totalHeures = mockSaisiesHeures.reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
    const heuresValidees = mockSaisiesHeures.filter(s => s.valide).reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);

    return {
      chantiers: { total: totalChantiers, actifs: chantiersActifs },
      ouvriers: { total: totalOuvriers, actifs: ouvriersActifs },
      materiel: { total: totalMateriel, disponible: materielDisponible },
      finances: { total: chiffreAffairesTotal, payees: facturesPayees, enAttente: facturesEnAttente },
      heures: { total: totalHeures, validees: heuresValidees }
    };
  };

  const getPerformanceIndicators = () => {
    const stats = getGlobalStats();
    
    const tauxOccupationOuvriers = (stats.ouvriers.actifs / stats.ouvriers.total) * 100;
    const tauxValidationHeures = stats.heures.total > 0 ? (stats.heures.validees / stats.heures.total) * 100 : 0;
    const tauxPaiementFactures = stats.finances.total > 0 ? (stats.finances.payees / stats.finances.total) * 100 : 0;
    const tauxUtilisationMateriel = (materiel || []).length > 0 
      ? (materiel || []).reduce((sum, m) => sum + (m.utilizationRate || 0), 0) / (materiel || []).length 
      : 0;

    return {
      tauxOccupationOuvriers,
      tauxValidationHeures,
      tauxPaiementFactures,
      tauxUtilisationMateriel
    };
  };

  const RapportForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du rapport</label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={editingRapport?.nom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
            <select
              name="type"
              defaultValue={editingRapport?.type || 'performance'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance">Performance</option>
              <option value="couts">Analyse des coûts</option>
              <option value="activite">Rapport d'activité</option>
              <option value="financier">Rapport financier</option>
              <option value="ressources">Utilisation des ressources</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chantiers à inclure</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedChantiers.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChantiers([]);
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">Tous les chantiers</span>
            </label>
            {mockChantiers.map(chantier => (
              <label key={chantier.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedChantiers.includes(chantier.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChantiers([...selectedChantiers, chantier.id]);
                    } else {
                      setSelectedChantiers(selectedChantiers.filter(id => id !== chantier.id));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{chantier.nom}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ouvriers à inclure</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedOuvriers.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOuvriers([]);
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">Tous les ouvriers</span>
            </label>
            {mockOuvriers.map(ouvrier => (
              <label key={ouvrier.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedOuvriers.includes(ouvrier.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOuvriers([...selectedOuvriers, ouvrier.id]);
                    } else {
                      setSelectedOuvriers(selectedOuvriers.filter(id => id !== ouvrier.id));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{ouvrier.prenom} {ouvrier.nom}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Matériel à inclure</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedMateriel.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMateriel([]);
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">Tout le matériel</span>
            </label>
            {mockMateriel.map(materiel => (
              <label key={materiel.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMateriel.includes(materiel.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMateriel([...selectedMateriel, materiel.id]);
                    } else {
                      setSelectedMateriel(selectedMateriel.filter(id => id !== materiel.id));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{materiel.nom}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="button" onClick={generateRapport} variant="success">
          <BarChart3 className="w-4 h-4 mr-2" />
          Générer Aperçu
        </Button>
        <Button type="submit">
          {editingRapport ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const RapportDetailModal = () => {
    if (!selectedRapport) return null;

    const data = analyzeData(
      selectedRapport.dateDebut,
      selectedRapport.dateFin,
      selectedRapport.parametres.chantiers || [],
      selectedRapport.parametres.ouvriers || [],
      selectedRapport.parametres.materiel || []
    );

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations du rapport</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{selectedRapport.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Période</p>
              <p className="font-medium">
                {new Date(selectedRapport.dateDebut).toLocaleDateString()} - {new Date(selectedRapport.dateFin).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Créé par</p>
              <p className="font-medium">{selectedRapport.creePar}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de création</p>
              <p className="font-medium">{new Date(selectedRapport.dateCreation).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Heures</p>
                <p className="text-2xl font-bold text-blue-600">{data.heures.total.toFixed(1)}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-green-600">{data.finances.chiffreAffaires.toLocaleString()}€</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coût M.O.</p>
                <p className="text-2xl font-bold text-orange-600">{data.finances.coutMainOeuvre.toLocaleString()}€</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rentabilité</p>
                <p className="text-2xl font-bold text-purple-600">{data.rentabilite.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Détail par chantier */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Détail par chantier</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Chantier</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Heures</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Coût M.O.</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Facturation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockChantiers
                  .filter(c => selectedRapport.parametres.chantiers?.length === 0 || selectedRapport.parametres.chantiers?.includes(c.id))
                  .map(chantier => {
                    const saisiesChantier = data.saisies.filter(s => s.chantierId === chantier.id);
                    const heuresChantier = saisiesChantier.reduce((sum, s) => sum + s.heuresNormales + s.heuresSupplementaires, 0);
                    const coutChantier = saisiesChantier.reduce((sum, saisie) => {
                      const ouvrier = mockOuvriers.find(o => o.id === saisie.ouvrierId);
                      if (!ouvrier) return sum;
                      return sum + (saisie.heuresNormales * ouvrier.tauxHoraire) + 
                                   (saisie.heuresSupplementaires * ouvrier.tauxHoraire * 1.25);
                    }, 0);
                    const facturesChantier = data.factures.filter(f => f.chantierId === chantier.id);
                    const facturationChantier = facturesChantier.reduce((sum, f) => sum + f.montantTTC, 0);

                    return (
                      <tr key={chantier.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{chantier.nom}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{heuresChantier.toFixed(1)}h</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{coutChantier.toLocaleString()}€</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{facturationChantier.toLocaleString()}€</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Détail par ouvrier */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Détail par ouvrier</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ouvrier</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Heures Normales</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Heures Sup.</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Coût Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockOuvriers
                  .filter(o => selectedRapport.parametres.ouvriers?.length === 0 || selectedRapport.parametres.ouvriers?.includes(o.id))
                  .map(ouvrier => {
                    const saisiesOuvrier = data.saisies.filter(s => s.ouvrierId === ouvrier.id);
                    const heuresNormales = saisiesOuvrier.reduce((sum, s) => sum + s.heuresNormales, 0);
                    const heuresSupplementaires = saisiesOuvrier.reduce((sum, s) => sum + s.heuresSupplementaires, 0);
                    const coutTotal = (heuresNormales * ouvrier.tauxHoraire) + (heuresSupplementaires * ouvrier.tauxHoraire * 1.25);

                    return (
                      <tr key={ouvrier.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{ouvrier.prenom} {ouvrier.nom}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{heuresNormales.toFixed(1)}h</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{heuresSupplementaires.toFixed(1)}h</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{coutTotal.toFixed(2)}€</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
    );
  };

  const DashboardPersonnalisable = () => {
    const stats = getGlobalStats();
    const indicators = getPerformanceIndicators();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Tableau de Bord Personnalisable</h3>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Personnaliser
          </Button>
        </div>

        {/* Indicateurs clés */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Chantiers Actifs</p>
                <p className="text-3xl font-bold">{stats.chantiers.actifs}</p>
                <p className="text-sm text-blue-100">sur {stats.chantiers.total} total</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Ouvriers Actifs</p>
                <p className="text-3xl font-bold">{stats.ouvriers.actifs}</p>
                <p className="text-sm text-green-100">{indicators.tauxOccupationOuvriers.toFixed(1)}% occupation</p>
              </div>
              <Users className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">CA Total</p>
                <p className="text-3xl font-bold">{(stats.finances.total / 1000).toFixed(0)}k€</p>
                <p className="text-sm text-purple-100">{indicators.tauxPaiementFactures.toFixed(1)}% payé</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Matériel</p>
                <p className="text-3xl font-bold">{stats.materiel.total}</p>
                <p className="text-sm text-orange-100">{indicators.tauxUtilisationMateriel.toFixed(1)}% utilisé</p>
              </div>
              <Wrench className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Graphiques de performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Indicateurs de Performance</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Validation des heures</span>
                  <span className="text-sm font-medium">{indicators.tauxValidationHeures.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${indicators.tauxValidationHeures}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Paiement des factures</span>
                  <span className="text-sm font-medium">{indicators.tauxPaiementFactures.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${indicators.tauxPaiementFactures}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Utilisation matériel</span>
                  <span className="text-sm font-medium">{indicators.tauxUtilisationMateriel.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${indicators.tauxUtilisationMateriel}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Occupation ouvriers</span>
                  <span className="text-sm font-medium">{indicators.tauxOccupationOuvriers.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${indicators.tauxOccupationOuvriers}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Alertes et Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Maintenance requise</p>
                  <p className="text-sm text-yellow-700">3 équipements nécessitent une maintenance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Factures en retard</p>
                  <p className="text-sm text-red-700">2 factures dépassent l'échéance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Objectif atteint</p>
                  <p className="text-sm text-blue-700">Chiffre d'affaires mensuel dépassé</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Activité Récente</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Facture FAC-2024-001 payée</p>
                <p className="text-sm text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Heures validées pour Jean Dubois</p>
                <p className="text-sm text-gray-500">Il y a 4 heures</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nouveau chantier "Villa Moderne" créé</p>
                <p className="text-sm text-gray-500">Hier</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Rapports et Analyses</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsDashboardModalOpen(true)} variant="success">
            <PieChart className="w-4 h-4 mr-2" />
            Tableau de Bord
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Rapport
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Global
          </Button>
        </div>
      </div>

      {/* Aperçu des indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(() => {
          const stats = getGlobalStats();
          const indicators = getPerformanceIndicators();
          
          return (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance Globale</p>
                    <p className="text-2xl font-bold text-blue-600">{indicators.tauxValidationHeures.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Validation heures</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rentabilité</p>
                    <p className="text-2xl font-bold text-green-600">{indicators.tauxPaiementFactures.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Factures payées</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisation Ressources</p>
                    <p className="text-2xl font-bold text-orange-600">{indicators.tauxUtilisationMateriel.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Matériel utilisé</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Productivité</p>
                    <p className="text-2xl font-bold text-purple-600">{indicators.tauxOccupationOuvriers.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Ouvriers actifs</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un rapport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="performance">Performance</option>
                <option value="couts">Analyse des coûts</option>
                <option value="activite">Rapport d'activité</option>
                <option value="financier">Rapport financier</option>
                <option value="ressources">Utilisation des ressources</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rapport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRapports.map((rapport) => (
                <tr key={rapport.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{rapport.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rapport.type === 'performance' ? 'bg-blue-100 text-blue-800' :
                      rapport.type === 'couts' ? 'bg-orange-100 text-orange-800' :
                      rapport.type === 'activite' ? 'bg-green-100 text-green-800' :
                      rapport.type === 'financier' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rapport.type === 'performance' ? 'Performance' :
                       rapport.type === 'couts' ? 'Coûts' :
                       rapport.type === 'activite' ? 'Activité' :
                       rapport.type === 'financier' ? 'Financier' :
                       'Ressources'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(rapport.dateDebut).toLocaleDateString()} - {new Date(rapport.dateFin).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rapport.creePar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rapport.dateCreation).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(rapport)}
                        className="text-green-600 hover:text-green-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(rapport)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900" title="Télécharger">
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rapport.id)}
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

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRapport(null);
          resetForm();
        }}
        title={editingRapport ? 'Modifier le rapport' : 'Nouveau rapport'}
        size="xl"
      >
        <RapportForm />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRapport(null);
        }}
        title={`Rapport - ${selectedRapport?.nom}`}
        size="xl"
      >
        <RapportDetailModal />
      </Modal>

      {/* Modal tableau de bord */}
      <Modal
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
        title="Tableau de Bord Personnalisable"
        size="xl"
      >
        <DashboardPersonnalisable />
      </Modal>
    </div>
  );
};