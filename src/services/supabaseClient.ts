import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erreur: Variables d\'environnement Supabase manquantes. Veuillez configurer votre fichier .env');
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          nom: string;
          type: 'particulier' | 'entreprise';
          email: string;
          telephone: string;
          adresse: string;
          siret?: string;
          contact_principal: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      chantiers: {
        Row: {
          id: string;
          nom: string;
          description: string;
          client_id: string;
          adresse: string;
          date_debut: string;
          date_fin?: string;
          statut: 'actif' | 'termine' | 'pause' | 'planifie';
          avancement: number;
          budget: number;
          latitude?: number;
          longitude?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chantiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chantiers']['Insert']>;
      };
      ouvriers: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          email: string;
          telephone: string;
          qualification: string;
          certifications: string[];
          date_embauche: string;
          statut: 'actif' | 'conge' | 'arret' | 'indisponible';
          taux_horaire: number;
          adresse: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ouvriers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ouvriers']['Insert']>;
      };
      materiel: {
        Row: {
          id: string;
          nom: string;
          type: string;
          marque: string;
          modele: string;
          numero_serie: string;
          date_achat: string;
          valeur: number;
          statut: 'disponible' | 'en_service' | 'maintenance' | 'hors_service';
          prochaine_maintenance?: string;
          localisation?: string;
          tarif_horaire?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['materiel']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['materiel']['Insert']>;
      };
      utilisateurs: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          email: string;
          role: 'admin' | 'manager' | 'employe';
          derniere_connexion: string;
          actif: boolean;
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['utilisateurs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>;
      };
      factures: {
        Row: {
          id: string;
          numero: string;
          client_id: string;
          chantier_id?: string;
          date_emission: string;
          date_echeance: string;
          montant_ht: number;
          tva: number;
          montant_ttc: number;
          statut: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['factures']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['factures']['Insert']>;
      };
      facture_items: {
        Row: {
          id: string;
          facture_id: string;
          description: string;
          quantite: number;
          prix_unitaire: number;
          total: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['facture_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['facture_items']['Insert']>;
      };
      saisies_heures: {
        Row: {
          id: string;
          ouvrier_id: string;
          chantier_id: string;
          materiel_id?: string;
          date: string;
          heure_debut: string;
          heure_fin: string;
          heures_normales: number;
          heures_supplementaires: number;
          description: string;
          valide: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saisies_heures']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['saisies_heures']['Insert']>;
      };
      planning_events: {
        Row: {
          id: string;
          titre: string;
          description?: string;
          date_debut: string;
          date_fin: string;
          chantier_id?: string;
          ouvrier_id?: string;
          materiel_id?: string;
          type: 'chantier' | 'maintenance' | 'conge' | 'formation';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['planning_events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['planning_events']['Insert']>;
      };
      photos: {
        Row: {
          id: string;
          chantier_id: string;
          url: string;
          description: string;
          date: string;
          category: 'avancement' | 'probleme' | 'materiel' | 'securite' | 'finition' | 'avant' | 'apres';
          filename?: string;
          size_bytes?: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          nom: string;
          type: string;
          url: string;
          ouvrier_id?: string;
          chantier_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      rapports: {
        Row: {
          id: string;
          nom: string;
          type: 'performance' | 'couts' | 'activite' | 'financier' | 'ressources';
          date_debut: string;
          date_fin: string;
          parametres: any;
          cree_par?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rapports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rapports']['Insert']>;
      };
      historique_connexions: {
        Row: {
          id: string;
          utilisateur_id: string;
          date_connexion: string;
          adresse_ip?: string;
          navigateur?: string;
          appareil?: string;
          succes: boolean;
        };
        Insert: Omit<Database['public']['Tables']['historique_connexions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['historique_connexions']['Insert']>;
      };
    };
  };
}

// Services pour chaque table
export class ClientService {
  static async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data;
  }

  static async create(client: Database['public']['Tables']['clients']['Insert']) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, client: Database['public']['Tables']['clients']['Update']) {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class ChantierService {
  static async getAll() {
    const { data, error } = await supabase
      .from('chantiers')
      .select(`
        *,
        client:clients(nom, email, telephone),
        photos(*)
      `)
      .order('date_debut', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(chantier: Database['public']['Tables']['chantiers']['Insert']) {
    const { data, error } = await supabase
      .from('chantiers')
      .insert(chantier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, chantier: Database['public']['Tables']['chantiers']['Update']) {
    const { data, error } = await supabase
      .from('chantiers')
      .update(chantier)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('chantiers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class OuvrierService {
  static async getAll() {
    const { data, error } = await supabase
      .from('ouvriers')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data;
  }

  static async create(ouvrier: Database['public']['Tables']['ouvriers']['Insert']) {
    const { data, error } = await supabase
      .from('ouvriers')
      .insert(ouvrier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, ouvrier: Database['public']['Tables']['ouvriers']['Update']) {
    const { data, error } = await supabase
      .from('ouvriers')
      .update(ouvrier)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('ouvriers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class MaterielService {
  static async getAll() {
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data;
  }

  static async create(materiel: Database['public']['Tables']['materiel']['Insert']) {
    const { data, error } = await supabase
      .from('materiel')
      .insert(materiel)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, materiel: Database['public']['Tables']['materiel']['Update']) {
    const { data, error } = await supabase
      .from('materiel')
      .update(materiel)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('materiel')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class SaisieHeureService {
  static async getAll() {
    const { data, error } = await supabase
      .from('saisies_heures')
      .select(`
        *,
        ouvrier:ouvriers(nom, prenom, taux_horaire),
        chantier:chantiers(nom),
        materiel:materiel(nom)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(saisie: Database['public']['Tables']['saisies_heures']['Insert']) {
    const { data, error } = await supabase
      .from('saisies_heures')
      .insert(saisie)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, saisie: Database['public']['Tables']['saisies_heures']['Update']) {
    const { data, error } = await supabase
      .from('saisies_heures')
      .update(saisie)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('saisies_heures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class FactureService {
  static async getAll() {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        client:clients(nom, email),
        chantier:chantiers(nom),
        items:facture_items(*)
      `)
      .order('date_emission', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(facture: Database['public']['Tables']['factures']['Insert'], items: Database['public']['Tables']['facture_items']['Insert'][]) {
    const { data: factureData, error: factureError } = await supabase
      .from('factures')
      .insert(facture)
      .select()
      .single();
    
    if (factureError) throw factureError;

    if (items.length > 0) {
      const itemsWithFactureId = items.map(item => ({
        ...item,
        facture_id: factureData.id
      }));

      const { error: itemsError } = await supabase
        .from('facture_items')
        .insert(itemsWithFactureId);
      
      if (itemsError) throw itemsError;
    }

    return factureData;
  }

  static async update(id: string, facture: Database['public']['Tables']['factures']['Update']) {
    const { data, error } = await supabase
      .from('factures')
      .update(facture)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class PlanningService {
  static async getAll() {
    const { data, error } = await supabase
      .from('planning_events')
      .select(`
        *,
        chantier:chantiers(nom),
        ouvrier:ouvriers(nom, prenom),
        materiel:materiel(nom)
      `)
      .order('date_debut');
    
    if (error) throw error;
    return data;
  }

  static async create(event: Database['public']['Tables']['planning_events']['Insert']) {
    const { data, error } = await supabase
      .from('planning_events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, event: Database['public']['Tables']['planning_events']['Update']) {
    const { data, error } = await supabase
      .from('planning_events')
      .update(event)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('planning_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class PhotoService {
  static async getByChantier(chantierId: string) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(photo: Database['public']['Tables']['photos']['Insert']) {
    const { data, error } = await supabase
      .from('photos')
      .insert(photo)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, photo: Database['public']['Tables']['photos']['Update']) {
    const { data, error } = await supabase
      .from('photos')
      .update(photo)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}