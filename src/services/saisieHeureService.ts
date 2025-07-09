import { supabase } from '../lib/supabase';
import type { SaisieHeure, SimpleSaisieHeure } from '../types';
import type { Database } from '../types/supabase';

type SaisieHeureRow = Database['public']['Tables']['saisies_heures']['Row'];
type SaisieHeureInsert = Database['public']['Tables']['saisies_heures']['Insert'];
type SaisieHeureUpdate = Database['public']['Tables']['saisies_heures']['Update'];

// Convertir le format de la base de données vers le format de l'application
const toSaisieHeure = (row: SaisieHeureRow): SaisieHeure => ({
  id: row.id,
  ouvrierId: row.ouvrier_id || '',
  chantierId: row.chantier_id || '',
  materielId: row.materiel_id || undefined,
  date: row.date,
  heureDebut: row.heure_debut,
  heureFin: row.heure_fin,
  heureTable: row.heure_table || undefined,
  heuresNormales: row.heures_normales,
  heuresSupplementaires: row.heures_supplementaires,
  heuresExceptionnelles: row.heures_exceptionnelles || 0,
  description: row.description,
  valide: row.valide || false,
  parametresId: row.parametres_id || undefined
});

// Convertir le format simplifié vers le format de la base de données
const toSaisieHeureInsert = (saisie: SimpleSaisieHeure): SaisieHeureInsert => ({
  ouvrier_id: saisie.ouvrierId,
  chantier_id: saisie.chantierId,
  materiel_id: saisie.materielId || null,
  date: saisie.date,
  heure_debut: saisie.heureDebut,
  heure_fin: saisie.heureFin,
  heure_table: saisie.heureTable || null,
  heures_normales: saisie.heuresTotal, // Pour compatibilité avec l'ancien système
  heures_supplementaires: 0, // Plus d'heures supplémentaires
  heures_exceptionnelles: 0, // Plus d'heures exceptionnelles
  heures_total: saisie.heuresTotal, // Nouveau champ pour le total
  description: saisie.description,
  valide: saisie.valide
});

const toSaisieHeureUpdate = (saisie: Partial<SimpleSaisieHeure>): SaisieHeureUpdate => {
  const update: SaisieHeureUpdate = {};
  
  if (saisie.ouvrierId !== undefined) update.ouvrier_id = saisie.ouvrierId;
  if (saisie.chantierId !== undefined) update.chantier_id = saisie.chantierId;
  if (saisie.materielId !== undefined) update.materiel_id = saisie.materielId || null;
  if (saisie.date !== undefined) update.date = saisie.date;
  if (saisie.heureDebut !== undefined) update.heure_debut = saisie.heureDebut;
  if (saisie.heureFin !== undefined) update.heure_fin = saisie.heureFin;
  if (saisie.heureTable !== undefined) update.heure_table = saisie.heureTable || null;
  if (saisie.heuresTotal !== undefined) {
    update.heures_normales = saisie.heuresTotal;
    update.heures_supplementaires = 0;
    update.heures_exceptionnelles = 0;
    update.heures_total = saisie.heuresTotal;
  }
  if (saisie.description !== undefined) update.description = saisie.description;
  if (saisie.valide !== undefined) update.valide = saisie.valide;
  
  return update;
};

export const saisieHeureService = {
  getAll: async (): Promise<SaisieHeure[]> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .select(`
        *,
        ouvriers(nom, prenom),
        chantiers(nom),
        materiel(nom)
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des saisies d\'heures:', error);
      throw error;
    }
    
    return (data || []).map(toSaisieHeure);
  },
  
  getById: async (id: string): Promise<SaisieHeure | null> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .select(`
        *,
        ouvriers(nom, prenom),
        chantiers(nom),
        materiel(nom)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Saisie non trouvée
      }
      console.error(`Erreur lors de la récupération de la saisie ${id}:`, error);
      throw error;
    }
    
    return data ? toSaisieHeure(data) : null;
  },
  
  create: async (saisie: SimpleSaisieHeure): Promise<SaisieHeure> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .insert(toSaisieHeureInsert(saisie))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la saisie d\'heures:', error);
      throw error;
    }
    
    return toSaisieHeure(data);
  },
  
  update: async (id: string, saisie: Partial<SimpleSaisieHeure>): Promise<SaisieHeure> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .update(toSaisieHeureUpdate(saisie))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la saisie ${id}:`, error);
      throw error;
    }
    
    return toSaisieHeure(data);
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('saisies_heures')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la saisie ${id}:`, error);
      throw error;
    }
  },
  
  validateMany: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from('saisies_heures')
      .update({ valide: true })
      .in('id', ids);
    
    if (error) {
      console.error(`Erreur lors de la validation des saisies:`, error);
      throw error;
    }
  },
  
  getByOuvrier: async (ouvrierId: string): Promise<SaisieHeure[]> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .select(`
        *,
        ouvriers(nom, prenom),
        chantiers(nom),
        materiel(nom)
      `)
      .eq('ouvrier_id', ouvrierId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des saisies pour l'ouvrier ${ouvrierId}:`, error);
      throw error;
    }
    
    return (data || []).map(toSaisieHeure);
  },
  
  getByChantier: async (chantierId: string): Promise<SaisieHeure[]> => {
    const { data, error } = await supabase
      .from('saisies_heures')
      .select(`
        *,
        ouvriers(nom, prenom),
        chantiers(nom),
        materiel(nom)
      `)
      .eq('chantier_id', chantierId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des saisies pour le chantier ${chantierId}:`, error);
      throw error;
    }
    
    return (data || []).map(toSaisieHeure);
  }
};