import { supabase } from '../lib/supabase';
import type { Chantier, Photo } from '../types';
import type { Database } from '../types/supabase';
import { clientService } from './clientService';

type ChantierRow = Database['public']['Tables']['chantiers']['Row'];
type ChantierInsert = Database['public']['Tables']['chantiers']['Insert'];
type ChantierUpdate = Database['public']['Tables']['chantiers']['Update'];
type PhotoRow = Database['public']['Tables']['photos']['Row'];

// Convertir le format de la base de données vers le format de l'application
const toChantier = (row: ChantierRow, photos: Photo[] = []): Chantier => ({
  id: row.id,
  nom: row.nom,
  description: row.description,
  client: '', // À remplir séparément avec le nom du client
  adresse: row.adresse,
  dateDebut: row.date_debut,
  dateFin: row.date_fin || undefined,
  statut: row.statut,
  avancement: row.avancement || 0,
  budget: row.budget || 0,
  heuresOuvriersTotal: row.heures_ouvriers_total || 0,
  heuresMaterielTotal: row.heures_materiel_total || 0,
  coutMainOeuvre: row.cout_main_oeuvre || 0,
  coutMateriel: row.cout_materiel || 0,
  photos: photos,
  coordinates: row.latitude && row.longitude 
    ? { lat: row.latitude, lng: row.longitude } 
    : undefined
});

// Convertir le format de l'application vers le format de la base de données
const toChantierInsert = (chantier: Omit<Chantier, 'id' | 'client' | 'photos'>, clientId: string): ChantierInsert => ({
  nom: chantier.nom,
  description: chantier.description,
  client_id: clientId,
  adresse: chantier.adresse,
  date_debut: chantier.dateDebut,
  date_fin: chantier.dateFin || null,
  statut: chantier.statut,
  avancement: chantier.avancement,
  budget: chantier.budget,
  latitude: chantier.coordinates?.lat || null,
  longitude: chantier.coordinates?.lng || null
});

const toChantierUpdate = (chantier: Partial<Omit<Chantier, 'id' | 'client' | 'photos'>>, clientId?: string): ChantierUpdate => {
  const update: ChantierUpdate = {};
  
  if (chantier.nom !== undefined) update.nom = chantier.nom;
  if (chantier.description !== undefined) update.description = chantier.description;
  if (clientId !== undefined) update.client_id = clientId;
  if (chantier.adresse !== undefined) update.adresse = chantier.adresse;
  if (chantier.dateDebut !== undefined) update.date_debut = chantier.dateDebut;
  if (chantier.dateFin !== undefined) update.date_fin = chantier.dateFin || null;
  if (chantier.statut !== undefined) update.statut = chantier.statut;
  if (chantier.avancement !== undefined) update.avancement = chantier.avancement;
  if (chantier.budget !== undefined) update.budget = chantier.budget;
  if (chantier.coordinates !== undefined) {
    update.latitude = chantier.coordinates?.lat || null;
    update.longitude = chantier.coordinates?.lng || null;
  }
  
  return update;
};

// Convertir le format de la base de données vers le format de l'application pour les photos
const toPhoto = (row: PhotoRow): Photo => ({
  id: row.id,
  url: row.url,
  description: row.description,
  date: row.date,
  category: row.category || undefined,
  filename: row.filename || undefined,
  size: row.size_bytes || undefined
});

export const chantierService = {
  getAll: async (): Promise<Chantier[]> => {
    // Récupérer les chantiers avec les clients et les photos
    const { data, error } = await supabase
      .from('chantiers')
      .select(`
        *,
        clients(nom),
        photos(*)
      `)
      .order('date_debut', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des chantiers:', error);
      throw error;
    }
    
    return (data || []).map(item => {
      const chantier = toChantier(item);
      
      // Ajouter le nom du client
      if (item.clients) {
        chantier.client = (item.clients as any).nom || '';
      }
      
      // Ajouter les photos
      if (item.photos) {
        chantier.photos = (item.photos as any[]).map(toPhoto);
      }
      
      return chantier;
    });
  },
  
  getById: async (id: string): Promise<Chantier | null> => {
    const { data, error } = await supabase
      .from('chantiers')
      .select(`
        *,
        clients(nom),
        photos(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Chantier non trouvé
      }
      console.error(`Erreur lors de la récupération du chantier ${id}:`, error);
      throw error;
    }
    
    if (!data) return null;
    
    const chantier = toChantier(data);
    
    // Ajouter le nom du client
    if (data.clients) {
      chantier.client = (data.clients as any).nom || '';
    }
    
    // Ajouter les photos
    if (data.photos) {
      chantier.photos = (data.photos as any[]).map(toPhoto);
    }
    
    return chantier;
  },
  
  create: async (chantier: Omit<Chantier, 'id' | 'client' | 'photos'>, clientId: string): Promise<Chantier> => {
    const { data, error } = await supabase
      .from('chantiers')
      .insert(toChantierInsert(chantier, clientId))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du chantier:', error);
      throw error;
    }
    
    return toChantier(data);
  },
  
  update: async (id: string, chantier: Partial<Omit<Chantier, 'id' | 'client' | 'photos'>>, clientId?: string): Promise<Chantier> => {
    const { data, error } = await supabase
      .from('chantiers')
      .update(toChantierUpdate(chantier, clientId))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du chantier ${id}:`, error);
      throw error;
    }
    
    return toChantier(data);
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('chantiers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression du chantier ${id}:`, error);
      throw error;
    }
  },
  
  // Méthodes pour les photos
  addPhoto: async (chantierId: string, photo: Omit<Photo, 'id'>): Promise<Photo> => {
    const { data, error } = await supabase
      .from('photos')
      .insert({
        chantier_id: chantierId,
        url: photo.url,
        description: photo.description,
        date: photo.date,
        category: photo.category || 'avancement',
        filename: photo.filename || null,
        size_bytes: photo.size || null
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de l'ajout d'une photo au chantier ${chantierId}:`, error);
      throw error;
    }
    
    return toPhoto(data);
  },
  
  deletePhoto: async (photoId: string): Promise<void> => {
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la photo ${photoId}:`, error);
      throw error;
    }
  },
  
  updatePhoto: async (photoId: string, updates: Partial<Omit<Photo, 'id'>>): Promise<Photo> => {
    const updateData: any = {};
    
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    
    const { data, error } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la photo ${photoId}:`, error);
      throw error;
    }
    
    return toPhoto(data);
  }
};