import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image, Download, Filter, Search, Calendar, CheckCircle, X, Building2, Eye, RefreshCw, Upload, Link, ExternalLink, Copy } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { supabase } from '../../lib/supabase';
import { PhotoService } from '../../services/photoService';
import { chantierService } from '../../services/chantierService';

export const PhotosManager: React.FC = () => {
  // State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  // Fetch chantiers data
  const { data: chantiers, loading: chantiersLoading } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });

  // Fetch photos with realtime updates
  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      try {
        const data = await PhotoService.getAll();
        
        // Enhance photos with chantier information
        const enhancedPhotos = await Promise.all(data.map(async (photo) => {
          if (photo.chantier_id) {
            const chantier = chantiers?.find(c => c.id === photo.chantier_id);
            return {
              id: photo.id,
              url: photo.url,
              description: photo.description,
              date: photo.date,
              category: photo.category || undefined,
              filename: photo.filename || undefined,
              size: photo.size_bytes || undefined,
              chantierId: photo.chantier_id,
              chantierNom: chantier?.nom || 'Chantier inconnu'
            } as Photo;
          }
          return {
            id: photo.id,
            url: photo.url,
            description: photo.description,
            date: photo.date,
            category: photo.category || undefined,
            filename: photo.filename || undefined,
            size: photo.size_bytes || undefined
          } as Photo;
        }));
        
        setPhotos(enhancedPhotos);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des photos:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [chantiers, refreshKey]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('photos-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'photos' 
      }, () => {
        console.log('Photos table changed, refreshing data');
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (photo.chantierNom && photo.chantierNom.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || photo.category === categoryFilter;
    
    const matchesChantier = chantierFilter === 'all' || photo.chantierId === chantierFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const photoDate = new Date(photo.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = photoDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesDate = photoDate >= startOfWeek;
          break;
        case 'this_month':
          matchesDate = photoDate.getMonth() === today.getMonth() && photoDate.getFullYear() === today.getFullYear();
          break;
        case 'this_year':
          matchesDate = photoDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesChantier && matchesDate;
  });

  // CRUD operations
  const handleCreate = () => {
    setEditingPhoto(null);
    setIsModalOpen(true);
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleView = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      try {
        await PhotoService.delete(id);
        // Refresh will happen automatically via realtime subscription
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la photo');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const photoData = {
        url: formData.get('url') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        category: formData.get('category') as Photo['category'],
        chantier_id: formData.get('chantierId') as string || null,
        filename: formData.get('filename') as string || null,
        size_bytes: parseInt(formData.get('size') as string) || null
      };

      if (editingPhoto) {
        await PhotoService.update(editingPhoto.id, photoData);
      } else {
        await PhotoService.create(photoData);
      }
      
      // Refresh will happen automatically via realtime subscription
      setIsModalOpen(false);
      setEditingPhoto(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la photo');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiée dans le presse-papiers');
  };

  // Form component
  const PhotoForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de la photo</label>
          <div className="flex">
            <input
              name="url"
              type="url"
              required
              defaultValue={editingPhoto?.url || ''}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
              title="Coller depuis le presse-papiers"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text.startsWith('http') && (text.includes('.jpg') || text.includes('.jpeg') || text.includes('.png') || text.includes('.webp'))) {
                    const urlInput = document.querySelector('input[name="url"]') as HTMLInputElement;
                    if (urlInput) urlInput.value = text;
                  }
                } catch (err) {
                  console.error('Erreur lors de la lecture du presse-papiers:', err);
                }
              }}
            >
              <Paste className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Utilisez une URL d'image publique (JPG, PNG, WebP)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
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
              <option value="avant">Avant travaux</option>
              <option value="apres">Après travaux</option>
            </select>
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier (optionnel)</label>
            <input
              name="filename"
              type="text"
              defaultValue={editingPhoto?.filename || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille en octets (optionnel)</label>
            <input
              name="size"
              type="number"
              defaultValue={editingPhoto?.size || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Preview */}
        {(editingPhoto?.url || document.querySelector('input[name="url"]')?.value) && (
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h4>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={editingPhoto?.url || (document.querySelector('input[name="url"]') as HTMLInputElement)?.value} 
                alt="Aperçu" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingPhoto ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  // View modal component
  const ViewPhotoModal = () => {
    if (!selectedPhoto) return null;

    const chantier = chantiers?.find(c => c.id === selectedPhoto.chantierId);

    return (
      <div className="space-y-6">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img 
            src={selectedPhoto.url} 
            alt={selectedPhoto.description} 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
            }}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{selectedPhoto.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Catégorie</p>
              <p className="font-medium capitalize">{selectedPhoto.category}</p>
            </div>
            {chantier && (
              <div>
                <p className="text-sm text-gray-600">Chantier</p>
                <p className="font-medium">{chantier.nom}</p>
              </div>
            )}
            {selectedPhoto.filename && (
              <div>
                <p className="text-sm text-gray-600">Nom du fichier</p>
                <p className="font-medium">{selectedPhoto.filename}</p>
              </div>
            )}
            {selectedPhoto.size && (
              <div>
                <p className="text-sm text-gray-600">Taille</p>
                <p className="font-medium">{formatFileSize(selectedPhoto.size)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">URL de l'image</span>
            <div className="flex items-center space-x-2">
              <a 
                href={selectedPhoto.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => copyToClipboard(selectedPhoto.url)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedPhoto)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => {
            handleDelete(selectedPhoto.id);
            setIsViewModalOpen(false);
          }}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getCategoryLabel = (category?: string): string => {
    switch (category) {
      case 'avancement': return 'Avancement';
      case 'probleme': return 'Problème';
      case 'materiel': return 'Matériel';
      case 'securite': return 'Sécurité';
      case 'finition': return 'Finition';
      case 'avant': return 'Avant travaux';
      case 'apres': return 'Après travaux';
      default: return 'Autre';
    }
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'avancement': return 'bg-blue-100 text-blue-800';
      case 'probleme': return 'bg-red-100 text-red-800';
      case 'materiel': return 'bg-orange-100 text-orange-800';
      case 'securite': return 'bg-yellow-100 text-yellow-800';
      case 'finition': return 'bg-green-100 text-green-800';
      case 'avant': return 'bg-purple-100 text-purple-800';
      case 'apres': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Photos</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Photo
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

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
              <option value="avant">Avant travaux</option>
              <option value="apres">Après travaux</option>
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
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois</option>
              <option value="this_year">Cette année</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des photos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-700">{error.message}</p>
        </div>
      ) : (
        <>
          {filteredPhotos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune photo trouvée</h3>
              <p className="text-gray-600 mb-4">Ajoutez des photos pour les visualiser ici.</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map(photo => (
                <div key={photo.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group">
                  <div 
                    className="aspect-video bg-gray-100 relative cursor-pointer"
                    onClick={() => handleView(photo)}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.description} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                        {getCategoryLabel(photo.category)}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(photo.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                      {photo.description}
                    </p>
                    
                    {photo.chantierId && (
                      <div className="flex items-center text-xs text-gray-600 mb-3">
                        <Building2 className="w-3 h-3 mr-1" />
                        <span className="truncate">{photo.chantierNom}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(photo);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
        }}
        title={editingPhoto ? 'Modifier la photo' : 'Nouvelle photo'}
        size="lg"
      >
        <PhotoForm />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPhoto(null);
        }}
        title="Détails de la photo"
        size="xl"
      >
        <ViewPhotoModal />
      </Modal>
    </div>
  );
};

// Paste icon component
const Paste: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);