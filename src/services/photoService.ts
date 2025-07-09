import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Photo = Database['public']['Tables']['photos']['Row'];
type PhotoInsert = Database['public']['Tables']['photos']['Insert'];
type PhotoUpdate = Database['public']['Tables']['photos']['Update'];

export class PhotoService {
  static async getByChantier(chantierId: string): Promise<Photo[]> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des photos:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erreur dans PhotoService.getByChantier:', error);
      throw error;
    }
  }

  static async getAll(): Promise<Photo[]> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération de toutes les photos:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erreur dans PhotoService.getAll:', error);
      throw error;
    }
  }

  static async create(photo: PhotoInsert): Promise<Photo> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert(photo)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création de la photo:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Aucune donnée retournée lors de la création de la photo');
      }
      
      return data;
    } catch (error) {
      console.error('Erreur dans PhotoService.create:', error);
      throw error;
    }
  }

  static async update(id: string, photo: PhotoUpdate): Promise<Photo> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update(photo)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la mise à jour de la photo:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Aucune donnée retournée lors de la mise à jour de la photo');
      }
      
      return data;
    } catch (error) {
      console.error('Erreur dans PhotoService.update:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la suppression de la photo:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans PhotoService.delete:', error);
      throw error;
    }
  }
}