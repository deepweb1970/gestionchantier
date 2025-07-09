import { supabase } from '../lib/supabase';
import type { PlanningEvent } from '../types';
import type { Database } from '../types/supabase';

type PlanningEventRow = Database['public']['Tables']['planning_events']['Row'];
type PlanningEventInsert = Database['public']['Tables']['planning_events']['Insert'];
type PlanningEventUpdate = Database['public']['Tables']['planning_events']['Update'];

// Convertir le format de la base de données vers le format de l'application
const toPlanningEvent = (row: PlanningEventRow): PlanningEvent => ({
  id: row.id,
  titre: row.titre,
  description: row.description || '',
  dateDebut: row.date_debut,
  dateFin: row.date_fin,
  chantierId: row.chantier_id || undefined,
  ouvrierId: row.ouvrier_id || undefined,
  materielId: row.materiel_id || undefined,
  type: row.type
});

// Convertir le format de l'application vers le format de la base de données
const toPlanningEventInsert = (event: Omit<PlanningEvent, 'id'>): PlanningEventInsert => ({
  titre: event.titre,
  description: event.description || null,
  date_debut: event.dateDebut,
  date_fin: event.dateFin,
  chantier_id: event.chantierId || null,
  ouvrier_id: event.ouvrierId || null,
  materiel_id: event.materielId || null,
  type: event.type
});

const toPlanningEventUpdate = (event: Partial<Omit<PlanningEvent, 'id'>>): PlanningEventUpdate => {
  const update: PlanningEventUpdate = {};
  
  if (event.titre !== undefined) update.titre = event.titre;
  if (event.description !== undefined) update.description = event.description || null;
  if (event.dateDebut !== undefined) update.date_debut = event.dateDebut;
  if (event.dateFin !== undefined) update.date_fin = event.dateFin;
  if (event.chantierId !== undefined) update.chantier_id = event.chantierId || null;
  if (event.ouvrierId !== undefined) update.ouvrier_id = event.ouvrierId || null;
  if (event.materielId !== undefined) update.materiel_id = event.materielId || null;
  if (event.type !== undefined) update.type = event.type;
  
  return update;
};

