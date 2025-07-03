import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Phone, Mail, Download } from 'lucide-react';
import { mockOuvriers } from '../../data/mockData';
import { Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const Ouvriers: React.FC = () => {
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>(mockOuvriers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOuvrier, setEditingOuvrier] = useState<Ouvrier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOuvriers = ouvriers.filter(ouvrier =>
    ouvrier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ouvrier.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ouvrier.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (ouvrier: Ouvrier) => {
    setEditingOuvrier(ouvrier);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ouvrier ?')) {
      setOuvriers(ouvriers.filter(o => o.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const ouvrierData = {
      id: editingOuvrier?.id || Date.now().toString(),
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string,
      qualification: formData.get('qualification') as string,
      certifications: (formData.get('certifications') as string).split(',').map(c => c.trim()),
      dateEmbauche: formData.get('dateEmbauche') as string,
      statut: formData.get('statut') as Ouvrier['statut'],
      tauxHoraire: parseInt(formData.get('tauxHoraire') as string),
      adresse: formData.get('adresse') as string,
      documents: editingOuvrier?.documents || [],
    };

    if (editingOuvrier) {
      setOuvriers(ouvriers.map(o => o.id === editingOuvrier.id ? ouvrierData : o));
    } else {
      setOuvriers([...ouvriers, ouvrierData]);
    }
    
    setIsModalOpen(false);
    setEditingOuvrier(null);
  };

  const OuvrierForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              name="nom"
              type="text"
              required
              defaultValue={editingOuvrier?.nom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              name="prenom"
              type="text"
              required
              defaultValue={editingOuvrier?.prenom || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={editingOuvrier?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              name="telephone"
              type="tel"
              required
              defaultValue={editingOuvrier?.telephone || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
          <input
            name="qualification"
            type="text"
            required
            defaultValue={editingOuvrier?.qualification || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (séparées par des virgules)</label>
          <input
            name="certifications"
            type="text"
            defaultValue={editingOuvrier?.certifications?.join(', ') || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
            <input
              name="dateEmbauche"
              type="date"
              required
              defaultValue={editingOuvrier?.dateEmbauche || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              defaultValue={editingOuvrier?.statut || 'actif'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="actif">Actif</option>
              <option value="conge">En congé</option>
              <option value="arret">Arrêt maladie</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire (€)</label>
            <input
              name="tauxHoraire"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={editingOuvrier?.tauxHoraire || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <textarea
            name="adresse"
            rows={2}
            defaultValue={editingOuvrier?.adresse || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingOuvrier ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Ouvriers</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Ouvrier
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Rechercher un ouvrier..."
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
                  Ouvrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux horaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOuvriers.map((ouvrier) => (
                <tr key={ouvrier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {ouvrier.prenom} {ouvrier.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          Embauché le {new Date(ouvrier.dateEmbauche).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{ouvrier.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{ouvrier.telephone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ouvrier.qualification}</div>
                    <div className="text-sm text-gray-500">
                      {ouvrier.certifications.length} certification(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ouvrier.statut} type="ouvrier" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ouvrier.tauxHoraire} €/h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(ouvrier)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ouvrier.id)}
                        className="text-red-600 hover:text-red-900"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOuvrier(null);
        }}
        title={editingOuvrier ? 'Modifier l\'ouvrier' : 'Nouvel ouvrier'}
        size="lg"
      >
        <OuvrierForm />
      </Modal>
    </div>
  );
};