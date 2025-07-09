import React, { useState, useEffect } from 'react';
import { Clock, Plus, Save, Calendar, User, Building, Wrench } from 'lucide-react';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { supabase } from '../../lib/supabase';

interface SaisieHeure {
  id: string;
  ouvrier_id: string;
  chantier_id: string;
  materiel_id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  heures_total: number;
  description: string;
  valide: boolean;
  created_at: string;
  ouvrier?: {
    nom: string;
    prenom: string;
  };
  chantier?: {
    nom: string;
  };
  materiel?: {
    nom: string;
  };
}

interface Ouvrier {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
}

interface Chantier {
  id: string;
  nom: string;
  statut: string;
}

interface Materiel {
  id: string;
  nom: string;
  statut: string;
}

export const SaisieHeures: React.FC = () => {
  const [saisies, setSaisies] = useState<SaisieHeure[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaisie, setEditingSaisie] = useState<SaisieHeure | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    ouvrier_id: '',
    chantier_id: '',
    materiel_id: '',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '08:00',
    heure_fin: '17:00',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load saisies with related data
      const { data: saisiesData } = await supabase
        .from('saisies_heures')
        .select(`
          *,
          ouvrier:ouvriers(nom, prenom),
          chantier:chantiers(nom),
          materiel:materiel(nom)
        `)
        .order('date', { ascending: false });

      // Load ouvriers
      const { data: ouvriersData } = await supabase
        .from('ouvriers')
        .select('id, nom, prenom, statut')
        .eq('statut', 'actif')
        .order('nom');

      // Load chantiers
      const { data: chantiersData } = await supabase
        .from('chantiers')
        .select('id, nom, statut')
        .in('statut', ['actif', 'planifie'])
        .order('nom');

      // Load materiels
      const { data: materielsData } = await supabase
        .from('materiel')
        .select('id, nom, statut')
        .eq('statut', 'disponible')
        .order('nom');

      setSaisies(saisiesData || []);
      setOuvriers(ouvriersData || []);
      setChantiers(chantiersData || []);
      setMateriels(materielsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (debut: string, fin: string): number => {
    const [debutH, debutM] = debut.split(':').map(Number);
    const [finH, finM] = fin.split(':').map(Number);
    
    const debutMinutes = debutH * 60 + debutM;
    const finMinutes = finH * 60 + finM;
    
    return Math.max(0, (finMinutes - debutMinutes) / 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const heures_total = calculateHours(formData.heure_debut, formData.heure_fin);
      
      const saisieData = {
        ...formData,
        materiel_id: formData.materiel_id || null,
        heures_total,
        valide: false,
      };

      if (editingSaisie) {
        await supabase
          .from('saisies_heures')
          .update(saisieData)
          .eq('id', editingSaisie.id);
      } else {
        await supabase
          .from('saisies_heures')
          .insert([saisieData]);
      }

      await loadData();
      setIsModalOpen(false);
      setEditingSaisie(null);
      setFormData({
        ouvrier_id: '',
        chantier_id: '',
        materiel_id: '',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '08:00',
        heure_fin: '17:00',
        description: '',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (saisie: SaisieHeure) => {
    setEditingSaisie(saisie);
    setFormData({
      ouvrier_id: saisie.ouvrier_id,
      chantier_id: saisie.chantier_id,
      materiel_id: saisie.materiel_id || '',
      date: saisie.date,
      heure_debut: saisie.heure_debut,
      heure_fin: saisie.heure_fin,
      description: saisie.description,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette saisie ?')) {
      try {
        await supabase
          .from('saisies_heures')
          .delete()
          .eq('id', id);
        
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const toggleValidation = async (saisie: SaisieHeure) => {
    try {
      await supabase
        .from('saisies_heures')
        .update({ valide: !saisie.valide })
        .eq('id', saisie.id);
      
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saisie des heures</h1>
          <p className="text-gray-600">Gestion des heures de travail</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle saisie
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total heures</p>
              <p className="text-2xl font-bold text-gray-900">
                {saisies.reduce((sum, s) => sum + s.heures_total, 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {saisies
                  .filter(s => s.date === new Date().toISOString().split('T')[0])
                  .reduce((sum, s) => sum + s.heures_total, 0)
                  .toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <User className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Validées</p>
              <p className="text-2xl font-bold text-gray-900">
                {saisies.filter(s => s.valide).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {saisies.filter(s => !s.valide).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saisies list */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Saisies récentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ouvrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chantier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horaires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heures
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
              {saisies.map((saisie) => (
                <tr key={saisie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(saisie.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {saisie.ouvrier?.prenom} {saisie.ouvrier?.nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{saisie.chantier?.nom}</div>
                    {saisie.materiel && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Wrench className="w-3 h-3 mr-1" />
                        {saisie.materiel.nom}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {saisie.heure_debut} - {saisie.heure_fin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {saisie.heures_total.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={saisie.valide ? 'validee' : 'en_attente'}
                      variant={saisie.valide ? 'success' : 'warning'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleValidation(saisie)}
                      className={`${
                        saisie.valide
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {saisie.valide ? 'Invalider' : 'Valider'}
                    </button>
                    <button
                      onClick={() => handleEdit(saisie)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(saisie.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSaisie(null);
          setFormData({
            ouvrier_id: '',
            chantier_id: '',
            materiel_id: '',
            date: new Date().toISOString().split('T')[0],
            heure_debut: '08:00',
            heure_fin: '17:00',
            description: '',
          });
        }}
        title={editingSaisie ? 'Modifier la saisie' : 'Nouvelle saisie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ouvrier *
              </label>
              <select
                value={formData.ouvrier_id}
                onChange={(e) => setFormData({ ...formData, ouvrier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un ouvrier</option>
                {ouvriers.map((ouvrier) => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chantier *
              </label>
              <select
                value={formData.chantier_id}
                onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un chantier</option>
                {chantiers.map((chantier) => (
                  <option key={chantier.id} value={chantier.id}>
                    {chantier.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matériel (optionnel)
              </label>
              <select
                value={formData.materiel_id}
                onChange={(e) => setFormData({ ...formData, materiel_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun matériel</option>
                {materiels.map((materiel) => (
                  <option key={materiel.id} value={materiel.id}>
                    {materiel.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de début *
              </label>
              <input
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de fin *
              </label>
              <input
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Description du travail effectué..."
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Heures calculées:</strong>{' '}
              {calculateHours(formData.heure_debut, formData.heure_fin).toFixed(1)}h
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSaisie(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {editingSaisie ? 'Modifier' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};