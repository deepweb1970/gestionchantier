import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Phone, Mail, Download, Calendar, Briefcase, Award, FileText, MapPin, Clock, CheckCircle, AlertTriangle, Search, Filter, Eye } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { ouvrierService } from '../../services/ouvrierService';
import { Ouvrier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const Ouvriers: React.FC = () => {
  const { data: ouvriers, loading, error, refresh } = useRealtimeSupabase<Ouvrier>({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingOuvrier, setEditingOuvrier] = useState<Ouvrier | null>(null);
  const [selectedOuvrier, setSelectedOuvrier] = useState<Ouvrier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qualificationFilter, setQualificationFilter] = useState('all');

  const filteredOuvriers = (ouvriers || []).filter(ouvrier =>
    ouvrier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ouvrier.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ouvrier.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ouvrier.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(ouvrier => 
    statusFilter === 'all' || ouvrier.statut === statusFilter
  ).filter(ouvrier => 
    qualificationFilter === 'all' || ouvrier.qualification === qualificationFilter
  );

  const handleEdit = (ouvrier: Ouvrier) => {
    setEditingOuvrier(ouvrier);
    setIsModalOpen(true);
  };

  const handleViewDetails = (ouvrier: Ouvrier) => {
    setSelectedOuvrier(ouvrier);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ouvrier ?')) {
      try {
        await ouvrierService.delete(id);
        // Force refresh immediately
        refresh();
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'ouvrier');
      }
    }
  };

  // Get unique qualifications for filter
  const uniqueQualifications = React.useMemo(() => {
    const qualifications = new Set<string>();
    (ouvriers || []).forEach(ouvrier => {
      qualifications.add(ouvrier.qualification);
    });
    return Array.from(qualifications);
  }, [ouvriers]);

  // Calculate statistics
  const getStatistics = () => {
    const total = (ouvriers || []).length;
    const active = (ouvriers || []).filter(o => o.statut === 'actif').length;
    const avgRate = (ouvriers || []).reduce((sum, o) => sum + o.tauxHoraire, 0) / (total || 1);
    const totalCost = (ouvriers || []).reduce((sum, o) => sum + o.tauxHoraire, 0);
    
    return { total, active, avgRate, totalCost };
  };

  const stats = getStatistics();

  const handleSave = async (formData: FormData) => {
    const ouvrierData = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string,
      qualification: formData.get('qualification') as string,
      certifications: (formData.get('certifications') as string).split(',').map(c => c.trim()),
      dateEmbauche: formData.get('dateEmbauche') as string,
      statut: formData.get('statut') as Ouvrier['statut'],
      tauxHoraire: parseInt(formData.get('tauxHoraire') as string),
      adresse: formData.get('adresse') as string
    };

    try {
      if (editingOuvrier) {
        const updatedOuvrier = await ouvrierService.update(editingOuvrier.id, ouvrierData);
        console.log('Ouvrier mis à jour:', updatedOuvrier);
      } else {
        const newOuvrier = await ouvrierService.create(ouvrierData);
        console.log('Nouvel ouvrier créé:', newOuvrier);
      }
      
      // Force refresh immediately
      refresh();
      
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsModalOpen(false);
      setEditingOuvrier(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de l\'ouvrier');
    }
  };

  const OuvrierForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informations personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingOuvrier?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                name="prenom"
                type="text"
                required
                defaultValue={editingOuvrier?.prenom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: Jean"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingOuvrier?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="email@exemple.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="telephone"
                  type="tel"
                  required
                  defaultValue={editingOuvrier?.telephone || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="adresse"
                rows={2}
                required
                defaultValue={editingOuvrier?.adresse || ''}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Adresse complète"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Informations professionnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="qualification"
                  type="text"
                  required
                  defaultValue={editingOuvrier?.qualification || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Ex: Électricien qualifié"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="dateEmbauche"
                  type="date"
                  required
                  defaultValue={editingOuvrier?.dateEmbauche || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (séparées par des virgules)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="certifications"
                rows={2}
                defaultValue={editingOuvrier?.certifications?.join(', ') || ''}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Ex: CACES R482, Habilitation électrique B0, SST"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingOuvrier?.statut || 'actif'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="actif">Actif</option>
                <option value="conge">En congé</option>
                <option value="arret">Arrêt maladie</option>
                <option value="indisponible">Indisponible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire (€)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                <input
                  name="tauxHoraire"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={editingOuvrier?.tauxHoraire || 0}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Ex: 25.00"
                />
              </div>
            </div>
          </div>
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
  
  const OuvrierDetailModal = () => {
    if (!selectedOuvrier) return null;
    
    // Calculate years of service
    const hireDate = new Date(selectedOuvrier.dateEmbauche);
    const today = new Date();
    const yearsOfService = today.getFullYear() - hireDate.getFullYear();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedOuvrier.prenom} {selectedOuvrier.nom}</h2>
              <p className="mt-1 text-green-100">{selectedOuvrier.qualification}</p>
              <div className="mt-3 flex items-center">
                <StatusBadge status={selectedOuvrier.statut} type="ouvrier" />
                <span className="ml-3 text-sm bg-white/20 px-2 py-1 rounded">
                  {yearsOfService} an{yearsOfService > 1 ? 's' : ''} d'ancienneté
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedOuvrier.tauxHoraire} €/h</div>
              <div className="text-sm text-green-100">Taux horaire</div>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-500" />
            Coordonnées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{selectedOuvrier.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium">{selectedOuvrier.telephone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium">{selectedOuvrier.adresse}</p>
            </div>
          </div>
        </div>
        
        {/* Professional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-green-500" />
              Informations professionnelles
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Qualification</p>
                <p className="font-medium">{selectedOuvrier.qualification}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d'embauche</p>
                <p className="font-medium">{new Date(selectedOuvrier.dateEmbauche).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <StatusBadge status={selectedOuvrier.statut} type="ouvrier" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Certifications
            </h3>
            {selectedOuvrier.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedOuvrier.certifications.map((cert, index) => (
                  <span 
                    key={index} 
                    className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune certification enregistrée</p>
            )}
          </div>
        </div>
        
        {/* Documents */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" />
            Documents
          </h3>
          {selectedOuvrier.documents.length > 0 ? (
            <div className="space-y-2">
              {selectedOuvrier.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm">{doc.nom}</p>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                  </div>
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Voir
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun document disponible</p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedOuvrier)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedOuvrier.id)}>
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ouvriers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ouvriers Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">sur {stats.total} total</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux Moyen</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgRate.toFixed(2)} €/h</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coût Horaire Total</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalCost.toFixed(0)} €/h</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
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
            <div className="p-4 border-b space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un ouvrier..."
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
                    <option value="conge">En congé</option>
                    <option value="arret">Arrêt maladie</option>
                    <option value="indisponible">Indisponibles</option>
                  </select>
                </div>
              </div>
              
              {uniqueQualifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setQualificationFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      qualificationFilter === 'all' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Toutes qualifications
                  </button>
                  {uniqueQualifications.map(qual => (
                    <button
                      key={qual}
                      onClick={() => setQualificationFilter(qual)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        qualificationFilter === qual 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {qual}
                    </button>
                  ))}
                </div>
              )}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => handleViewDetails(ouvrier)}>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{ouvrier.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{ouvrier.telephone}</span>
                        </div>
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
                            onClick={() => handleViewDetails(ouvrier)}
                            className="text-green-600 hover:text-green-900"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(ouvrier)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ouvrier.id)}
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
                {filteredOuvriers.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                        Aucun ouvrier trouvé
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
          setEditingOuvrier(null);
        }}
        title={editingOuvrier ? 'Modifier l\'ouvrier' : 'Nouvel ouvrier'}
        size="lg"
      >
        {!loading && <OuvrierForm />}
      </Modal>
      
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOuvrier(null);
        }}
        title={selectedOuvrier ? `${selectedOuvrier.prenom} ${selectedOuvrier.nom}` : 'Détails de l\'ouvrier'}
        size="lg"
      >
        {selectedOuvrier && <OuvrierDetailModal />}
      </Modal>
    </div>
  );
};