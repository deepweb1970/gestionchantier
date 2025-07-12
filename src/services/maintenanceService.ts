import { supabase } from '../lib/supabase';
import type { Maintenance, MaintenanceType } from '../types';
import type { Database } from '../types/supabase';

type MaintenanceRow = Database['public']['Tables']['maintenances']['Row'];
type MaintenanceInsert = Database['public']['Tables']['maintenances']['Insert'];
type MaintenanceUpdate = Database['public']['Tables']['maintenances']['Update'];

type MaintenanceTypeRow = Database['public']['Tables']['maintenance_types']['Row'];
type MaintenanceTypeInsert = Database['public']['Tables']['maintenance_types']['Insert'];
type MaintenanceTypeUpdate = Database['public']['Tables']['maintenance_types']['Update'];

// Convert database format to application format
const toMaintenance = (row: MaintenanceRow, materielNom?: string, typeNom?: string, executantNom?: string): Maintenance => ({
  id: row.id,
  materielId: row.materiel_id,
  typeId: row.type_id || '',
  datePlanifiee: row.date_planifiee,
  dateExecution: row.date_execution || undefined,
  heuresMachineDebut: row.heures_machine_debut || undefined,
  heuresMachineFin: row.heures_machine_fin || undefined,
  dureeHeures: row.duree_heures || undefined,
  cout: row.cout,
  statut: row.statut,
  description: row.description,
  notes: row.notes || undefined,
  executantId: row.executant_id || undefined,
  materielNom,
  typeNom,
  executantNom
});

// Convert application format to database format for insert
const toMaintenanceInsert = (maintenance: Omit<Maintenance, 'id' | 'materielNom' | 'typeNom' | 'executantNom'>): MaintenanceInsert => ({
  materiel_id: maintenance.materielId,
  type_id: maintenance.typeId || null,
  date_planifiee: maintenance.datePlanifiee,
  date_execution: maintenance.dateExecution || null,
  heures_machine_debut: maintenance.heuresMachineDebut || null,
  heures_machine_fin: maintenance.heuresMachineFin || null,
  duree_heures: maintenance.dureeHeures || null,
  cout: maintenance.cout,
  statut: maintenance.statut,
  description: maintenance.description,
  notes: maintenance.notes || null,
  executant_id: maintenance.executantId || null
});

// Convert application format to database format for update
const toMaintenanceUpdate = (maintenance: Partial<Omit<Maintenance, 'id' | 'materielNom' | 'typeNom' | 'executantNom'>>): MaintenanceUpdate => {
  const update: MaintenanceUpdate = {};
  
  if (maintenance.materielId !== undefined) update.materiel_id = maintenance.materielId;
  if (maintenance.typeId !== undefined) update.type_id = maintenance.typeId || null;
  if (maintenance.datePlanifiee !== undefined) update.date_planifiee = maintenance.datePlanifiee;
  if (maintenance.dateExecution !== undefined) update.date_execution = maintenance.dateExecution || null;
  if (maintenance.heuresMachineDebut !== undefined) update.heures_machine_debut = maintenance.heuresMachineDebut || null;
  if (maintenance.heuresMachineFin !== undefined) update.heures_machine_fin = maintenance.heuresMachineFin || null;
  if (maintenance.dureeHeures !== undefined) update.duree_heures = maintenance.dureeHeures || null;
  if (maintenance.cout !== undefined) update.cout = maintenance.cout;
  if (maintenance.statut !== undefined) update.statut = maintenance.statut;
  if (maintenance.description !== undefined) update.description = maintenance.description;
  if (maintenance.notes !== undefined) update.notes = maintenance.notes || null;
  if (maintenance.executantId !== undefined) update.executant_id = maintenance.executantId || null;
  
  return update;
};

// Convert database format to application format for maintenance types
const toMaintenanceType = (row: MaintenanceTypeRow): MaintenanceType => ({
  id: row.id,
  nom: row.nom,
  description: row.description || undefined,
  intervalleHeures: row.intervalle_heures || undefined,
  intervalleJours: row.intervalle_jours || undefined,
  priorite: row.priorite
});

// Convert application format to database format for maintenance types insert
const toMaintenanceTypeInsert = (type: Omit<MaintenanceType, 'id'>): MaintenanceTypeInsert => ({
  nom: type.nom,
  description: type.description || null,
  intervalle_heures: type.intervalleHeures || null,
  intervalle_jours: type.intervalleJours || null,
  priorite: type.priorite
});

