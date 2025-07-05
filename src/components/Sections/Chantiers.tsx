import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Camera, MapPin, Filter, Download, Clock, Users, Upload, X, Eye, Calendar, Tag } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { clientService } from '../../services/clientService';
import { saisieHeureService } from '../../services/saisieHeureService'; 
import { ouvrierService } from '../../services/ouvrierService'; 
import { Chantier, Photo } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const Chantiers: React.FC = () => {
  const { data: chantiers, loading, error, refresh } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: clients } = useRealtimeSupabase({
    table: 'clients',
    fetchFunction: clientService.getAll
  });
  
  const { data: saisiesHeures } = useRealtimeSupabase({
    table: 'saisies_heures',
    fetchFunction: saisieHeureService.getAll
  });
  
  const { data: ouvriers } = useRealtimeSupabase({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoCategory, setPhotoCategory] = useState('avancement');

  const photoCategories = [
    { value: 'avancement', label: 'État d\'avancement', color: 'bg-blue-500' },
    { value: 'probleme', label: 'Problème/Défaut', color: 'bg-red-500' },
    { value: 'materiel', label: 'Matériel', color: 'bg-orange-500' },
    { value: 'securite', label: 'Sécurité', color: 'bg-yellow-500' },
    { value: 'finition', label: 'Finitions', color: 'bg-green-500' },
    { value: 'avant', label: 'Avant travaux', color: 'bg-gray-500' },
    { value: 'apres', label: 'Après travaux', color: 'bg-purple-500' }
  ];

  const filteredChantiers = (chantiers || []).filter(chantier => {
    const matchesSearch = chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (chantier.client && chantier.client.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || chantier.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fonction pour calculer les heures totales d'un chantier
  const getChantierTotalHours = (chantierId: string) => {
    if (!saisiesHeures) return { totalHeures: 0, heuresValidees: 0 };

    const saisiesChantier = saisiesHeures.filter(saisie => saisie.chantier_id === chantierId);
    const totalHeures = saisiesChantier.reduce((sum, saisie) => sum + (saisie.heures_total || 0), 0);
    const heuresValidees = saisiesChantier
      .filter(saisie => saisie.valide)
      .reduce((sum, saisie) => sum + (saisie.heures_total || 0), 0);
    
    return { totalHeures, heuresValidees };
  };

  // Fonction pour obtenir le nombre d'ouvriers uniques sur un chantier
  const getChantierWorkersCount = (chantierId: string) => {
    if (!saisiesHeures) return 0;

    const saisiesChantier = saisiesHeures.filter(saisie => saisie.chantier_id === chantierId);
    const uniqueWorkers = new Set(saisiesChantier.map(saisie => saisie.ouvrier_id));
    return uniqueWorkers.size;
  };

  // Fonction pour calculer le coût de main d'œuvre d'un chantier
  const getChantierLaborCost = (chantierId: string) => {
    if (!saisiesHeures || !ouvriers) return 0;

    const saisiesChantier = saisiesHeures.filter(saisie => saisie.chantier_id === chantierId);
    return saisiesChantier.reduce((sum, saisie) => {
      const ouvrier = ouvriers.find(o => o.id === saisie.ouvrier_id);
      if (!ouvrier) return sum;
      
      // Utiliser le total des heures avec le taux horaire de l'ouvrier
      return sum + (saisie.heures_total || 0) * ouvrier.taux_horaire;
    }, 0);
  };

  // Fonction pour mettre à jour automatiquement l'avancement du chantier en fonction des heures travaillées
  const calculateChantierProgress = (chantier: Chantier) => {
    if (!saisiesHeures || !chantier.budget) return chantier.avancement;

    const { totalHeures } = getChantierTotalHours(chantier.id);
    const laborCost = getChantierLaborCost(chantier.id);

    // Calcul basé sur le coût de main d'oeuvre par rapport au budget
    if (chantier.budget > 0) {
      // On considère que le coût de main d'oeuvre représente environ 40% du budget total
      const estimatedTotalLaborCost = chantier.budget * 0.4;
      if (estimatedTotalLaborCost > 0) {
        const progressByLabor = Math.min(100, Math.round((laborCost / estimatedTotalLaborCost) * 100));

        // Si le chantier est déjà marqué comme terminé, on garde 100%
        if (chantier.statut === 'termine') {
          return 100;
        }

        // Si le chantier est en pause, on ne met pas à jour l'avancement automatiquement
        if (chantier.statut === 'pause') {
          return chantier.avancement;
        }

        // Pour les chantiers actifs ou planifiés, on met à jour l'avancement
        return progressByLabor;
      }
    }

    return chantier.avancement;
  };

  // Mettre à jour l'avancement des chantiers en fonction des heures travaillées
  useEffect(() => {
    if (!chantiers || !saisiesHeures || !ouvriers) return;

    const updateChantierProgress = async () => {
      for (const chantier of chantiers) {
        const calculatedProgress = calculateChantierProgress(chantier);

        // Si l'avancement calculé est différent de l'avancement actuel, mettre à jour
        if (calculatedProgress !== chantier.avancement) {
          try {
            await chantierService.update(chantier.id, { avancement: calculatedProgress });
          } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'avancement du chantier ${chantier.id}:`, error);
          }
        }
      }
    };

    updateChantierProgress();
  }, [chantiers, saisiesHeures, ouvriers]);

  const handleEdit = (chantier: Chantier) => {
    setEditingChantier(chantier);
    setIsModalOpen(true);
  };

  const handlePhotoManagement = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setIsPhotoModalOpen(true);
  };

  const handlePhotoView = (photo: Photo, chantier: Chantier) => {
    setSelectedPhoto(photo);
    setSelectedChantier(chantier);
    setIsPhotoViewerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chantier ?')) {
      try {
        await chantierService.delete(id);
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du chantier');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setNewPhotos([...newPhotos, ...imageFiles]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (!selectedChantier || newPhotos.length === 0) return;

    // Simulation d'upload
    const uploadedPhotos: Photo[] = newPhotos.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      url: URL.createObjectURL(file), // En production, ce serait l'URL du serveur
      description: photoDescription || `Photo ${photoCategory}`,
      date: new Date().toISOString().split('T')[0],
      category: photoCategory,
      filename: file.name,
      size: file.size
    }));

    // Mettre à jour le chantier avec les nouvelles photos
    setChantiers(chantiers.map(c => 
      c.id === selectedChantier.id 
        ? { ...c, photos: [...c.photos, ...uploadedPhotos] }
        : c
    ));

    // Réinitialiser le formulaire
    setNewPhotos([]);
    setPhotoDescription('');
    setPhotoCategory('avancement');
  };

  const deletePhoto = (photoId: string) => {
    if (!selectedChantier) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      setChantiers(chantiers.map(c => 
        c.id === selectedChantier.id 
          ? { ...c, photos: c.photos.filter(p => p.id !== photoId) }
          : c
      ));
      
      // Mettre à jour selectedChantier pour refléter les changements
      setSelectedChantier({
        ...selectedChantier,
        photos: selectedChantier.photos.filter(p => p.id !== photoId)
      });
    }
  };

  const updatePhotoDescription = (photoId: string, newDescription: string) => {
    if (!selectedChantier) return;

    setChantiers(chantiers.map(c => 
      c.id === selectedChantier.id 
        ? { 
            ...c, 
            photos: c.photos.map(p => 
              p.id === photoId ? { ...p, description: newDescription } : p
            )
          }
        : c
    ));

    setSelectedChantier({
      ...selectedChantier,
      photos: selectedChantier.photos.map(p => 
        p.id === photoId ? { ...p, description: newDescription } : p
      )
    });
  };

  const getCategoryInfo = (category: string) => {
    return photoCategories.find(cat => cat.value === category) || photoCategories[0];
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
        photos: editingChantier?.photos || [],
      };

      if (editingChantier) {
        await chantierService.update(editingChantier.id, chantierData, clientId);
      } else {
        await chantierService.create(chantierData, clientId);
      }
      
      setIsModalOpen(false);
      setEditingChantier(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du chantier');
    };
  };

  const ChantierForm = () => {
    // Trouver le client correspondant au chantier en cours d'édition
    const currentClientId = editingChantier ? 
      clients?.find(c => c.nom === editingChantier.client)?.id || '' : '';

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave(new FormData(e.currentTarget));
      }}>
        <div className="space-y-4">
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
                defaultValue={currentClientId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {(clients || []).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom} {client.type === 'entreprise' ? '(Entreprise)' : '(Particulier)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {clients?.length || 0} client(s) disponible(s)
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editingChantier?.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              name="adresse"
              type="text"
              required
              defaultValue={editingChantier?.adresse || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                name="dateDebut"
                type="date"
                required
                defaultValue={editingChantier?.dateDebut || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                name="dateFin"
                type="date"
                defaultValue={editingChantier?.dateFin || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingChantier?.statut || 'planifie'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planifie">Planifié</option>
                <option value="actif">Actif</option>
                <option value="pause">En pause</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avancement (%)</label>
              <input
                name="avancement"
                type="number"
                min="0"
                max="100"
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
                defaultValue={editingChantier?.budget || 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Aperçu du client sélectionné */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Informations du client sélectionné</h4>
            <div id="client-preview" className="text-sm text-gray-600">
              <p>Sélectionnez un client pour voir ses informations</p>
            </div>
          </div>
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
  };

  const PhotoManagementModal = () => {
    if (!selectedChantier) return null;

    return (
      <div className="space-y-6">
        {/* Upload de nouvelles photos */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter des photos</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {photoCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="Description de la photo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner des photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Cliquez pour sélectionner des photos</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF jusqu'à 10MB</p>
                </label>
              </div>
            </div>

            {/* Aperçu des nouvelles photos */}
            {newPhotos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Photos à ajouter ({newPhotos.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newPhotos.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeNewPhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={uploadPhotos} disabled={newPhotos.length === 0}>
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter {newPhotos.length} photo(s)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos existantes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Photos du chantier ({selectedChantier.photos.length})
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Grouper par:</span>
              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="date">Date</option>
                <option value="category">Catégorie</option>
              </select>
            </div>
          </div>

          {selectedChantier.photos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Camera className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune photo pour ce chantier</p>
              <p className="text-sm text-gray-400">Ajoutez des photos pour suivre l'avancement</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedChantier.photos.map(photo => {
                const categoryInfo = getCategoryInfo(photo.category || 'avancement');
                return (
                  <div key={photo.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={photo.url}
                        alt={photo.description}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => handlePhotoView(photo, selectedChantier)}
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(photo.date).toLocaleDateString()}
                      </div>
                      <input
                        type="text"
                        value={photo.description}
                        onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                        className="w-full text-sm border-none p-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="Description..."
                      />
                      {photo.filename && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{photo.filename}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PhotoViewerModal = () => {
    if (!selectedPhoto || !selectedChantier) return null;

    const currentIndex = selectedChantier.photos.findIndex(p => p.id === selectedPhoto.id);
    const canNavigate = selectedChantier.photos.length > 1;

    const navigatePhoto = (direction: 'prev' | 'next') => {
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % selectedChantier.photos.length
        : (currentIndex - 1 + selectedChantier.photos.length) % selectedChantier.photos.length;
      
      setSelectedPhoto(selectedChantier.photos[newIndex]);
    };

    const categoryInfo = getCategoryInfo(selectedPhoto.category || 'avancement');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(selectedPhoto.date).toLocaleDateString()}
            </div>
          </div>
          {canNavigate && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigatePhoto('prev')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                ←
              </button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {selectedChantier.photos.length}
              </span>
              <button
                onClick={() => navigatePhoto('next')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.description}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-gray-700">{selectedPhoto.description}</p>
          
          {selectedPhoto.filename && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Fichier: {selectedPhoto.filename}</span>
                {selectedPhoto.size && (
                  <span>Taille: {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setIsPhotoViewerOpen(false)}
          >
            Fermer
          </Button>
          <div className="flex space-x-2">
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deletePhoto(selectedPhoto.id);
                setIsPhotoViewerOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Chantiers</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Chantier
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
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
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher un chantier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <option value="planifie">Planifié</option>
                    <option value="actif">Actif</option>
                    <option value="pause">En pause</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>
            </div>

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
                      Heures Travaillées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget / Coût M.O.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChantiers.map((chantier) => {
                    const { totalHeures, heuresValidees } = getChantierTotalHours(chantier.id);
                    const workersCount = getChantierWorkersCount(chantier.id);
                    const laborCost = getChantierLaborCost(chantier.id);
                    
                    return (
                      <tr key={chantier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{chantier.nom}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {chantier.adresse}
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
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${chantier.avancement}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">{chantier.avancement}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-1 text-blue-500" />
                              <span className="font-medium text-gray-900">{totalHeures.toFixed(1)}h</span>
                              <span className="text-gray-500 ml-1">total</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <div className="w-4 h-4 mr-1 flex items-center justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                              <span className="text-green-600 font-medium">{heuresValidees.toFixed(1)}h</span>
                              <span className="text-gray-500 ml-1">validées</span>
                            </div>
                            {workersCount > 0 && (
                              <div className="flex items-center text-xs">
                                <Users className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="text-gray-600">{workersCount} ouvrier(s)</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{chantier.budget.toLocaleString()} €</span>
                              <span className="text-gray-500 text-xs ml-1">budget</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-orange-600">{laborCost.toLocaleString()} €</span>
                              <span className="text-gray-500 text-xs ml-1">coût M.O.</span>
                            </div>
                            {laborCost > 0 && (
                              <div className="text-xs">
                                <span className={`font-medium ${
                                  laborCost <= chantier.budget ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {((chantier.budget - laborCost) / chantier.budget * 100).toFixed(1)}%
                                </span>
                                <span className="text-gray-500 ml-1">marge</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Camera className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm font-medium text-gray-900">{chantier.photos.length}</span>
                            </div>
                            {chantier.photos.length > 0 && (
                              <div className="flex -space-x-1">
                                {chantier.photos.slice(0, 3).map((photo, index) => (
                                  <img
                                    key={photo.id}
                                    src={photo.url}
                                    alt={photo.description}
                                    className="w-6 h-6 rounded-full border-2 border-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => handlePhotoView(photo, chantier)}
                                  />
                                ))}
                                {chantier.photos.length > 3 && (
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    +{chantier.photos.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(chantier)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePhotoManagement(chantier)}
                              className="text-green-600 hover:text-green-900"
                              title="Gérer les photos"
                            >
                              <Camera className="w-4 h-4" />
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
          </>
        )}
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChantier(null);
        }}
        title={editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
        size="lg"
      >
        {!loading && <ChantierForm />}
      </Modal>

      {/* Modal de gestion des photos */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedChantier(null);
          setNewPhotos([]);
          setPhotoDescription('');
          setPhotoCategory('avancement');
        }}
        title={`Photos - ${selectedChantier?.nom}`}
        size="xl"
      >
        <PhotoManagementModal />
      </Modal>

      {/* Modal de visualisation des photos */}
      <Modal
        isOpen={isPhotoViewerOpen}
        onClose={() => {
          setIsPhotoViewerOpen(false);
          setSelectedPhoto(null);
        }}
        title="Visualisation de photo"
        size="lg"
      >
        <PhotoViewerModal />
      </Modal>
    </div>
  );
};