export const planningService = {
  getAll: async (): Promise<PlanningEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .order('date_debut');
      
      if (error) {
        console.error('Erreur lors de la récupération des événements du planning:', error);
        throw error;
      }
      
      return (data || []).map(toPlanningEvent);
    } catch (error) {
      console.error('Erreur dans planningService.getAll:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<PlanningEvent | null> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Événement non trouvé
        }
        console.error(`Erreur lors de la récupération de l'événement ${id}:`, error);
        throw error;
      }
      
      return data ? toPlanningEvent(data) : null;
    } catch (error) {
      console.error(`Erreur dans planningService.getById(${id}):`, error);
      throw error;
    }
  },
  
  create: async (event: Omit<PlanningEvent, 'id'>): Promise<PlanningEvent> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .insert(toPlanningEventInsert(event))
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        throw error;
      }
      
      return toPlanningEvent(data);
    } catch (error) {
      console.error('Erreur dans planningService.create:', error);
      throw error;
    }
  },
  
  update: async (id: string, event: Partial<Omit<PlanningEvent, 'id'>>): Promise<PlanningEvent> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .update(toPlanningEventUpdate(event))
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erreur lors de la mise à jour de l'événement ${id}:`, error);
        throw error;
      }
      
      return toPlanningEvent(data);
    } catch (error) {
      console.error(`Erreur dans planningService.update(${id}):`, error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('planning_events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erreur lors de la suppression de l'événement ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erreur dans planningService.delete(${id}):`, error);
      throw error;
    }
  },
  
  getByChantier: async (chantierId: string): Promise<PlanningEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .eq('chantier_id', chantierId)
        .order('date_debut');
      
      if (error) {
        console.error(`Erreur lors de la récupération des événements du chantier ${chantierId}:`, error);
        throw error;
      }
      
      return (data || []).map(toPlanningEvent);
    } catch (error) {
      console.error(`Erreur dans planningService.getByChantier(${chantierId}):`, error);
      throw error;
    }
  },
  
  getByOuvrier: async (ouvrierId: string): Promise<PlanningEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .eq('ouvrier_id', ouvrierId)
        .order('date_debut');
      
      if (error) {
        console.error(`Erreur lors de la récupération des événements de l'ouvrier ${ouvrierId}:`, error);
        throw error;
      }
      
      return (data || []).map(toPlanningEvent);
    } catch (error) {
      console.error(`Erreur dans planningService.getByOuvrier(${ouvrierId}):`, error);
      throw error;
    }
  },
  
  getByMateriel: async (materielId: string): Promise<PlanningEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .eq('materiel_id', materielId)
        .order('date_debut');
      
      if (error) {
        console.error(`Erreur lors de la récupération des événements du matériel ${materielId}:`, error);
        throw error;
      }
      
      return (data || []).map(toPlanningEvent);
    } catch (error) {
      console.error(`Erreur dans planningService.getByMateriel(${materielId}):`, error);
      throw error;
    }
  },
  
  getByDateRange: async (startDate: string, endDate: string): Promise<PlanningEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .select(`
          *,
          chantiers(nom, statut),
          ouvriers(nom, prenom, statut),
          materiel(nom, statut)
        `)
        .or(`date_debut.gte.${startDate},date_fin.gte.${startDate}`)
        .lt('date_debut', endDate)
        .order('date_debut');
      
      if (error) {
        console.error(`Erreur lors de la récupération des événements entre ${startDate} et ${endDate}:`, error);
        throw error;
      }
      
      return (data || []).map(toPlanningEvent);
    } catch (error) {
      console.error(`Erreur dans planningService.getByDateRange(${startDate}, ${endDate}):`, error);
      throw error;
    }
  },
  
  checkConflicts: async (event: Omit<PlanningEvent, 'id'>, excludeId?: string): Promise<PlanningEvent[]> => {
    try {
      const conflicts: PlanningEvent[] = [];
      
      // Check for ouvrier conflicts
      if (event.ouvrierId) {
        const { data: ouvrierEvents, error: ouvrierError } = await supabase
          .from('planning_events')
          .select('*')
          .eq('ouvrier_id', event.ouvrierId)
          .or(`date_debut.lte.${event.dateFin},date_fin.gte.${event.dateDebut}`);
        
        if (ouvrierError) {
          console.error('Erreur lors de la vérification des conflits d\'ouvrier:', ouvrierError);
          throw ouvrierError;
        }
        
        if (ouvrierEvents) {
          const filteredEvents = excludeId 
            ? ouvrierEvents.filter(e => e.id !== excludeId) 
            : ouvrierEvents;
          
          conflicts.push(...filteredEvents.map(toPlanningEvent));
        }
      }
      
      // Check for materiel conflicts
      if (event.materielId) {
        const { data: materielEvents, error: materielError } = await supabase
          .from('planning_events')
          .select('*')
          .eq('materiel_id', event.materielId)
          .or(`date_debut.lte.${event.dateFin},date_fin.gte.${event.dateDebut}`);
        
        if (materielError) {
          console.error('Erreur lors de la vérification des conflits de matériel:', materielError);
          throw materielError;
        }
        
        if (materielEvents) {
          const filteredEvents = excludeId 
            ? materielEvents.filter(e => e.id !== excludeId) 
            : materielEvents;
          
          // Add only events that aren't already in the conflicts array
          filteredEvents.forEach(e => {
            if (!conflicts.some(c => c.id === e.id)) {
              conflicts.push(toPlanningEvent(e));
            }
          });
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Erreur dans planningService.checkConflicts:', error);
      throw error;
    }
  }
};