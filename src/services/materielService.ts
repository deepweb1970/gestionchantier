import { supabase } from '../lib/supabase';
import type { Materiel } from '../types';
import type { Database } from '../types/supabase';

type MaterielRow = Database['public']['Tables']['materiel']['Row'];
type MaterielInsert = Database['public']['Tables']['materiel']['Insert'];
type MaterielUpdate = Database['public']['Tables']['materiel']['Update'];

// Convertir le format de la base de données vers le format de l'application
const toMateriel = (row: MaterielRow): Materiel => ({
  id: row.id,
  nom: row.nom,
  type: row.type,
  marque: row.marque,
  modele: row.modele,
  numeroSerie: row.numero_serie,
  dateAchat: row.date_achat,
  valeur: row.valeur,
  statut: row.statut,
  prochaineMaintenance: row.prochaine_maintenance || undefined,
  localisation: row.localisation || undefined,
  tarifHoraire: row.tarif_horaire || undefined
});

// Convertir le format de l'application vers le format de la base de données
const toMaterielInsert = (materiel: Omit<Materiel, 'id'>): MaterielInsert => ({
  nom: materiel.nom,
  type: materiel.type,
  marque: materiel.marque,
  modele: materiel.modele,
  numero_serie: materiel.numeroSerie,
  date_achat: materiel.dateAchat,
  valeur: materiel.valeur,
  statut: materiel.statut,
  prochaine_maintenance: materiel.prochaineMaintenance || null,
  localisation: materiel.localisation || null,
  tarif_horaire: materiel.tarifHoraire || null
});

const toMaterielUpdate = (materiel: Partial<Omit<Materiel, 'id'>>): MaterielUpdate => {
  const update: MaterielUpdate = {};
  
  if (materiel.nom !== undefined) update.nom = materiel.nom;
  if (materiel.type !== undefined) update.type = materiel.type;
  if (materiel.marque !== undefined) update.marque = materiel.marque;
  if (materiel.modele !== undefined) update.modele = materiel.modele;
  if (materiel.numeroSerie !== undefined) update.numero_serie = materiel.numeroSerie;
  if (materiel.dateAchat !== undefined) update.date_achat = materiel.dateAchat;
  if (materiel.valeur !== undefined) update.valeur = materiel.valeur;
  if (materiel.statut !== undefined) update.statut = materiel.statut;
  if (materiel.prochaineMaintenance !== undefined) update.prochaine_maintenance = materiel.prochaineMaintenance || null;
  if (materiel.localisation !== undefined) update.localisation = materiel.localisation || null;
  if (materiel.tarifHoraire !== undefined) update.tarif_horaire = materiel.tarifHoraire || null;
  
  return update;
};

export const materielService = {
  async getAll(): Promise<Materiel[]> {
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .order('nom');
    
    if (error) {
      console.error('Erreur lors de la récupération du matériel:', error);
      throw error;
    }
    
    return (data || []).map(toMateriel);
  },
  
  async getById(id: string): Promise<Materiel | null> {
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Matériel non trouvé
      }
      console.error(`Erreur lors de la récupération du matériel ${id}:`, error);
      throw error;
    }
    
    return data ? toMateriel(data) : null;
  },
  
  async create(materiel: Omit<Materiel, 'id'>): Promise<Materiel> {
    const { data, error } = await supabase
      .from('materiel')
      .insert(toMaterielInsert(materiel))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du matériel:', error);
      throw error;
    }
    
    return toMateriel(data);
  },
  
  async update(id: string, materiel: Partial<Omit<Materiel, 'id'>>): Promise<Materiel> {
    const { data, error } = await supabase
      .from('materiel')
      .update(toMaterielUpdate(materiel))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du matériel ${id}:`, error);
      throw error;
    }
    
    return toMateriel(data);
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('materiel')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression du matériel ${id}:`, error);
      throw error;
    }
  },
  
  async getByStatut(statut: Materiel['statut']): Promise<Materiel[]> {
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .eq('statut', statut)
      .order('nom');
    
    if (error) {
      console.error(`Erreur lors de la récupération du matériel avec statut ${statut}:`, error);
      throw error;
    }
    
    return (data || []).map(toMateriel);
  },
  
  async getByLocalisation(localisation: string): Promise<Materiel[]> {
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .eq('localisation', localisation)
      .order('nom');
    
    if (error) {
      console.error(`Erreur lors de la récupération du matériel à ${localisation}:`, error);
      throw error;
    }
    
    return (data || []).map(toMateriel);
  }
};