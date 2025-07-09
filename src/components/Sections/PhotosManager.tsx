import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Image, Search, Filter, Download, Upload, Eye, Calendar, Tag, Unlink, Building2, Check, X, Info } from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { supabase } from '../../lib/supabase';

export const PhotosManager: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { data: chantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chantierFilter, setChantierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Form state (not synchronized until save)
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoDescription, setNewPhotoDescription] = useState('');
  const [newPhotoDate, setNewPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPhotoCategory, setNewPhotoCategory] = useState<Photo['category']>('avancement');
  const [newPhotoChantier, setNewPhotoChantier] = useState('');
  const [newPhotoFilename, setNewPhotoFilename] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos
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
        chantierId: item.chantier_id || undefined,
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

  // Set up realtime subscription
  useEffect(() => {
    fetchPhotos();
    
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

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (photo.chantierNom && photo.chantierNom.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || photo.category === categoryFilter;
    const matchesChantier = chantierFilter === 'all' || photo.chantierId === chantierFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const photoDate = new Date(photo.date);
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      const lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 30);
      
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

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setNewPhotoUrl(photo.url);
    setNewPhotoDescription(photo.description);
    setNewPhotoDate(photo.date);
    setNewPhotoCategory(photo.category || 'avancement');
    setNewPhotoChantier(photo.chantierId || '');
    setNewPhotoFilename(photo.filename || '');
    setIsModalOpen(true);
  };

  const handleView = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      try {
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh will happen automatically via realtime subscription
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la photo');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setNewPhotoFilename(file.name);
      
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

  const handleUpload = async () => {
    if (!uploadedFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${uploadedFile.name}`;
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(data.path);
      
      setNewPhotoUrl(publicUrl);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de la photo');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const photoData = {
        url: newPhotoUrl,
        description: newPhotoDescription,
        date: newPhotoDate,
        category: newPhotoCategory,
        chantier_id: newPhotoChantier || null,
        filename: newPhotoFilename || null,
        size_bytes: uploadedFile ? uploadedFile.size : null
      };

      if (editingPhoto) {
        const { error } = await supabase
          .from('photos')
          .update(photoData)
          .eq('id', editingPhoto.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photos')
          .insert(photoData);
        
        if (error) throw error;
      }
      
      // Reset form
      setIsModalOpen(false);
      setEditingPhoto(null);
      setNewPhotoUrl('');
      setNewPhotoDescription('');
      setNewPhotoDate(new Date().toISOString().split('T')[0]);
      setNewPhotoCategory('avancement');
      setNewPhotoChantier('');
      setNewPhotoFilename('');
      setUploadedFile(null);
      
      // Refresh will happen automatically via realtime subscription
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la photo');
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'avancement': return 'Avancement';
      case 'probleme': return 'Problème';
      case 'materiel': return 'Matériel';
      case 'securite': return 'Sécurité';
      case 'finition': return 'Finition';
      case 'avant': return 'Avant';
      case 'apres': return 'Après';
      default: return 'Avancement';
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

  const PhotoForm = () => (
    <div className="space-y-6">
      {/* URL de la photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
        {newPhotoUrl ? (
          <div className="relative">
            <img 
              src={newPhotoUrl} 
              alt="Aperçu" 
              className="w-full h-64 object-cover rounded-lg border"
            />
            <button
              onClick={() => {
                setNewPhotoUrl('');
                setUploadedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              title="Supprimer l'image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-2"
            >
              <Upload className="w-4 h-4 mr-2 inline-block" />
              Sélectionner une image
            </button>
            <p className="text-sm text-gray-500">ou</p>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Upload: {uploadProgress}%</p>
          </div>
        )}
        
        {uploadedFile && !isUploading && (
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-600">{uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)</span>
            <Button 
              size="sm" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-1" />
              Uploader
            </Button>
          </div>
        )}
      </div>
      
      {/* Description */}
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
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={newPhotoDate}
            onChange={(e) => setNewPhotoDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Catégorie */}
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
      
      {/* Chantier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
        <select
          value={newPhotoChantier}
          onChange={(e) => setNewPhotoChantier(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Aucun chantier</option>
          {chantiers?.map(chantier => (
            <option key={chantier.id} value={chantier.id}>
              {chantier.nom}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!newPhotoUrl || !newPhotoDescription}
        >
          {editingPhoto ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </div>
  );

  const ViewPhotoModal = () => {
    if (!selectedPhoto) return null;
    
    const chantier = chantiers?.find(c => c.id === selectedPhoto.chantierId);
    
    return (
      <div className="space-y-6">
        <div className="relative">
          <img 
            src={selectedPhoto.url} 
            alt={selectedPhoto.description} 
            className="w-full rounded-lg"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <a 
              href={selectedPhoto.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              title="Ouvrir en plein écran"
            >
              <Eye className="w-4 h-4" />
            </a>
            <a 
              href={selectedPhoto.url} 
              download={selectedPhoto.filename || 'photo'}
              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedPhoto.category)}`}>
                {getCategoryLabel(selectedPhoto.category)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chantier</p>
              <p className="font-medium">{chantier?.nom || 'Aucun chantier'}</p>
            </div>
            {selectedPhoto.filename && (
              <div>
                <p className="text-sm text-gray-600">Nom du fichier</p>
                <p className="font-medium">{selectedPhoto.filename}</p>
              </div>
            )}
            {selectedPhoto.size && (
              <div>
                <p className="text-sm text-gray-600">Taille</p>
                <p className="font-medium">{Math.round(selectedPhoto.size / 1024)} KB</p>
              </div>
            )}
          </div>
        </div>
        
        {chantier && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Détails du chantier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Nom</p>
                <p className="font-medium text-blue-900">{chantier.nom}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Adresse</p>
                <p className="font-medium text-blue-900">{chantier.adresse}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Statut</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  chantier.statut === 'actif' ? 'bg-green-100 text-green-800' :
                  chantier.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                  chantier.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {chantier.statut === 'actif' ? 'Actif' :
                   chantier.statut === 'termine' ? 'Terminé' :
                   chantier.statut === 'pause' ? 'En pause' :
                   'Planifié'}
                </span>
              </div>
              <div>
                <p className="text-sm text-blue-700">Avancement</p>
                <div className="flex items-center">
                  <div className="w-full bg-blue-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${chantier.avancement}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-900">{chantier.avancement}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Photos</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Photo
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <select
                value={chantierFilter}
                onChange={(e) => setChantierFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les chantiers</option>
                {chantiers?.map(chantier => (
                  <option key={chantier.id} value={chantier.id}>
                    {chantier.nom}
                  </option>
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
            </div>
          </div>
        </div>

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
        ) : (
          <div className="p-4">
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-8">
                <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune photo trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map(photo => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div 
                      className="h-48 bg-gray-100 relative cursor-pointer"
                      onClick={() => handleView(photo)}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.description} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                          {getCategoryLabel(photo.category)}
                        </span>
                      </div>
                      {photo.chantierId && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {photo.chantierNom}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{photo.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(photo.date).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(photo)}
                            className="p-1 text-blue-600 hover:text-blue-900 rounded"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(photo.id)}
                            className="p-1 text-red-600 hover:text-red-900 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPhoto(null);
          setNewPhotoUrl('');
          setNewPhotoDescription('');
          setNewPhotoDate(new Date().toISOString().split('T')[0]);
          setNewPhotoCategory('avancement');
          setNewPhotoChantier('');
          setNewPhotoFilename('');
          setUploadedFile(null);
        }}
        title={editingPhoto ? 'Modifier la photo' : 'Nouvelle photo'}
        size="lg"
      >
        <PhotoForm />
      </Modal>

      {/* Modal de visualisation */}
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