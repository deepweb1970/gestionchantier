import { supabase } from '../lib/supabase';
import type { PetitMateriel, PretPetitMateriel } from '../types';

export class PetitMaterielService {
  // CRUD pour petit matériel
  static async getAll(): Promise<PetitMateriel[]> {
    try {
      const { data, error } = await supabase
        .from('petit_materiel')
        .select(`
          *,
          prets_petit_materiel(*)
        `)
        .order('nom');
      
      if (error) {
        console.error('Erreur lors de la récupération du petit matériel:', error);
        throw error;
      }
      
      return (data || []).map(item => ({
        ...item,
        prets: item.prets_petit_materiel || []
      }));
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<PetitMateriel | null> {
    try {
      const { data, error } = await supabase
        .from('petit_materiel')
        .select(`
          *,
          prets_petit_materiel(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur lors de la récupération du petit matériel:', error);
        throw error;
      }
      
      return {
        ...data,
        prets: data.prets_petit_materiel || []
      };
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.getById:', error);
      throw error;
    }
  }

  static async create(materiel: Omit<PetitMateriel, 'id' | 'prets' | 'createdAt' | 'updatedAt'>): Promise<PetitMateriel> {
    try {
      const { data, error } = await supabase
        .from('petit_materiel')
        .insert({
          nom: materiel.nom,
          type: materiel.type,
          marque: materiel.marque,
          modele: materiel.modele,
          numero_serie: materiel.numeroSerie,
          code_barre: materiel.codeBarre,
          date_achat: materiel.dateAchat,
          valeur: materiel.valeur,
          statut: materiel.statut,
          localisation: materiel.localisation,
          description: materiel.description,
          quantite_stock: materiel.quantiteStock,
          quantite_disponible: materiel.quantiteDisponible,
          seuil_alerte: materiel.seuilAlerte,
          poids: materiel.poids,
          dimensions: materiel.dimensions,
          garantie: materiel.garantie,
          fournisseur: materiel.fournisseur
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du petit matériel:', error);
        throw error;
      }
      
      return { ...data, prets: [] };
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.create:', error);
      throw error;
    }
  }

  static async update(id: string, materiel: Partial<Omit<PetitMateriel, 'id' | 'prets' | 'createdAt' | 'updatedAt'>>): Promise<PetitMateriel> {
    try {
      const updateData: any = {};
      
      if (materiel.nom !== undefined) updateData.nom = materiel.nom;
      if (materiel.type !== undefined) updateData.type = materiel.type;
      if (materiel.marque !== undefined) updateData.marque = materiel.marque;
      if (materiel.modele !== undefined) updateData.modele = materiel.modele;
      if (materiel.numeroSerie !== undefined) updateData.numero_serie = materiel.numeroSerie;
      if (materiel.codeBarre !== undefined) updateData.code_barre = materiel.codeBarre;
      if (materiel.dateAchat !== undefined) updateData.date_achat = materiel.dateAchat;
      if (materiel.valeur !== undefined) updateData.valeur = materiel.valeur;
      if (materiel.statut !== undefined) updateData.statut = materiel.statut;
      if (materiel.localisation !== undefined) updateData.localisation = materiel.localisation;
      if (materiel.description !== undefined) updateData.description = materiel.description;
      if (materiel.quantiteStock !== undefined) updateData.quantite_stock = materiel.quantiteStock;
      if (materiel.quantiteDisponible !== undefined) updateData.quantite_disponible = materiel.quantiteDisponible;
      if (materiel.seuilAlerte !== undefined) updateData.seuil_alerte = materiel.seuilAlerte;
      if (materiel.poids !== undefined) updateData.poids = materiel.poids;
      if (materiel.dimensions !== undefined) updateData.dimensions = materiel.dimensions;
      if (materiel.garantie !== undefined) updateData.garantie = materiel.garantie;
      if (materiel.fournisseur !== undefined) updateData.fournisseur = materiel.fournisseur;

      const { data, error } = await supabase
        .from('petit_materiel')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la mise à jour du petit matériel:', error);
        throw error;
      }
      
      return { ...data, prets: [] };
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.update:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('petit_materiel')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la suppression du petit matériel:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.delete:', error);
      throw error;
    }
  }

  static async getByBarcode(codeBarre: string): Promise<PetitMateriel | null> {
    try {
      const { data, error } = await supabase
        .from('petit_materiel')
        .select(`
          *,
          prets_petit_materiel(*)
        `)
        .eq('code_barre', codeBarre)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur lors de la recherche par code-barres:', error);
        throw error;
      }
      
      return {
        ...data,
        prets: data.prets_petit_materiel || []
      };
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.getByBarcode:', error);
      throw error;
    }
  }

  static async getLowStock(): Promise<PetitMateriel[]> {
    try {
      const { data, error } = await supabase
        .from('petit_materiel')
        .select('*')
        .filter('quantite_disponible', 'lte', 'seuil_alerte')
        .order('quantite_disponible');
      
      if (error) {
        console.error('Erreur lors de la récupération des stocks faibles:', error);
        throw error;
      }
      
      return (data || []).map(item => ({ ...item, prets: [] }));
    } catch (error) {
      console.error('Erreur dans PetitMaterielService.getLowStock:', error);
      throw error;
    }
  }
}

export class PretPetitMaterielService {
  // CRUD pour les prêts
  static async getAll(): Promise<PretPetitMateriel[]> {
    try {
      const { data, error } = await supabase
        .from('prets_petit_materiel')
        .select(`
          *,
          petit_materiel(nom),
          ouvriers(nom, prenom),
          chantiers(nom)
        `)
        .order('date_debut', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des prêts:', error);
        throw error;
      }
      
      return (data || []).map(item => ({
        ...item,
        petitMaterielNom: item.petit_materiel?.nom,
        ouvrierNom: item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '',
        chantierNom: item.chantiers?.nom
      }));
    } catch (error) {
      console.error('Erreur dans PretPetitMaterielService.getAll:', error);
      throw error;
    }
  }

  static async create(pret: Omit<PretPetitMateriel, 'id' | 'ouvrierNom' | 'chantierNom' | 'petitMaterielNom'>): Promise<PretPetitMateriel> {
    try {
      const { data, error } = await supabase
        .from('prets_petit_materiel')
        .insert({
          petit_materiel_id: pret.petitMaterielId,
          ouvrier_id: pret.ouvrierId,
          chantier_id: pret.chantierId,
          date_debut: pret.dateDebut,
          date_fin: pret.dateFin,
          date_retour_prevue: pret.dateRetourPrevue,
          date_retour_effective: pret.dateRetourEffective,
          quantite: pret.quantite,
          statut: pret.statut,
          notes: pret.notes,
          etat_depart: pret.etatDepart,
          etat_retour: pret.etatRetour
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du prêt:', error);
        throw error;
      }
      
      return { ...data, petitMaterielId: data.petit_materiel_id, ouvrierId: data.ouvrier_id, chantierId: data.chantier_id };
    } catch (error) {
      console.error('Erreur dans PretPetitMaterielService.create:', error);
      throw error;
    }
  }

  static async update(id: string, pret: Partial<PretPetitMateriel>): Promise<PretPetitMateriel> {
    try {
      const updateData: any = {};
      
      if (pret.dateRetourEffective !== undefined) updateData.date_retour_effective = pret.dateRetourEffective;
      if (pret.statut !== undefined) updateData.statut = pret.statut;
      if (pret.etatRetour !== undefined) updateData.etat_retour = pret.etatRetour;
      if (pret.notes !== undefined) updateData.notes = pret.notes;

      const { data, error } = await supabase
        .from('prets_petit_materiel')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la mise à jour du prêt:', error);
        throw error;
      }
      
      return { ...data, petitMaterielId: data.petit_materiel_id, ouvrierId: data.ouvrier_id, chantierId: data.chantier_id };
    } catch (error) {
      console.error('Erreur dans PretPetitMaterielService.update:', error);
      throw error;
    }
  }

  static async getActiveLoans(): Promise<PretPetitMateriel[]> {
    try {
      const { data, error } = await supabase
        .from('prets_petit_materiel')
        .select(`
          *,
          petit_materiel(nom),
          ouvriers(nom, prenom),
          chantiers(nom)
        `)
        .in('statut', ['en_cours', 'retard'])
        .order('date_retour_prevue');
      
      if (error) {
        console.error('Erreur lors de la récupération des prêts actifs:', error);
        throw error;
      }
      
      return (data || []).map(item => ({
        ...item,
        petitMaterielNom: item.petit_materiel?.nom,
        ouvrierNom: item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '',
        chantierNom: item.chantiers?.nom
      }));
    } catch (error) {
      console.error('Erreur dans PretPetitMaterielService.getActiveLoans:', error);
      throw error;
    }
  }

  static async getOverdueLoans(): Promise<PretPetitMateriel[]> {
    try {
      const { data, error } = await supabase
        .from('prets_petit_materiel')
        .select(`
          *,
          petit_materiel(nom),
          ouvriers(nom, prenom),
          chantiers(nom)
        `)
        .eq('statut', 'retard')
        .order('date_retour_prevue');
      
      if (error) {
        console.error('Erreur lors de la récupération des prêts en retard:', error);
        throw error;
      }
      
      return (data || []).map(item => ({
        ...item,
        petitMaterielNom: item.petit_materiel?.nom,
        ouvrierNom: item.ouvriers ? `${item.ouvriers.prenom} ${item.ouvriers.nom}` : '',
        chantierNom: item.chantiers?.nom
      }));
    } catch (error) {
      console.error('Erreur dans PretPetitMaterielService.getOverdueLoans:', error);
      throw error;
    }
  }
}