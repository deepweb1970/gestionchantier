import { supabase } from '../lib/supabase';
import type { Client } from '../types';
import type { Database } from '../types/supabase';
import { chantierService } from './chantierService';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

// Convertir le format de la base de données vers le format de l'application
const toClient = (row: ClientRow): Client => ({
  id: row.id,
  nom: row.nom,
  type: row.type,
  email: row.email,
  telephone: row.telephone,
  adresse: row.adresse,
  siret: row.siret || undefined,
  contactPrincipal: row.contact_principal,
  notes: row.notes || '',
  projets: [] // Sera rempli par getAll ou getById
});

// Convertir le format de l'application vers le format de la base de données
const toClientInsert = (client: Omit<Client, 'id' | 'projets'>): ClientInsert => ({
  nom: client.nom,
  type: client.type,
  email: client.email,
  telephone: client.telephone,
  adresse: client.adresse,
  siret: client.siret || null,
  contact_principal: client.contactPrincipal,
  notes: client.notes || ''
});

const toClientUpdate = (client: Partial<Omit<Client, 'id' | 'projets'>>): ClientUpdate => {
  const update: ClientUpdate = {};
  
  if (client.nom !== undefined) update.nom = client.nom;
  if (client.type !== undefined) update.type = client.type;
  if (client.email !== undefined) update.email = client.email;
  if (client.telephone !== undefined) update.telephone = client.telephone;
  if (client.adresse !== undefined) update.adresse = client.adresse;
  if (client.siret !== undefined) update.siret = client.siret || null;
  if (client.contactPrincipal !== undefined) update.contact_principal = client.contactPrincipal;
  if (client.notes !== undefined) update.notes = client.notes || '';
  
  return update;
};

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        chantiers(id)
      `)
      .order('nom');
    
    if (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
    
    return (data || []).map(row => {
      const client = toClient(row);
      // Ajouter les IDs des projets
      if (row.chantiers) {
        client.projets = (row.chantiers as any[]).map(c => c.id);
      }
      return client;
    });
  },
  
  getById: async (id: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        chantiers(id, nom)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Client non trouvé
      }
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
    
    if (!data) return null;
    
    const client = toClient(data);
    // Ajouter les IDs des projets
    if (data.chantiers) {
      client.projets = (data.chantiers as any[]).map(c => c.id);
    }
    
    return client;
  },
  
  create: async (client: Omit<Client, 'id' | 'projets'>): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .insert(toClientInsert(client))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
    
    return toClient(data);
  },
  
  update: async (id: string, client: Partial<Omit<Client, 'id' | 'projets'>>): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .update(toClientUpdate(client))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
    
    return toClient(data);
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  },
  
  // Méthode pour obtenir les projets d'un client
  getClientProjects: async (clientId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) {
      console.error(`Erreur lors de la récupération des projets du client ${clientId}:`, error);
      throw error;
    }
    
    return data || [];
  }
};