// Convert application format to database format for maintenance types update
const toMaintenanceTypeUpdate = (type: Partial<Omit<MaintenanceType, 'id'>>): MaintenanceTypeUpdate => {
  const update: MaintenanceTypeUpdate = {};
  
  if (type.nom !== undefined) update.nom = type.nom;
  if (type.description !== undefined) update.description = type.description || null;
  if (type.intervalleHeures !== undefined) update.intervalle_heures = type.intervalleHeures || null;
  if (type.intervalleJours !== undefined) update.intervalle_jours = type.intervalleJours || null;
  if (type.priorite !== undefined) update.priorite = type.priorite;
  
  return update;
};

export const maintenanceService = {
  // Maintenance operations
  getAllMaintenances: async (): Promise<Maintenance[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          materiel(nom),
          maintenance_types(nom),
          ouvriers(nom, prenom)
        `)
        .order('date_planifiee', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des maintenances:', error);
        throw error;
      }
      
      return (data || []).map(item => {
        const materielNom = item.materiel?.nom || '';
        const typeNom = item.maintenance_types?.nom || '';
        const executantNom = item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '';
        
        return toMaintenance(item, materielNom, typeNom, executantNom);
      });
    } catch (error) {
      console.error('Erreur dans maintenanceService.getAllMaintenances:', error);
      throw error;
    }
  },
  
  getMaintenanceById: async (id: string): Promise<Maintenance | null> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          materiel(nom),
          maintenance_types(nom),
          ouvriers(nom, prenom)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Maintenance non trouvée
        }
        console.error(`Erreur lors de la récupération de la maintenance ${id}:`, error);
        throw error;
      }
      
      if (!data) return null;
      
      const materielNom = data.materiel?.nom || '';
      const typeNom = data.maintenance_types?.nom || '';
      const executantNom = data.ouvriers ? `${data.ouvriers.prenom} ${data.ouvriers.nom}` : '';
      
      return toMaintenance(data, materielNom, typeNom, executantNom);
    } catch (error) {
      console.error(`Erreur dans maintenanceService.getMaintenanceById(${id}):`, error);
      throw error;
    }
  },
  
  createMaintenance: async (maintenance: Omit<Maintenance, 'id' | 'materielNom' | 'typeNom' | 'executantNom'>): Promise<Maintenance> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .insert(toMaintenanceInsert(maintenance))
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création de la maintenance:', error);
        throw error;
      }
      
      return toMaintenance(data);
    } catch (error) {
      console.error('Erreur dans maintenanceService.createMaintenance:', error);
      throw error;
    }
  },
  
  updateMaintenance: async (id: string, maintenance: Partial<Omit<Maintenance, 'id' | 'materielNom' | 'typeNom' | 'executantNom'>>): Promise<Maintenance> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .update(toMaintenanceUpdate(maintenance))
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erreur lors de la mise à jour de la maintenance ${id}:`, error);
        throw error;
      }
      
      return toMaintenance(data);
    } catch (error) {
      console.error(`Erreur dans maintenanceService.updateMaintenance(${id}):`, error);
      throw error;
    }
  },
  
  deleteMaintenance: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erreur lors de la suppression de la maintenance ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erreur dans maintenanceService.deleteMaintenance(${id}):`, error);
      throw error;
    }
  },
  
  getMaintenancesByMateriel: async (materielId: string): Promise<Maintenance[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          materiel(nom),
          maintenance_types(nom),
          ouvriers(nom, prenom)
        `)
        .eq('materiel_id', materielId)
        .order('date_planifiee', { ascending: false });
      
      if (error) {
        console.error(`Erreur lors de la récupération des maintenances pour le matériel ${materielId}:`, error);
        throw error;
      }
      
      return (data || []).map(item => {
        const materielNom = item.materiel?.nom || '';
        const typeNom = item.maintenance_types?.nom || '';
        const executantNom = item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '';
        
        return toMaintenance(item, materielNom, typeNom, executantNom);
      });
    } catch (error) {
      console.error(`Erreur dans maintenanceService.getMaintenancesByMateriel(${materielId}):`, error);
      throw error;
    }
  },
  
  // Maintenance Types operations
  getAllMaintenanceTypes: async (): Promise<MaintenanceType[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('*')
        .order('nom');
      
      if (error) {
        console.error('Erreur lors de la récupération des types de maintenance:', error);
        throw error;
      }
      
      return (data || []).map(toMaintenanceType);
    } catch (error) {
      console.error('Erreur dans maintenanceService.getAllMaintenanceTypes:', error);
      throw error;
    }
  },
  
  getMaintenanceTypeById: async (id: string): Promise<MaintenanceType | null> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Type de maintenance non trouvé
        }
        console.error(`Erreur lors de la récupération du type de maintenance ${id}:`, error);
        throw error;
      }
      
      return data ? toMaintenanceType(data) : null;
    } catch (error) {
      console.error(`Erreur dans maintenanceService.getMaintenanceTypeById(${id}):`, error);
      throw error;
    }
  },
  
  createMaintenanceType: async (type: Omit<MaintenanceType, 'id'>): Promise<MaintenanceType> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .insert(toMaintenanceTypeInsert(type))
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du type de maintenance:', error);
        throw error;
      }
      
      return toMaintenanceType(data);
    } catch (error) {
      console.error('Erreur dans maintenanceService.createMaintenanceType:', error);
      throw error;
    }
  },
  
  updateMaintenanceType: async (id: string, type: Partial<Omit<MaintenanceType, 'id'>>): Promise<MaintenanceType> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .update(toMaintenanceTypeUpdate(type))
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erreur lors de la mise à jour du type de maintenance ${id}:`, error);
        throw error;
      }
      
      return toMaintenanceType(data);
    } catch (error) {
      console.error(`Erreur dans maintenanceService.updateMaintenanceType(${id}):`, error);
      throw error;
    }
  },
  
  deleteMaintenanceType: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('maintenance_types')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erreur lors de la suppression du type de maintenance ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erreur dans maintenanceService.deleteMaintenanceType(${id}):`, error);
      throw error;
    }
  },
  
  // Specialized queries
  getUpcomingMaintenances: async (days: number = 30): Promise<Maintenance[]> => {
    try {
      // Get maintenances by date
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const { data: dateData, error: dateError } = await supabase
        .from('maintenances')
        .select(`
          *,
          materiel(nom, machine_hours, next_maintenance_hours),
          maintenance_types(nom),
          ouvriers(nom, prenom)
        `)
        .eq('statut', 'planifiee')
        .lte('date_planifiee', futureDate.toISOString().split('T')[0])
        .gte('date_planifiee', today.toISOString().split('T')[0])
        .order('date_planifiee');
      
      if (dateError) {
        console.error('Erreur lors de la récupération des maintenances à venir par date:', dateError);
        throw dateError;
      }
      
      // Get maintenances by machine hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('materiel')
        .select(`
          id,
          nom,
          machine_hours,
          next_maintenance_hours
        `)
        .not('next_maintenance_hours', 'is', null)
        .lt('next_maintenance_hours', 'machine_hours', { ascending: true });
      
      if (hoursError) {
        console.error('Erreur lors de la récupération des matériels nécessitant une maintenance:', hoursError);
        throw hoursError;
      }
      
      // Create maintenance entries for equipment needing maintenance based on hours
      const hourBasedMaintenances: Maintenance[] = [];
      
      for (const item of (hoursData || [])) {
        if (item.machine_hours && item.next_maintenance_hours && item.machine_hours >= item.next_maintenance_hours) {
          hourBasedMaintenances.push({
            id: `hour-based-${item.id}`,
            materielId: item.id,
            typeId: '', // We don't know the type
            datePlanifiee: today.toISOString().split('T')[0],
            heuresMachineDebut: item.machine_hours,
            cout: 0,
            statut: 'planifiee',
            description: `Maintenance requise - ${item.machine_hours}h atteintes (seuil: ${item.next_maintenance_hours}h)`,
            materielNom: item.nom
          });
        }
      }
      
      // Combine both types of maintenances
      const dateBasedMaintenances = (dateData || []).map(item => {
        const materielNom = item.materiel?.nom || '';
        const typeNom = item.maintenance_types?.nom || '';
        const executantNom = item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '';
        
        return toMaintenance(item, materielNom, typeNom, executantNom);
      });
      
      return [...dateBasedMaintenances, ...hourBasedMaintenances];
    } catch (error) {
      console.error('Erreur dans maintenanceService.getUpcomingMaintenances:', error);
      throw error;
    }
  },
  
  getMaintenanceHistory: async (materielId: string, limit: number = 10): Promise<Maintenance[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          materiel(nom),
          maintenance_types(nom),
          ouvriers(nom, prenom)
        `)
        .eq('materiel_id', materielId)
        .eq('statut', 'terminee')
        .order('date_execution', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Erreur lors de la récupération de l'historique de maintenance pour le matériel ${materielId}:`, error);
        throw error;
      }
      
      return (data || []).map(item => {
        const materielNom = item.materiel?.nom || '';
        const typeNom = item.maintenance_types?.nom || '';
        const executantNom = item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '';
        
        return toMaintenance(item, materielNom, typeNom, executantNom);
      });
    } catch (error) {
      console.error(`Erreur dans maintenanceService.getMaintenanceHistory(${materielId}):`, error);
      throw error;
    }
  },
  
  calculateNextMaintenanceDate: async (materielId: string, typeId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_next_maintenance_date', {
          materiel_id: materielId,
          type_id: typeId
        });
      
      if (error) {
        console.error('Erreur lors du calcul de la prochaine date de maintenance:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erreur dans maintenanceService.calculateNextMaintenanceDate:', error);
      throw error;
    }
  }
};