import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image, Download, Filter, Search, Calendar, CheckCircle, X, Building2, Camera, ArrowLeft, ArrowRight, Upload, Eye, Info, Tag, Clock } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { PhotoService } from '../../services/photoService';
import { chantierService } from '../../services/chantierService';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { ExportModal } from '../Common/ExportModal';
import { supabase } from '../../lib/supabase';

export const PhotosManager: React.FC = () => {
  // State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);

  // Data fetching with realtime updates
  const { data: chantiers, loading: chantiersLoading } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true);
        const allPhotos = await PhotoService.getAll();
        
        // Enhance photos with chantier information
        const enhancedPhotos = allPhotos.map(photo => {
          const chantier = chantiers?.find(c => c.id === photo.chantier_id);
          return {
            ...photo,
            chantierId: photo.chantier_id || undefined,
            chantierNom: chantier?.nom || 'Sans chantier'
          };
        });
        
        setPhotos(enhancedPhotos);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des photos:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    if (!chantiersLoading) {
      loadPhotos();
    }
  }, [chantiersLoading, chantiers]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('photos-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'photos' 
      }, () => {
        // Refresh photos when changes occur
        refreshPhotos();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Refresh photos
  const refreshPhotos = async () => {
    try {
      const allPhotos = await PhotoService.getAll();
      
      // Enhance photos with chantier information
      const enhancedPhotos = allPhotos.map(photo => {
        const chantier = chantiers?.find(c => c.id === photo.chantier_id);
        return {
          ...photo,
          chantierId: photo.chantier_id || undefined,
          chantierNom: chantier?.nom || 'Sans chantier'
        };
      });
      
      setPhotos(enhancedPhotos);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des photos:', err);
    }
  };

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.chantierNom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || photo.category === categoryFilter;
    const matchesChantier = chantierFilter === 'all' || photo.chantierId === chantierFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const photoDate = new Date(photo.date);
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = photoDate.toDateString() === today.toDateString();
          break;
        case 'week':
          matchesDate = photoDate >= lastWeek;
          break;
        case 'month':
          matchesDate = photoDate >= lastMonth;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesChantier && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage);
  const paginatedPhotos = filteredPhotos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CRUD operations
  const handleCreate = () => {
    setEditingPhoto(null);
    setIsModalOpen(true);
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleViewDetails = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.')) {
      try {
        await PhotoService.delete(id);
        refreshPhotos();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la photo');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const photoData = {
        chantier_id: formData.get('chantierId') as string || null,
        url: formData.get('url') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        category: formData.get('category') as Photo['category'] || 'avancement',
        filename: formData.get('filename') as string || null,
        size_bytes: newPhotoFile ? newPhotoFile.size : null
      };

      if (editingPhoto) {
        await PhotoService.update(editingPhoto.id, photoData);
      } else {
        await PhotoService.create(photoData);
      }
      
      refreshPhotos();
      setIsModalOpen(false);
      setEditingPhoto(null);
      setNewPhotoUrl('');
      setNewPhotoFile(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la photo');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExternalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPhotoUrl(e.target.value);
    setNewPhotoFile(null);
  };

  // Form component
  const PhotoForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
          <select
            name="chantierId"
            defaultValue={editingPhoto?.chantierId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun chantier</option>
            {chantiers?.map(chantier => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.nom} ({chantier.statut})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            name="description"
            type="text"
            required
            defaultValue={editingPhoto?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={editingPhoto?.date || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              name="category"
              defaultValue={editingPhoto?.category || 'avancement'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="avancement">Avancement</option>
              <option value="probleme">Problème</option>
              <option value="materiel">Matériel</option>
              <option value="securite">Sécurité</option>
              <option value="finition">Finition</option>
              <option value="avant">Avant</option>
              <option value="apres">Après</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de la photo</label>
          <input
            name="url"
            type="url"
            required
            value={newPhotoUrl || editingPhoto?.url || ''}
            onChange={handleExternalUrlChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ou télécharger une image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Télécharger un fichier</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">ou glisser-déposer</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF jusqu'à 10MB
              </p>
            </div>
          </div>
        </div>
        
        <input
          type="hidden"
          name="filename"
          value={newPhotoFile?.name || editingPhoto?.filename || ''}
        />
        
        {/* Preview */}
        {(newPhotoUrl || editingPhoto?.url) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Aperçu</label>
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={newPhotoUrl || editingPhoto?.url} 
                alt="Aperçu" 
                className="w-full h-64 object-contain bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => {
          setIsModalOpen(false);
          setEditingPhoto(null);
          setNewPhotoUrl('');
          setNewPhotoFile(null);
        }}>
          Annuler
        </Button>
        <Button type="submit" disabled={isUploading}>
          {editingPhoto ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  // Detail modal component
  const PhotoDetailModal = () => {
    if (!selectedPhoto) return null;

    const chantier = chantiers?.find(c => c.id === selectedPhoto.chantierId);

    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg overflow-hidden">
          <img 
            src={selectedPhoto.url} 
            alt={selectedPhoto.description} 
            className="w-full h-96 object-contain bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Informations</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Catégorie</p>
                    <p className="font-medium capitalize">{selectedPhoto.category}</p>
                  </div>
                  {selectedPhoto.filename && (
                    <div>
                      <p className="text-sm text-gray-600">Nom du fichier</p>
                      <p className="font-medium">{selectedPhoto.filename}</p>
                    </div>
                  )}
                  {selectedPhoto.size_bytes && (
                    <div>
                      <p className="text-sm text-gray-600">Taille</p>
                      <p className="font-medium">{(selectedPhoto.size_bytes / 1024).toFixed(1)} KB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{selectedPhoto.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {chantier && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Chantier</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="font-medium text-gray-900">{chantier.nom}</p>
                  </div>
                  <p className="text-sm text-gray-600">{chantier.adresse}</p>
                  <div className="mt-2">
                    <StatusBadge status={chantier.statut} type="chantier" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = selectedPhoto.url;
                    a.download = selectedPhoto.filename || 'photo.jpg';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger l'image
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    window.open(selectedPhoto.url, '_blank');
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Voir en plein écran
                </Button>
                
                <Button 
                  className="w-full"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setEditingPhoto(selectedPhoto);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                
                <Button 
                  variant="danger" 
                  className="w-full"
                  onClick={() => {
                    handleDelete(selectedPhoto.id);
                    setIsDetailModalOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Photos</h1>
        <div className="flex space-x-3">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Photo
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher une photo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="avancement">Avancement</option>
              <option value="probleme">Problème</option>
              <option value="materiel">Matériel</option>
              <option value="securite">Sécurité</option>
              <option value="finition">Finition</option>
              <option value="avant">Avant</option>
              <option value="apres">Après</option>
            </select>
            
            <select
              value={chantierFilter}
              onChange={(e) => setChantierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les chantiers</option>
              {chantiers?.map(chantier => (
                <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
              ))}
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
            
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                title="Vue grille"
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                title="Vue liste"
              >
                <div className="flex flex-col space-y-1">
                  <div className="w-6 h-2 bg-current rounded-sm"></div>
                  <div className="w-6 h-2 bg-current rounded-sm"></div>
                  <div className="w-6 h-2 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des photos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">Erreur lors du chargement des photos</p>
          <p className="text-sm text-red-600 mt-1">{error.message}</p>
        </div>
      ) : (
        <>
          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedPhotos.length > 0 ? (
                paginatedPhotos.map(photo => (
                  <div key={photo.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div 
                      className="h-48 bg-gray-100 relative cursor-pointer"
                      onClick={() => handleViewDetails(photo)}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.description} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          photo.category === 'avancement' ? 'bg-blue-100 text-blue-800' :
                          photo.category === 'probleme' ? 'bg-red-100 text-red-800' :
                          photo.category === 'materiel' ? 'bg-orange-100 text-orange-800' :
                          photo.category === 'securite' ? 'bg-yellow-100 text-yellow-800' :
                          photo.category === 'finition' ? 'bg-green-100 text-green-800' :
                          photo.category === 'avant' ? 'bg-purple-100 text-purple-800' :
                          photo.category === 'apres' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {photo.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{photo.description}</h3>
                          <p className="text-xs text-gray-500 mt-1">{new Date(photo.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(photo)}
                            className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(photo.id)}
                            className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex items-center">
                        <Building2 className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="truncate">{photo.chantierNom}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                  <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune photo trouvée</p>
                </div>
              )}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chantier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPhotos.length > 0 ? (
                    paginatedPhotos.map(photo => (
                      <tr key={photo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="h-16 w-16 bg-gray-100 rounded overflow-hidden cursor-pointer"
                            onClick={() => handleViewDetails(photo)}
                          >
                            <img 
                              src={photo.url} 
                              alt={photo.description} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{photo.description}</div>
                          {photo.filename && (
                            <div className="text-xs text-gray-500 mt-1">{photo.filename}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{photo.chantierNom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            photo.category === 'avancement' ? 'bg-blue-100 text-blue-800' :
                            photo.category === 'probleme' ? 'bg-red-100 text-red-800' :
                            photo.category === 'materiel' ? 'bg-orange-100 text-orange-800' :
                            photo.category === 'securite' ? 'bg-yellow-100 text-yellow-800' :
                            photo.category === 'finition' ? 'bg-green-100 text-green-800' :
                            photo.category === 'avant' ? 'bg-purple-100 text-purple-800' :
                            photo.category === 'apres' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {photo.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{new Date(photo.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(photo)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(photo)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(photo.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                        Aucune photo trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredPhotos.length)} sur {filteredPhotos.length} photos
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                  <option value="96">96</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded-md ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPhoto(null);
          setNewPhotoUrl('');
          setNewPhotoFile(null);
        }}
        title={editingPhoto ? 'Modifier la photo' : 'Nouvelle photo'}
        size="lg"
      >
        <PhotoForm />
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPhoto(null);
        }}
        title="Détails de la photo"
        size="xl"
      >
        <PhotoDetailModal />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter les photos"
        data={filteredPhotos.map(photo => ({
          Description: photo.description,
          URL: photo.url,
          Chantier: photo.chantierNom,
          Catégorie: photo.category,
          Date: new Date(photo.date).toLocaleDateString(),
          'Nom du fichier': photo.filename || '',
          'Taille (KB)': photo.size_bytes ? (photo.size_bytes / 1024).toFixed(1) : ''
        }))}
        filename="photos"
      />
    </div>
  );
};