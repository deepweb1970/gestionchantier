import { supabase } from '../lib/supabase';
import type { Facture, FactureItem } from '../types';
import type { Database } from '../types/supabase';

type FactureRow = Database['public']['Tables']['factures']['Row'];
type FactureInsert = Database['public']['Tables']['factures']['Insert'];
type FactureUpdate = Database['public']['Tables']['factures']['Update'];
type FactureItemRow = Database['public']['Tables']['facture_items']['Row'];
type FactureItemInsert = Database['public']['Tables']['facture_items']['Insert'];

// Convertir le format de la base de données vers le format de l'application
const toFacture = (row: FactureRow, items: FactureItem[] = []): Facture => ({
  id: row.id,
  numero: row.numero,
  clientId: row.client_id || '',
  chantierId: row.chantier_id || '',
  dateEmission: row.date_emission,
  dateEcheance: row.date_echeance,
  montantHT: row.montant_ht,
  tva: row.tva,
  montantTTC: row.montant_ttc,
  statut: row.statut,
  items: items
});

// Convertir le format de l'application vers le format de la base de données
const toFactureInsert = (facture: Omit<Facture, 'id' | 'items'>): FactureInsert => ({
  numero: facture.numero,
  client_id: facture.clientId,
  chantier_id: facture.chantierId || null,
  date_emission: facture.dateEmission,
  date_echeance: facture.dateEcheance,
  montant_ht: facture.montantHT,
  tva: facture.tva,
  montant_ttc: facture.montantTTC,
  statut: facture.statut
});

const toFactureUpdate = (facture: Partial<Omit<Facture, 'id' | 'items'>>): FactureUpdate => {
  const update: FactureUpdate = {};
  
  if (facture.numero !== undefined) update.numero = facture.numero;
  if (facture.clientId !== undefined) update.client_id = facture.clientId;
  if (facture.chantierId !== undefined) update.chantier_id = facture.chantierId || null;
  if (facture.dateEmission !== undefined) update.date_emission = facture.dateEmission;
  if (facture.dateEcheance !== undefined) update.date_echeance = facture.dateEcheance;
  if (facture.montantHT !== undefined) update.montant_ht = facture.montantHT;
  if (facture.tva !== undefined) update.tva = facture.tva;
  if (facture.montantTTC !== undefined) update.montant_ttc = facture.montantTTC;
  if (facture.statut !== undefined) update.statut = facture.statut;
  
  return update;
};

// Convertir le format de la base de données vers le format de l'application pour les items
const toFactureItem = (row: FactureItemRow): FactureItem => ({
  id: row.id,
  description: row.description,
  quantite: row.quantite,
  prixUnitaire: row.prix_unitaire,
  total: row.total
});

// Convertir le format de l'application vers le format de la base de données pour les items
const toFactureItemInsert = (item: Omit<FactureItem, 'id'>, factureId: string): FactureItemInsert => ({
  facture_id: factureId,
  description: item.description,
  quantite: item.quantite,
  prix_unitaire: item.prixUnitaire,
  total: item.total
});

