import { supabase } from '../lib/supabase';
import type { Ouvrier, Document } from '../types';
import type { Database } from '../types/supabase';

type OuvrierRow = Database['public']['Tables']['ouvriers']['Row'];
type OuvrierInsert = Database['public']['Tables']['ouvriers']['Insert'];
type OuvrierUpdate = Database['public']['Tables']['ouvriers']['Update'];
type DocumentRow = Database['public']['Tables']['documents']['Row'];

// Convertir le format de la base de données vers le format de l'application
const toOuvrier = (row: OuvrierRow, documents: Document[] = []): Ouvrier => ({
  id: row.id,
  nom: row.nom,
  prenom: row.prenom,
  email: row.email,
  telephone: row.telephone,
  qualification: row.qualification,
  certifications: row.certifications || [],
  dateEmbauche: row.date_embauche,
  statut: row.statut,
  tauxHoraire: row.taux_horaire,
  adresse: row.adresse,
  documents: documents
});

// Convertir le format de l'application vers le format de la base de données
const toOuvrierInsert = (ouvrier: Omit<Ouvrier, 'id' | 'documents'>): OuvrierInsert => ({
  nom: ouvrier.nom,
  prenom: ouvrier.prenom,
  email: ouvrier.email,
  telephone: ouvrier.telephone,
  qualification: ouvrier.qualification,
  certifications: ouvrier.certifications,
  date_embauche: ouvrier.dateEmbauche,
  statut: ouvrier.statut,
  taux_horaire: ouvrier.tauxHoraire,
  adresse: ouvrier.adresse
});

const toOuvrierUpdate = (ouvrier: Partial<Omit<Ouvrier, 'id' | 'documents'>>): OuvrierUpdate => {
  const update: OuvrierUpdate = {};
  
  if (ouvrier.nom !== undefined) update.nom = ouvrier.nom;
  if (ouvrier.prenom !== undefined) update.prenom = ouvrier.prenom;
  if (ouvrier.email !== undefined) update.email = ouvrier.email;
  if (ouvrier.telephone !== undefined) update.telephone = ouvrier.telephone;
  if (ouvrier.qualification !== undefined) update.qualification = ouvrier.qualification;
  if (ouvrier.certifications !== undefined) update.certifications = ouvrier.certifications;
  if (ouvrier.dateEmbauche !== undefined) update.date_embauche = ouvrier.dateEmbauche;
  if (ouvrier.statut !== undefined) update.statut = ouvrier.statut;
  if (ouvrier.tauxHoraire !== undefined) update.taux_horaire = ouvrier.tauxHoraire;
  if (ouvrier.adresse !== undefined) update.adresse = ouvrier.adresse;
  
  return update;
};

// Convertir le format de la base de données vers le format de l'application pour les documents
const toDocument = (row: DocumentRow): Document => ({
  id: row.id,
  nom: row.nom,
  type: row.type,
  url: row.url,
  dateUpload: row.created_at || new Date().toISOString()
});

export const ouvrierService = {
  async getAll(): Promise<Ouvrier[]> {
    // Récupérer les ouvriers avec leurs documents
    const { data, error } = await supabase
      .from('ouvriers')
      .select(`
        *,
        documents(*)
      `)
      .order('nom');
    
    if (error) {
      console.error('Erreur lors de la récupération des ouvriers:', error);
      throw error;
    }
    
    return (data || []).map(item => {
      const ouvrier = toOuvrier(item);
      
      // Ajouter les documents
      if (item.documents) {
        ouvrier.documents = (item.documents as any[]).map(toDocument);
      }
      
      return ouvrier;
    });
  },
  
  async getById(id: string): Promise<Ouvrier | null> {
    const { data, error } = await supabase
      .from('ouvriers')
      .select(`
        *,
        documents(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Ouvrier non trouvé
      }
      console.error(`Erreur lors de la récupération de l'ouvrier ${id}:`, error);
      throw error;
    }
    
    if (!data) return null;
    
    const ouvrier = toOuvrier(data);
    
    // Ajouter les documents
    if (data.documents) {
      ouvrier.documents = (data.documents as any[]).map(toDocument);
    }
    
    return ouvrier;
  },
  
  async create(ouvrier: Omit<Ouvrier, 'id' | 'documents'>): Promise<Ouvrier> {
    const { data, error } = await supabase
      .from('ouvriers')
      .insert(toOuvrierInsert(ouvrier))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de l\'ouvrier:', error);
      throw error;
    }
    
    return toOuvrier(data);
  },
  
  async update(id: string, ouvrier: Partial<Omit<Ouvrier, 'id' | 'documents'>>): Promise<Ouvrier> {
    const { data, error } = await supabase
      .from('ouvriers')
      .update(toOuvrierUpdate(ouvrier))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'ouvrier ${id}:`, error);
      throw error;
    }
    
    return toOuvrier(data);
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ouvriers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de l'ouvrier ${id}:`, error);
      throw error;
    }
  },
  
  // Méthodes pour les documents
  async addDocument(ouvrierId: string, document: Omit<Document, 'id' | 'dateUpload'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        ouvrier_id: ouvrierId,
        nom: document.nom,
        type: document.type,
        url: document.url
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de l'ajout d'un document à l'ouvrier ${ouvrierId}:`, error);
      throw error;
    }
    
    return toDocument(data);
  },
  
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) {
      console.error(`Erreur lors de la suppression du document ${documentId}:`, error);
      throw error;
    }
  },
  
  async getByStatut(statut: Ouvrier['statut']): Promise<Ouvrier[]> {
    const { data, error } = await supabase
      .from('ouvriers')
      .select(`
        *,
        documents(*)
      `)
      .eq('statut', statut)
      .order('nom');
    
    if (error) {
      console.error(`Erreur lors de la récupération des ouvriers avec statut ${statut}:`, error);
      throw error;
    }
    
    return (data || []).map(item => {
      const ouvrier = toOuvrier(item);
      
      // Ajouter les documents
      if (item.documents) {
        ouvrier.documents = (item.documents as any[]).map(toDocument);
      }
      
      return ouvrier;
    });
  }
};