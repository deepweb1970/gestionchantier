import { supabase } from '../lib/supabase';
import type { Rapport, RapportType } from '../types';
import type { Database } from '../types/supabase';

type RapportRow = Database['public']['Tables']['rapports']['Row'];
type RapportInsert = Database['public']['Tables']['rapports']['Insert'];
type RapportUpdate = Database['public']['Tables']['rapports']['Update'];

// Convertir le format de la base de données vers le format de l'application
const toRapport = (row: RapportRow): Rapport => ({
  id: row.id,
  nom: row.nom,
  type: row.type,
  dateDebut: row.date_debut,
  dateFin: row.date_fin,
  parametres: (row.parametres as any) || {},
  dateCreation: row.created_at || new Date().toISOString().split('T')[0],
  creePar: 'Admin' // TODO: Récupérer le nom de l'utilisateur via une jointure
});

// Convertir le format de l'application vers le format de la base de données
const toRapportInsert = (rapport: Omit<Rapport, 'id' | 'dateCreation' | 'creePar'>): RapportInsert => ({
  nom: rapport.nom,
  type: rapport.type,
  date_debut: rapport.dateDebut,
  date_fin: rapport.dateFin,
  parametres: rapport.parametres as any,
  cree_par: null // TODO: Utiliser l'ID de l'utilisateur connecté
});

const toRapportUpdate = (rapport: Partial<Omit<Rapport, 'id' | 'dateCreation' | 'creePar'>>): RapportUpdate => {
  const update: RapportUpdate = {};
  
  if (rapport.nom !== undefined) update.nom = rapport.nom;
  if (rapport.type !== undefined) update.type = rapport.type;
  if (rapport.dateDebut !== undefined) update.date_debut = rapport.dateDebut;
  if (rapport.dateFin !== undefined) update.date_fin = rapport.dateFin;
  if (rapport.parametres !== undefined) update.parametres = rapport.parametres as any;
  
  return update;
};

