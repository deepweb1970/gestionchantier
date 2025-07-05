import React, { useState } from 'react';
import { Plus, Edit, Trash2, Wrench, Calendar, Download, Euro, Clock, TrendingUp, Calculator } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { materielService } from '../../services/materielService';
import { Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const MaterielSection: React.FC = () => {
  const { data: materiel, loading, error, refresh } = useSupabase<Materiel>({
    table: 'materiel',
    orderBy: { column: 'nom' }
  });
  
  const { data: chantiers } = useSupabase({
    table: 'chantiers',
    columns: 'id, nom, client_id',
    orderBy: { column: 'nom' }
  });
  
  const { data: saisiesHeures } = useSupabase({
    table: 'saisies_heures',
    columns: 'id, materiel_id, heures_total, ouvrier_id',
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMateriel = (materiel || []).filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marque.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour calculer les heures d'utilisation d'un matériel
  const getMaterielUsageHours = (materielId: string) => {
    if (!saisiesHeures) return 0;
    const saisiesMateriel = saisiesHeures.filter(saisie => saisie.materiel_id === materielId);
    return saisiesMateriel.reduce((sum, saisie) => sum + (saisie.heures_total || 0), 0);
  };

  // Fonction pour calculer le revenu généré par un matériel
  const getMaterielRevenue = (item: Materiel) => {
    const usageHours = getMaterielUsageHours(item.id);
    return item.tarifHoraire ? usageHours * item.tarifHoraire : 0;
  };

  // Fonction pour calculer le taux d'utilisation
  const getMaterielUtilizationRate = (materielId: string) => {
    const usageHours = getMaterielUsageHours(materielId);
    const totalDays = 30; // Période de 30 jours
    const maxHoursPerDay = 8;
    const maxPossibleHours = totalDays * maxHoursPerDay;
    return maxPossibleHours > 0 ? (usageHours / maxPossibleHours) * 100 : 0;
  };

  const handleEdit = async (item: Materiel) => {
    setEditingMateriel(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      try {
        await materielService.delete(id);
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du matériel');
      }
    }
  };

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
        await materielService.update(editingMateriel.id, materielData);
      } else {
        await materielService.create(materielData);
      }
      refresh();
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du matériel</label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={editingMateriel?.nom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input
              name="type"
              type="text"
              required
              defaultValue={editingMateriel?.type || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <input
              name="marque"
              type="text"
              required
              defaultValue={editingMateriel?.marque || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
            <input
              name="modele"
              type="text"
              required
              defaultValue={editingMateriel?.modele || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
            <input
              name="numeroSerie"
              type="text"
              required
              defaultValue={editingMateriel?.numeroSerie || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
            <input
              name="dateAchat"
              type="date"
              required
              defaultValue={editingMateriel?.dateAchat || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur d'achat (€)</label>
            <input
              name="valeur"
              type="number"
              min="0"
              required
              defaultValue={editingMateriel?.valeur || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarif horaire (€/h)
              <span className="text-xs text-gray-500 block">Pour facturation</span>
            </label>
            <div className="relative">
              <input
                name="tarifHoraire"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingMateriel?.tarifHoraire || ''}
                placeholder="0.00"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="disponible">Disponible</option>
              <option value="en_service">En service</option>
              <option value="maintenance">Maintenance</option>
              <option value="hors_service">Hors service</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prochaine maintenance</label>
            <input
              name="prochaineMaintenance"
              type="date"
              defaultValue={editingMateriel?.prochaineMaintenance || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
              <span className="text-xs text-gray-500 block">Chantier où se trouve le matériel</span>
            </label>
            <select
              name="localisation"
              defaultValue={editingMateriel?.localisation || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p className="text-xs text-gray-500 mt-1">
              {chantiers?.length || 0} chantier(s) disponible(s)
            </p>
          </div>
        </div>

        {/* Aperçu de rentabilité */}
        {editingMateriel?.tarifHoraire && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

        {/* Aperçu de la localisation sélectionnée */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Informations de localisation</h4>
          <div id="localisation-preview" className="text-sm text-gray-600">
            <p>Sélectionnez une localisation pour voir les détails</p>
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
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Rechercher du matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisation
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
                              <div className="text-sm font-medium text-gray-900">{item.nom}</div>
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
                          {item.localisation && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
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
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
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
    </div>
  );
};