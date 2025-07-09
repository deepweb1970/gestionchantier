import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Copy, 
  Check, 
  X, 
  Download, 
  Upload, 
  Building2,
  Tag,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';

interface PhotosManagerProps {
  chantierId?: string; // Optional - if provided, only show photos for this chantier
}

export const PhotosManager: React.FC<PhotosManagerProps> = ({ chantierId }) => {
  // State for photos and loading
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState(chantierId || 'all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Form state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoCategory, setPhotoCategory] = useState<Photo['category']>('avancement');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoChantier, setPhotoChantier] = useState(chantierId || '');
  const [urlCopied, setUrlCopied] = useState(false);
  
  // Get chantiers for dropdown
  const { data: chantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('photos')
        .select(`
          *,
          chantiers(nom)
        `)
        .order('date', { ascending: false });
      
      // Apply chantier filter if provided
      if (chantierId) {
        query = query.eq('chantier_id', chantierId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      const formattedPhotos: Photo[] = (data || []).map(item => ({
        id: item.id,
        url: item.url,
        description: item.description,
        date: item.date,
        category: item.category || undefined,
        filename: item.filename || undefined,
        size: item.size_bytes || undefined,
        chantier: item.chantiers ? (item.chantiers as any).nom : undefined,
        chantierId: item.chantier_id
      }));
      
      setPhotos(formattedPhotos);
      setError(null);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch photos'));
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchPhotos();
    
    // Subscribe to changes
    const channel = supabase
      .channel('photos_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'photos' 
      }, () => {
        console.log('Photos changed, refreshing...');
        fetchPhotos();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chantierId]);

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (photo.chantier && photo.chantier.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = photoDate >= weekAgo;
          break;
        case 'month':
          matchesDate = photoDate.getMonth() === today.getMonth() && 
                       photoDate.getFullYear() === today.getFullYear();
          break;
        case 'year':
          matchesDate = photoDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesChantier && matchesDate;
  });

  // Handle add photo
  const handleAddPhoto = async () => {
    if (!photoUrl || !photoDescription || !photoDate || !photoChantier) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('photos')
        .insert({
          url: photoUrl,
          description: photoDescription,
          date: photoDate,
          category: photoCategory,
          chantier_id: photoChantier
        });
      
      if (error) throw error;
      
      // Reset form
      setPhotoUrl('');
      setPhotoDescription('');
      setPhotoCategory('avancement');
      setPhotoDate(new Date().toISOString().split('T')[0]);
      
      // Close modal
      setIsAddModalOpen(false);
      
      // Fetch photos (though real-time subscription should handle this)
      fetchPhotos();
    } catch (err) {
      console.error('Error adding photo:', err);
      alert('Erreur lors de l\'ajout de la photo');
    }
  };

  // Handle edit photo
  const handleEditPhoto = async () => {
    if (!selectedPhoto || !photoDescription || !photoDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          url: photoUrl,
          description: photoDescription,
          date: photoDate,
          category: photoCategory,
          chantier_id: photoChantier
        })
        .eq('id', selectedPhoto.id);
      
      if (error) throw error;
      
      // Close modal
      setIsEditModalOpen(false);
      
      // Fetch photos (though real-time subscription should handle this)
      fetchPhotos();
    } catch (err) {
      console.error('Error updating photo:', err);
      alert('Erreur lors de la mise à jour de la photo');
    }
  };

  // Handle delete photo
  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Fetch photos (though real-time subscription should handle this)
      fetchPhotos();
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  // Handle view photo
  const handleViewPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsViewModalOpen(true);
  };

  // Handle edit button
  const handleEditButton = (photo: Photo) => {
    setSelectedPhoto(photo);
    setPhotoUrl(photo.url);
    setPhotoDescription(photo.description);
    setPhotoCategory(photo.category || 'avancement');
    setPhotoDate(photo.date);
    setPhotoChantier(photo.chantierId || '');
    setIsEditModalOpen(true);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Get category label
  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'avancement': return 'Avancement';
      case 'probleme': return 'Problème';
      case 'materiel': return 'Matériel';
      case 'securite': return 'Sécurité';
      case 'finition': return 'Finition';
      case 'avant': return 'Avant';
      case 'apres': return 'Après';
      default: return 'Autre';
    }
  };

  // Get category color
  const getCategoryColor = (category?: string) => {
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
        <h1 className="text-2xl font-bold text-gray-800">
          {chantierId ? 'Photos du chantier' : 'Gestion des Photos'}
        </h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une photo
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
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
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
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
            </div>
            
            {!chantierId && (
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
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
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des photos...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>Erreur lors du chargement des photos</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Aucune photo trouvée</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.map(photo => (
            <div 
              key={photo.id} 
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="h-48 bg-gray-100 relative cursor-pointer"
                onClick={() => handleViewPhoto(photo)}
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
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                    {getCategoryLabel(photo.category)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{photo.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {new Date(photo.date).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditButton(photo)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {photo.chantier && !chantierId && (
                  <div className="mt-2 flex items-center">
                    <Building2 className="w-3 h-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{photo.chantier}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une photo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {photoUrl && (
            <div className="border rounded-md overflow-hidden">
              <img 
                src={photoUrl} 
                alt="Aperçu" 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=URL+invalide';
                }}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value as Photo['category'])}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={photoChantier}
              onChange={(e) => setPhotoChantier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!chantierId}
            >
              <option value="">Sélectionner un chantier</option>
              {chantiers?.map(chantier => (
                <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddPhoto} disabled={!photoUrl || !photoDescription || !photoDate || !photoChantier}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Photo Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la photo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {photoUrl && (
            <div className="border rounded-md overflow-hidden">
              <img 
                src={photoUrl} 
                alt="Aperçu" 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=URL+invalide';
                }}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value as Photo['category'])}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={photoChantier}
              onChange={(e) => setPhotoChantier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!chantierId}
            >
              <option value="">Sélectionner un chantier</option>
              {chantiers?.map(chantier => (
                <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditPhoto} disabled={!photoUrl || !photoDescription || !photoDate || !photoChantier}>
              <Check className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Photo Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedPhoto?.description || 'Détail de la photo'}
        size="xl"
      >
        {selectedPhoto && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={selectedPhoto.url} 
                    alt={selectedPhoto.description} 
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
                    }}
                  />
                </div>
              </div>
              
              <div className="md:w-1/3 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Informations</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{selectedPhoto.description}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Catégorie</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedPhoto.category)}`}>
                        {getCategoryLabel(selectedPhoto.category)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
                    </div>
                    
                    {selectedPhoto.chantier && (
                      <div>
                        <p className="text-sm text-gray-600">Chantier</p>
                        <p className="font-medium">{selectedPhoto.chantier}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600">URL</p>
                      <div className="flex items-center mt-1">
                        <input
                          type="text"
                          value={selectedPhoto.url}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm bg-gray-50"
                        />
                        <button
                          onClick={() => copyToClipboard(selectedPhoto.url)}
                          className={`px-3 py-2 border border-l-0 border-gray-300 rounded-r-md ${
                            urlCopied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditButton(selectedPhoto);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleDeletePhoto(selectedPhoto.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <a 
                href={selectedPhoto.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Ouvrir l'image originale
              </a>
              
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};