export const rapportService = {
  getAll: async (): Promise<Rapport[]> => {
    try {
      const { data, error } = await supabase
        .from('rapports')
        .select(`
          *,
          utilisateurs(nom, prenom)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des rapports:', error);
        throw error;
      }
      
      return (data || []).map(item => {
        const rapport = toRapport(item);
        
        // Ajouter le nom de l'utilisateur créateur
        if (item.utilisateurs) {
          const user = item.utilisateurs as any;
          rapport.creePar = `${user.prenom} ${user.nom}`;
        }
        
        return rapport;
      });
    } catch (error) {
      console.error('Erreur dans rapportService.getAll:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<Rapport | null> => {
    try {
      const { data, error } = await supabase
        .from('rapports')
        .select(`
          *,
          utilisateurs(nom, prenom)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Rapport non trouvé
        }
        console.error(`Erreur lors de la récupération du rapport ${id}:`, error);
        throw error;
      }
      
      if (!data) return null;
      
      const rapport = toRapport(data);
      
      // Ajouter le nom de l'utilisateur créateur
      if (data.utilisateurs) {
        const user = data.utilisateurs as any;
        rapport.creePar = `${user.prenom} ${user.nom}`;
      }
      
      return rapport;
    } catch (error) {
      console.error(`Erreur dans rapportService.getById(${id}):`, error);
      throw error;
    }
  },
  
  create: async (rapport: Omit<Rapport, 'id' | 'dateCreation' | 'creePar'>): Promise<Rapport> => {
    try {
      const { data, error } = await supabase
        .from('rapports')
        .insert(toRapportInsert(rapport))
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du rapport:', error);
        throw error;
      }
      
      return toRapport(data);
    } catch (error) {
      console.error('Erreur dans rapportService.create:', error);
      throw error;
    }
  },
  
  update: async (id: string, rapport: Partial<Omit<Rapport, 'id' | 'dateCreation' | 'creePar'>>): Promise<Rapport> => {
    try {
      const { data, error } = await supabase
        .from('rapports')
        .update(toRapportUpdate(rapport))
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erreur lors de la mise à jour du rapport ${id}:`, error);
        throw error;
      }
      
      return toRapport(data);
    } catch (error) {
      console.error(`Erreur dans rapportService.update(${id}):`, error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('rapports')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erreur lors de la suppression du rapport ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erreur dans rapportService.delete(${id}):`, error);
      throw error;
    }
  },
  
  // Méthodes d'analyse des données
  analyzeData: async (dateDebut: string, dateFin: string, chantiers: string[], ouvriers: string[], materiel: string[]) => {
    try {
      // Récupérer les saisies d'heures filtrées
      let saisiesQuery = supabase
        .from('saisies_heures')
        .select(`
          *,
          ouvriers(nom, prenom, taux_horaire),
          chantiers(nom),
          materiel(nom)
        `)
        .gte('date', dateDebut)
        .lte('date', dateFin);
      
      if (chantiers.length > 0) {
        saisiesQuery = saisiesQuery.in('chantier_id', chantiers);
      }
      
      if (ouvriers.length > 0) {
        saisiesQuery = saisiesQuery.in('ouvrier_id', ouvriers);
      }
      
      if (materiel.length > 0) {
        saisiesQuery = saisiesQuery.in('materiel_id', materiel);
      }
      
      const { data: saisies, error: saisiesError } = await saisiesQuery;
      
      if (saisiesError) {
        console.error('Erreur lors de la récupération des saisies:', saisiesError);
        throw saisiesError;
      }
      
      // Récupérer les factures filtrées
      let facturesQuery = supabase
        .from('factures')
        .select('*')
        .gte('date_emission', dateDebut)
        .lte('date_emission', dateFin);
      
      if (chantiers.length > 0) {
        facturesQuery = facturesQuery.in('chantier_id', chantiers);
      }
      
      const { data: factures, error: facturesError } = await facturesQuery;
      
      if (facturesError) {
        console.error('Erreur lors de la récupération des factures:', facturesError);
        throw facturesError;
      }
      
      // Calculs
      const totalHeures = (saisies || []).reduce((sum, s) => {
        const heuresTotal = s.heures_total || (s.heures_normales + s.heures_supplementaires + (s.heures_exceptionnelles || 0));
        return sum + heuresTotal;
      }, 0);
      
      const heuresValidees = (saisies || []).filter(s => s.valide).reduce((sum, s) => {
        const heuresTotal = s.heures_total || (s.heures_normales + s.heures_supplementaires + (s.heures_exceptionnelles || 0));
        return sum + heuresTotal;
      }, 0);
      
      const chiffreAffaires = (factures || []).reduce((sum, f) => sum + f.montant_ttc, 0);
      const facturesPayees = (factures || []).filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montant_ttc, 0);
      
      // Coûts de main d'œuvre
      const coutMainOeuvre = (saisies || []).reduce((sum, saisie) => {
        const ouvrier = saisie.ouvriers as any;
        if (!ouvrier) return sum;
        
        const heuresTotal = saisie.heures_total || (saisie.heures_normales + saisie.heures_supplementaires + (saisie.heures_exceptionnelles || 0));
        return sum + (heuresTotal * ouvrier.taux_horaire);
      }, 0);
      
      return {
        periode: { debut: dateDebut, fin: dateFin },
        heures: { total: totalHeures, validees: heuresValidees },
        finances: { chiffreAffaires, facturesPayees, coutMainOeuvre },
        rentabilite: chiffreAffaires > 0 ? ((chiffreAffaires - coutMainOeuvre) / chiffreAffaires * 100) : 0,
        saisies: saisies || [],
        factures: factures || []
      };
    } catch (error) {
      console.error('Erreur dans rapportService.analyzeData:', error);
      throw error;
    }
  },
  
  // Méthodes pour obtenir des statistiques globales
  getGlobalStats: async () => {
    try {
      const [
        { data: chantiers, error: chantiersError },
        { data: ouvriers, error: ouvriersError },
        { data: materiel, error: materielError },
        { data: factures, error: facturesError },
        { data: saisies, error: saisiesError }
      ] = await Promise.all([
        supabase.from('chantiers').select('id, statut'),
        supabase.from('ouvriers').select('id, statut'),
        supabase.from('materiel').select('id, statut'),
        supabase.from('factures').select('montant_ttc, statut'),
        supabase.from('saisies_heures').select('heures_total, heures_normales, heures_supplementaires, heures_exceptionnelles, valide')
      ]);
      
      if (chantiersError || ouvriersError || materielError || facturesError || saisiesError) {
        throw new Error('Erreur lors de la récupération des statistiques globales');
      }
      
      const totalChantiers = (chantiers || []).length;
      const chantiersActifs = (chantiers || []).filter(c => c.statut === 'actif').length;
      const totalOuvriers = (ouvriers || []).length;
      const ouvriersActifs = (ouvriers || []).filter(o => o.statut === 'actif').length;
      const totalMateriel = (materiel || []).length;
      const materielDisponible = (materiel || []).filter(m => m.statut === 'disponible').length;
      
      const chiffreAffairesTotal = (factures || []).reduce((sum, f) => sum + f.montant_ttc, 0);
      const facturesPayees = (factures || []).filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montant_ttc, 0);
      const facturesEnAttente = (factures || []).filter(f => f.statut === 'envoyee').reduce((sum, f) => sum + f.montant_ttc, 0);
      
      const totalHeures = (saisies || []).reduce((sum, s) => {
        const heuresTotal = s.heures_total || (s.heures_normales + s.heures_supplementaires + (s.heures_exceptionnelles || 0));
        return sum + heuresTotal;
      }, 0);
      
      const heuresValidees = (saisies || []).filter(s => s.valide).reduce((sum, s) => {
        const heuresTotal = s.heures_total || (s.heures_normales + s.heures_supplementaires + (s.heures_exceptionnelles || 0));
        return sum + heuresTotal;
      }, 0);
      
      return {
        chantiers: { total: totalChantiers, actifs: chantiersActifs },
        ouvriers: { total: totalOuvriers, actifs: ouvriersActifs },
        materiel: { total: totalMateriel, disponible: materielDisponible },
        finances: { total: chiffreAffairesTotal, payees: facturesPayees, enAttente: facturesEnAttente },
        heures: { total: totalHeures, validees: heuresValidees }
      };
    } catch (error) {
      console.error('Erreur dans rapportService.getGlobalStats:', error);
      throw error;
    }
  },
  
  // Méthodes pour obtenir des indicateurs de performance
  getPerformanceIndicators: async () => {
    try {
      const stats = await rapportService.getGlobalStats();
      
      const tauxOccupationOuvriers = stats.ouvriers.total > 0 ? (stats.ouvriers.actifs / stats.ouvriers.total) * 100 : 0;
      const tauxValidationHeures = stats.heures.total > 0 ? (stats.heures.validees / stats.heures.total) * 100 : 0;
      const tauxPaiementFactures = stats.finances.total > 0 ? (stats.finances.payees / stats.finances.total) * 100 : 0;
      
      // Calculer le taux d'utilisation du matériel
      const { data: materielData, error: materielError } = await supabase
        .from('materiel')
        .select('utilization_rate');
      
      if (materielError) {
        console.error('Erreur lors de la récupération du taux d\'utilisation du matériel:', materielError);
      }
      
      const tauxUtilisationMateriel = (materielData || []).length > 0 
        ? (materielData || []).reduce((sum, m) => sum + (m.utilization_rate || 0), 0) / (materielData || []).length 
        : 0;
      
      return {
        tauxOccupationOuvriers,
        tauxValidationHeures,
        tauxPaiementFactures,
        tauxUtilisationMateriel
      };
    } catch (error) {
      console.error('Erreur dans rapportService.getPerformanceIndicators:', error);
      throw error;
    }
  }
};