export const factureService = {
  getAll: async (): Promise<Facture[]> => {
    // Récupérer les factures avec les items
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_items(*)
      `)
      .order('date_emission', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      throw error;
    }
    
    return (data || []).map(item => {
      const facture = toFacture(item);
      
      // Ajouter les items
      if (item.facture_items) {
        facture.items = (item.facture_items as any[]).map(toFactureItem);
      }
      
      return facture;
    });
  },
  
  getById: async (id: string): Promise<Facture | null> => {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Facture non trouvée
      }
      console.error(`Erreur lors de la récupération de la facture ${id}:`, error);
      throw error;
    }
    
    if (!data) return null;
    
    const facture = toFacture(data);
    
    // Ajouter les items
    if (data.facture_items) {
      facture.items = (data.facture_items as any[]).map(toFactureItem);
    }
    
    return facture;
  },
  
  create: async (facture: Omit<Facture, 'id'>, items: Omit<FactureItem, 'id'>[] = []): Promise<Facture> => {
    // Créer la facture
    const { data: factureData, error: factureError } = await supabase
      .from('factures')
      .insert(toFactureInsert(facture))
      .select()
      .single();
    
    if (factureError) {
      console.error('Erreur lors de la création de la facture:', factureError);
      throw factureError;
    }
    
    // Créer les items de la facture
    if (items.length > 0) {
      const itemsToInsert = items.map(item => toFactureItemInsert(item, factureData.id));
      
      const { error: itemsError } = await supabase
        .from('facture_items')
        .insert(itemsToInsert);
      
      if (itemsError) {
        console.error('Erreur lors de la création des items de la facture:', itemsError);
        // Supprimer la facture créée pour éviter les incohérences
        await supabase.from('factures').delete().eq('id', factureData.id);
        throw itemsError;
      }
    }
    
    // Récupérer la facture complète avec ses items
    return this.getById(factureData.id) as Promise<Facture>;
  },
  
  update: async (id: string, facture: Partial<Omit<Facture, 'id' | 'items'>>): Promise<Facture> => {
    const { data, error } = await supabase
      .from('factures')
      .update(toFactureUpdate(facture))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la facture ${id}:`, error);
      throw error;
    }
    
    // Récupérer la facture complète avec ses items
    return this.getById(data.id) as Promise<Facture>;
  },
  
  delete: async (id: string): Promise<void> => {
    // Les items seront supprimés automatiquement grâce à la contrainte ON DELETE CASCADE
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la facture ${id}:`, error);
      throw error;
    }
  },
  
  // Méthodes pour les items de facture
  addItem: async (factureId: string, item: Omit<FactureItem, 'id'>): Promise<FactureItem> => {
    const { data, error } = await supabase
      .from('facture_items')
      .insert(toFactureItemInsert(item, factureId))
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de l'ajout d'un item à la facture ${factureId}:`, error);
      throw error;
    }
    
    return toFactureItem(data);
  },
  
  updateItem: async (itemId: string, updates: Partial<Omit<FactureItem, 'id'>>): Promise<FactureItem> => {
    const updateData: any = {};
    
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.quantite !== undefined) updateData.quantite = updates.quantite;
    if (updates.prixUnitaire !== undefined) updateData.prix_unitaire = updates.prixUnitaire;
    if (updates.total !== undefined) updateData.total = updates.total;
    
    const { data, error } = await supabase
      .from('facture_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'item ${itemId}:`, error);
      throw error;
    }
    
    return toFactureItem(data);
  },
  
  deleteItem: async (itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('facture_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error(`Erreur lors de la suppression de l'item ${itemId}:`, error);
      throw error;
    }
  },
  
  getByClient: async (clientId: string): Promise<Facture[]> => {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_items(*)
      `)
      .eq('client_id', clientId)
      .order('date_emission', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des factures du client ${clientId}:`, error);
      throw error;
    }
    
    return (data || []).map(item => {
      const facture = toFacture(item);
      
      // Ajouter les items
      if (item.facture_items) {
        facture.items = (item.facture_items as any[]).map(toFactureItem);
      }
      
      return facture;
    });
  },
  
  getByChantier: async (chantierId: string): Promise<Facture[]> => {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_items(*)
      `)
      .eq('chantier_id', chantierId)
      .order('date_emission', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des factures du chantier ${chantierId}:`, error);
      throw error;
    }
    
    return (data || []).map(item => {
      const facture = toFacture(item);
      
      // Ajouter les items
      if (item.facture_items) {
        facture.items = (item.facture_items as any[]).map(toFactureItem);
      }
      
      return facture;
    });
  },
  
  getByStatut: async (statut: Facture['statut']): Promise<Facture[]> => {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        facture_items(*)
      `)
      .eq('statut', statut)
      .order('date_emission', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des factures avec statut ${statut}:`, error);
      throw error;
    }
    
    return (data || []).map(item => {
      const facture = toFacture(item);
      
      // Ajouter les items
      if (item.facture_items) {
        facture.items = (item.facture_items as any[]).map(toFactureItem);
      }
      
      return facture;
    });
  }
};