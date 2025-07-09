import React, { useState, useEffect } from 'react';
import { 
  Image, Plus, Edit, Trash2, Download, Filter, Search, Calendar, 
  CheckCircle, X, Building2, Tag, Info, Upload, Eye, EyeOff, 
  ArrowLeft, ArrowRight, Maximize, Minimize, Copy, Link, Share2
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { supabase } from '../../lib/supabase';

export const PhotosManager: React.FC = () => {
  // State for photos and chantiers
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [isDateRangeFilterActive, setIsDateRangeFilterActive] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isGalleryView, setIsGalleryView] = useState(true);
  
  // Form states
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoDescription, setNewPhotoDescription] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<Photo['category']>('avancement');
  const [newPhotoDate, setNewPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPhotoChantier, setNewPhotoChantier] = useState('');
  const [newPhotoFilename, setNewPhotoFilename] = useState('');
  
  // Gallery view states
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Get chantiers data
  const { data: chantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });

  // Fetch photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('photos')
          .select(`
            *,
            chantiers(nom)
          `)
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        const formattedPhotos: Photo[] = (data || []).map(item => ({
          id: item.id,
          url: item.url,
          description: item.description,
          date: item.date,
          category: item.category || undefined,
          filename: item.filename || undefined,
          size: item.size_bytes || undefined,
          chantierId: item.chantier_id,
          chantierNom: item.chantiers ? (item.chantiers as any).nom : undefined
        }));
        
        setPhotos(formattedPhotos);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des photos:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('photos-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'photos' 
      }, () => {
        fetchPhotos();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    // Search term filter
    const matchesSearch = 
      photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.chantierNom && photo.chantierNom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (photo.filename && photo.filename.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Chantier filter
    const matchesChantier = chantierFilter === 'all' || photo.chantierId === chantierFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || photo.category === categoryFilter;
    
    // Date filter
    let matchesDate = true;
    if (isDateRangeFilterActive && dateRangeStart && dateRangeEnd) {
      // Custom date range filter
      const photoDate = new Date(photo.date);
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      endDate.setHours(23, 59, 59, 999);
      
      matchesDate = photoDate >= startDate && photoDate <= endDate;
    } else if (dateFilter !== 'all') {
      const today = new Date();
      const photoDate = new Date(photo.date);
      
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
          matchesDate = photoDate.getMonth() === today.getMonth() && 
                       photoDate.getFullYear() === today.getFullYear();
          break;
        case 'this_year':
          matchesDate = photoDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesChantier && matchesCategory && matchesDate;
  });

  // CRUD operations
  const handleAddPhoto = async () => {
    if (!newPhotoUrl || !newPhotoDescription || !newPhotoDate || !newPhotoChantier) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert({
          url: newPhotoUrl,
          description: newPhotoDescription,
          date: newPhotoDate,
          category: newPhotoCategory,
          chantier_id: newPhotoChantier,
          filename: newPhotoFilename || null,
          size_bytes: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Reset form
      setNewPhotoUrl('');
      setNewPhotoDescription('');
      setNewPhotoCategory('avancement');
      setNewPhotoDate(new Date().toISOString().split('T')[0]);
      setNewPhotoChantier('');
      setNewPhotoFilename('');
      
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la photo:', err);
      alert('Erreur lors de l\'ajout de la photo');
    }
  };

  const handleUpdatePhoto = async () => {
    if (!selectedPhoto) return;
    
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          description: selectedPhoto.description,
          category: selectedPhoto.category,
          date: selectedPhoto.date,
          chantier_id: selectedPhoto.chantierId
        })
        .eq('id', selectedPhoto.id);
      
      if (error) throw error;
      
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la photo:', err);
      alert('Erreur lors de la mise à jour de la photo');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;
    
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Close modal if the deleted photo is the selected one
      if (selectedPhoto && selectedPhoto.id === id) {
        setIsViewModalOpen(false);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la photo:', err);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  // Helper functions
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

  const getChantierName = (chantierId?: string) => {
    if (!chantierId || !chantiers) return 'Non assigné';
    const chantier = chantiers.find(c => c.id === chantierId);
    return chantier ? chantier.nom : 'Non assigné';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiée dans le presse-papiers');
  };

  // Navigation in gallery view
  const navigateGallery = (direction: 'prev' | 'next') => {
    if (filteredPhotos.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    } else {
      setCurrentPhotoIndex(prev => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    }
    
    setSelectedPhoto(filteredPhotos[currentPhotoIndex]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const galleryElement = document.getElementById('photo-gallery-fullscreen');
      if (galleryElement) {
        galleryElement.requestFullscreen().catch(err => {
          console.error(`Erreur lors du passage en plein écran: ${err.message}`);
        });
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Component for the photo gallery
  const PhotoGallery = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredPhotos.map((photo, index) => (
        <div 
          key={photo.id} 
          className="relative group overflow-hidden rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setSelectedPhoto(photo);
            setCurrentPhotoIndex(index);
            setIsViewModalOpen(true);
          }}
        >
          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
            <img 
              src={photo.url} 
              alt={photo.description} 
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{photo.description}</h3>
                <p className="text-xs text-gray-500 mt-1 truncate">{getChantierName(photo.chantierId)}</p>
              </div>
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(photo.category)}`}>
                {getCategoryLabel(photo.category)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(photo.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
      {filteredPhotos.length === 0 && !loading && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
          <Image className="w-16 h-16 text-gray-300 mb-4" />
          <p>Aucune photo trouvée</p>
          <p className="text-sm mt-2">Ajustez les filtres ou ajoutez de nouvelles photos</p>
        </div>
      )}
    </div>
  );

  // Component for the photo list view
  const PhotoList = () => (
    <div className="overflow-x-auto">
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
          {filteredPhotos.map((photo, index) => (
            <tr key={photo.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={photo.description} 
                    className="h-16 w-16 object-cover"
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
                  <span className="text-sm text-gray-900">{getChantierName(photo.chantierId)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {getCategoryLabel(photo.category)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(photo.date).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                      setCurrentPhotoIndex(index);
                      setIsViewModalOpen(true);
                    }}
                    className="text-green-600 hover:text-green-900"
                    title="Voir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                      setIsEditModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
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
      {filteredPhotos.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p>Aucune photo trouvée</p>
          <p className="text-sm mt-2">Ajustez les filtres ou ajoutez de nouvelles photos</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Photos</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une Photo
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsGalleryView(!isGalleryView)}
          >
            {isGalleryView ? (
              <>
                <List className="w-4 h-4 mr-2" />
                Vue Liste
              </>
            ) : (
              <>
                <Grid className="w-4 h-4 mr-2" />
                Vue Galerie
              </>
            )}
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="secondary" onClick={() => {
            if (filteredPhotos.length === 0) {
              alert('Aucune photo à télécharger');
              return;
            }
            
            // Create a text file with all photo URLs
            const photoList = filteredPhotos.map(photo => 
              `${photo.description} (${getChantierName(photo.chantierId)}): ${photo.url}`
            ).join('\n\n');
            
            const blob = new Blob([photoList], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photos-export-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}>
            <Share2 className="w-4 h-4 mr-2" />
            Télécharger URLs
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
          
          <div className="flex flex-wrap gap-2">
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
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== 'custom') {
                  setIsDateRangeFilterActive(false);
                } else {
                  setIsDateRangeFilterActive(true);
                  // Initialize date range if empty
                  if (!dateRangeStart) {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setDateRangeStart(firstDayOfMonth.toISOString().split('T')[0]);
                    setDateRangeEnd(today.toISOString().split('T')[0]);
                  }
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois</option>
              <option value="this_year">Cette année</option>
              <option value="custom">Plage personnalisée</option>
            </select>
          </div>
        </div>
        
        {/* Custom date range */}
        {isDateRangeFilterActive && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date début</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date fin</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Photos</p>
              <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Image className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers avec Photos</p>
              <p className="text-2xl font-bold text-green-600">
                {new Set(photos.map(p => p.chantierId).filter(Boolean)).size}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Photos ce mois</p>
              <p className="text-2xl font-bold text-purple-600">
                {photos.filter(p => {
                  const photoDate = new Date(p.date);
                  const today = new Date();
                  return photoDate.getMonth() === today.getMonth() && 
                         photoDate.getFullYear() === today.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Catégories</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(photos.map(p => p.category).filter(Boolean)).size}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Photos content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} trouvée{filteredPhotos.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsGalleryView(true)}
                className={`p-2 rounded ${isGalleryView ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Vue galerie"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsGalleryView(false)}
                className={`p-2 rounded ${!isGalleryView ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Vue liste"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des photos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>Erreur lors du chargement des photos</p>
              <p className="text-sm">{error.message}</p>
            </div>
          ) : (
            isGalleryView ? <PhotoGallery /> : <PhotoList />
          )}
        </div>
      </div>

      {/* Add Photo Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une nouvelle photo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
            <div className="flex">
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                title="Téléverser une image"
              >
                <Upload className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Entrez l'URL d'une image existante ou utilisez le bouton de téléversement
            </p>
          </div>
          
          {newPhotoUrl && (
            <div className="border rounded-md p-2 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Aperçu :</p>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded overflow-hidden">
                <img 
                  src={newPhotoUrl} 
                  alt="Aperçu" 
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=URL+invalide';
                  }}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newPhotoDescription}
              onChange={(e) => setNewPhotoDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description de la photo..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
              <select
                value={newPhotoChantier}
                onChange={(e) => setNewPhotoChantier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un chantier</option>
                {chantiers?.map(chantier => (
                  <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={newPhotoCategory || 'avancement'}
                onChange={(e) => setNewPhotoCategory(e.target.value as Photo['category'])}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newPhotoDate}
                onChange={(e) => setNewPhotoDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier (optionnel)</label>
              <input
                type="text"
                value={newPhotoFilename}
                onChange={(e) => setNewPhotoFilename(e.target.value)}
                placeholder="nom-du-fichier.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleAddPhoto}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </Modal>

      {/* Edit Photo Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la photo"
        size="lg"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description} 
                className="object-contain w-full h-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={selectedPhoto.description}
                onChange={(e) => setSelectedPhoto({...selectedPhoto, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
                <select
                  value={selectedPhoto.chantierId || ''}
                  onChange={(e) => setSelectedPhoto({...selectedPhoto, chantierId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un chantier</option>
                  {chantiers?.map(chantier => (
                    <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={selectedPhoto.category || 'avancement'}
                  onChange={(e) => setSelectedPhoto({...selectedPhoto, category: e.target.value as Photo['category']})}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedPhoto.date}
                onChange={(e) => setSelectedPhoto({...selectedPhoto, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informations du fichier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">URL:</span>
                  <div className="flex items-center mt-1">
                    <input
                      type="text"
                      value={selectedPhoto.url}
                      readOnly
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedPhoto.url)}
                      className="px-2 py-1 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Nom du fichier:</span>
                  <p className="font-medium">{selectedPhoto.filename || 'Non spécifié'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Taille:</span>
                  <p className="font-medium">{formatFileSize(selectedPhoto.size)}</p>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span>
                  <p className="font-medium text-xs">{selectedPhoto.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => selectedPhoto && handleDeletePhoto(selectedPhoto.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button onClick={handleUpdatePhoto}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </Modal>

      {/* View Photo Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedPhoto?.description || 'Visualisation de la photo'}
        size="xl"
      >
        {selectedPhoto && (
          <div id="photo-gallery-fullscreen" className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description} 
                className="mx-auto max-h-[70vh] object-contain"
              />
              
              {/* Navigation controls */}
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateGallery('prev');
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateGallery('next');
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
              
              {/* Fullscreen toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPhoto.description}</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">{getChantierName(selectedPhoto.chantierId)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">{new Date(selectedPhoto.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="w-5 h-5 text-gray-400 mr-2" />
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedPhoto.category)}`}>
                      {getCategoryLabel(selectedPhoto.category)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  Informations techniques
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom du fichier:</span>
                    <span className="text-gray-900 font-medium">{selectedPhoto.filename || 'Non spécifié'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taille:</span>
                    <span className="text-gray-900 font-medium">{formatFileSize(selectedPhoto.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="text-gray-900 font-medium text-xs">{selectedPhoto.id}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-gray-600 block mb-1">URL:</span>
                    <div className="flex">
                      <input
                        type="text"
                        value={selectedPhoto.url}
                        readOnly
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-l-md bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(selectedPhoto.url)}
                        className="px-2 py-1 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        title="Copier l'URL"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Thumbnails navigation */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Autres photos ({filteredPhotos.length})</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {filteredPhotos.map((photo, index) => (
                  <div 
                    key={photo.id}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 cursor-pointer ${
                      currentPhotoIndex === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setCurrentPhotoIndex(index);
                    }}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.description} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => window.open(selectedPhoto.url, '_blank')}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => window.open(selectedPhoto.url, '_blank')}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    // Create a download link
                    const a = document.createElement('a');
                    a.href = selectedPhoto.url;
                    a.download = selectedPhoto.filename || `photo-${selectedPhoto.id}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => {
                    handleDeletePhoto(selectedPhoto.id);
                    setIsViewModalOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// These components are defined here to avoid importing from lucide-react
// since they're not exported in the import statement at the top
const Grid: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const List: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);