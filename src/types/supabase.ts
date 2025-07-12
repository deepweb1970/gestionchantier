export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          nom: string
          type: 'particulier' | 'entreprise'
          email: string
          telephone: string
          adresse: string
          siret: string | null
          contact_principal: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: 'particulier' | 'entreprise'
          email: string
          telephone: string
          adresse: string
          siret?: string | null
          contact_principal: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: 'particulier' | 'entreprise'
          email?: string
          telephone?: string
          adresse?: string
          siret?: string | null
          contact_principal?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      chantiers: {
        Row: {
          id: string
          nom: string
          description: string
          client_id: string | null
          adresse: string
          date_debut: string
          date_fin: string | null
          statut: 'actif' | 'termine' | 'pause' | 'planifie'
          avancement: number | null
          budget: number | null
          heures_ouvriers_total: number | null
          heures_materiel_total: number | null
          cout_main_oeuvre: number | null
          cout_materiel: number | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          description: string
          client_id?: string | null
          adresse: string
          date_debut: string
          date_fin?: string | null
          statut?: 'actif' | 'termine' | 'pause' | 'planifie'
          avancement?: number | null
          budget?: number | null
          heures_ouvriers_total?: number | null
          heures_materiel_total?: number | null
          cout_main_oeuvre?: number | null
          cout_materiel?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          description?: string
          client_id?: string | null
          adresse?: string
          date_debut?: string
          date_fin?: string | null
          statut?: 'actif' | 'termine' | 'pause' | 'planifie'
          avancement?: number | null
          budget?: number | null
          heures_ouvriers_total?: number | null
          heures_materiel_total?: number | null
          cout_main_oeuvre?: number | null
          cout_materiel?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ouvriers: {
        Row: {
          id: string
          nom: string
          prenom: string
          email: string
          telephone: string
          qualification: string
          certifications: string[] | null
          date_embauche: string
          statut: 'actif' | 'conge' | 'arret' | 'indisponible'
          taux_horaire: number
          adresse: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          prenom: string
          email: string
          telephone: string
          qualification: string
          certifications?: string[] | null
          date_embauche: string
          statut?: 'actif' | 'conge' | 'arret' | 'indisponible'
          taux_horaire: number
          adresse: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          prenom?: string
          email?: string
          telephone?: string
          qualification?: string
          certifications?: string[] | null
          date_embauche?: string
          statut?: 'actif' | 'conge' | 'arret' | 'indisponible'
          taux_horaire?: number
          adresse?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      materiel: {
        Row: {
          id: string
          nom: string
          type: string
          marque: string
          modele: string
          numero_serie: string
          date_achat: string
          valeur: number
          statut: 'disponible' | 'en_service' | 'maintenance' | 'hors_service'
          prochaine_maintenance: string | null
          localisation: string | null
          tarif_horaire: number | null
          usage_hours: number | null
          utilization_rate: number | null
          machine_hours: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: string
          marque: string
          modele: string
          numero_serie: string
          date_achat: string
          valeur: number
          statut?: 'disponible' | 'en_service' | 'maintenance' | 'hors_service'
          prochaine_maintenance?: string | null
          localisation?: string | null
          tarif_horaire?: number | null
          usage_hours?: number | null
          utilization_rate?: number | null
          machine_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: string
          marque?: string
          modele?: string
          numero_serie?: string
          date_achat?: string
          valeur?: number
          statut?: 'disponible' | 'en_service' | 'maintenance' | 'hors_service'
          prochaine_maintenance?: string | null
          localisation?: string | null
          tarif_horaire?: number | null
          usage_hours?: number | null
          utilization_rate?: number | null
          machine_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          chantier_id: string | null
          url: string
          description: string
          date: string
          category: 'avancement' | 'probleme' | 'materiel' | 'securite' | 'finition' | 'avant' | 'apres' | null
          filename: string | null
          size_bytes: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          chantier_id?: string | null
          url: string
          description: string
          date: string
          category?: 'avancement' | 'probleme' | 'materiel' | 'securite' | 'finition' | 'avant' | 'apres' | null
          filename?: string | null
          size_bytes?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string | null
          url?: string
          description?: string
          date?: string
          category?: 'avancement' | 'probleme' | 'materiel' | 'securite' | 'finition' | 'avant' | 'apres' | null
          filename?: string | null
          size_bytes?: number | null
          created_at?: string | null
        }
      }
      factures: {
        Row: {
          id: string
          numero: string
          client_id: string | null
          chantier_id: string | null
          date_emission: string
          date_echeance: string
          montant_ht: number
          tva: number
          montant_ttc: number
          statut: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          numero: string
          client_id?: string | null
          chantier_id?: string | null
          date_emission: string
          date_echeance: string
          montant_ht?: number
          tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          numero?: string
          client_id?: string | null
          chantier_id?: string | null
          date_emission?: string
          date_echeance?: string
          montant_ht?: number
          tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      facture_items: {
        Row: {
          id: string
          facture_id: string | null
          description: string
          quantite: number
          prix_unitaire: number
          total: number
          created_at: string | null
        }
        Insert: {
          id?: string
          facture_id?: string | null
          description: string
          quantite?: number
          prix_unitaire: number
          total: number
          created_at?: string | null
        }
        Update: {
          id?: string
          facture_id?: string | null
          description?: string
          quantite?: number
          prix_unitaire?: number
          total?: number
          created_at?: string | null
        }
      }
      saisies_heures: {
        Row: {
          id: string
          ouvrier_id: string | null
          chantier_id: string | null
          materiel_id: string | null
          date: string
          heure_debut: string
          heure_fin: string
          heures_normales: number
          heures_supplementaires: number
          description: string
          valide: boolean | null
          created_at: string | null
          updated_at: string | null
          parametres_id: string | null
          heures_exceptionnelles: number | null
          heures_total: number | null
        }
        Insert: {
          id?: string
          ouvrier_id?: string | null
          chantier_id?: string | null
          materiel_id?: string | null
          date: string
          heure_debut: string
          heure_fin: string
          heures_normales?: number
          heures_supplementaires?: number
          description: string
          valide?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parametres_id?: string | null
          heures_exceptionnelles?: number | null
          heures_total?: number | null
        }
        Update: {
          id?: string
          ouvrier_id?: string | null
          chantier_id?: string | null
          materiel_id?: string | null
          date?: string
          heure_debut?: string
          heure_fin?: string
          heures_normales?: number
          heures_supplementaires?: number
          description?: string
          valide?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parametres_id?: string | null
          heures_exceptionnelles?: number | null
          heures_total?: number | null
        }
      }
      planning_events: {
        Row: {
          id: string
          titre: string
          description: string | null
          date_debut: string
          date_fin: string
          chantier_id: string | null
          ouvrier_id: string | null
          materiel_id: string | null
          type: 'chantier' | 'maintenance' | 'conge' | 'formation'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          titre: string
          description?: string | null
          date_debut: string
          date_fin: string
          chantier_id?: string | null
          ouvrier_id?: string | null
          materiel_id?: string | null
          type: 'chantier' | 'maintenance' | 'conge' | 'formation'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          titre?: string
          description?: string | null
          date_debut?: string
          date_fin?: string
          chantier_id?: string | null
          ouvrier_id?: string | null
          materiel_id?: string | null
          type?: 'chantier' | 'maintenance' | 'conge' | 'formation'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      utilisateurs: {
        Row: {
          id: string
          nom: string
          prenom: string
          email: string
          role: 'admin' | 'manager' | 'employe'
          derniere_connexion: string | null
          actif: boolean | null
          permissions: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          prenom: string
          email: string
          role?: 'admin' | 'manager' | 'employe'
          derniere_connexion?: string | null
          actif?: boolean | null
          permissions?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          prenom?: string
          email?: string
          role?: 'admin' | 'manager' | 'employe'
          derniere_connexion?: string | null
          actif?: boolean | null
          permissions?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          nom: string
          type: string
          url: string
          ouvrier_id: string | null
          chantier_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: string
          url: string
          ouvrier_id?: string | null
          chantier_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: string
          url?: string
          ouvrier_id?: string | null
          chantier_id?: string | null
          created_at?: string | null
        }
      }
      rapports: {
        Row: {
          id: string
          nom: string
          type: 'performance' | 'couts' | 'activite' | 'financier' | 'ressources'
          date_debut: string
          date_fin: string
          parametres: Json | null
          cree_par: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: 'performance' | 'couts' | 'activite' | 'financier' | 'ressources'
          date_debut: string
          date_fin: string
          parametres?: Json | null
          cree_par?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: 'performance' | 'couts' | 'activite' | 'financier' | 'ressources'
          date_debut?: string
          date_fin?: string
          parametres?: Json | null
          cree_par?: string | null
          created_at?: string | null
        }
      }
      historique_connexions: {
        Row: {
          id: string
          utilisateur_id: string | null
          date_connexion: string | null
          adresse_ip: string | null
          navigateur: string | null
          appareil: string | null
          succes: boolean | null
        }
        Insert: {
          id?: string
          utilisateur_id?: string | null
          date_connexion?: string | null
          adresse_ip?: string | null
          navigateur?: string | null
          appareil?: string | null
          succes?: boolean | null
        }
        Update: {
          id?: string
          utilisateur_id?: string | null
          date_connexion?: string | null
          adresse_ip?: string | null
          navigateur?: string | null
          appareil?: string | null
          succes?: boolean | null
        }
      }
      parametres_heures_sup: {
        Row: {
          id: string
          nom: string
          description: string | null
          seuil_heures_normales: number
          taux_majoration_sup: number
          seuil_heures_exceptionnelles: number
          taux_majoration_exceptionnelles: number
          jours_travailles_semaine: number
          heures_max_jour: number
          heures_max_semaine: number
          actif: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          seuil_heures_normales?: number
          taux_majoration_sup?: number
          seuil_heures_exceptionnelles?: number
          taux_majoration_exceptionnelles?: number
          jours_travailles_semaine?: number
          heures_max_jour?: number
          heures_max_semaine?: number
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          seuil_heures_normales?: number
          taux_majoration_sup?: number
          seuil_heures_exceptionnelles?: number
          taux_majoration_exceptionnelles?: number
          jours_travailles_semaine?: number
          heures_max_jour?: number
          heures_max_semaine?: number
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface MaintenanceTypes {
  public: {
    Tables: {
      maintenance_types: {
        Row: {
          id: string
          nom: string
          description: string | null
          intervalle_heures: number | null
          intervalle_jours: number | null
          priorite: 'basse' | 'moyenne' | 'haute' | 'critique'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          intervalle_heures?: number | null
          intervalle_jours?: number | null
          priorite: 'basse' | 'moyenne' | 'haute' | 'critique'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          intervalle_heures?: number | null
          intervalle_jours?: number | null
          priorite?: 'basse' | 'moyenne' | 'haute' | 'critique'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      maintenances: {
        Row: {
          id: string
          materiel_id: string
          type_id: string | null
          date_planifiee: string
          date_execution: string | null
          heures_machine_debut: number | null
          heures_machine_fin: number | null
          duree_heures: number | null
          cout: number
          statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
          description: string
          notes: string | null
          executant_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          materiel_id: string
          type_id?: string | null
          date_planifiee: string
          date_execution?: string | null
          heures_machine_debut?: number | null
          heures_machine_fin?: number | null
          duree_heures?: number | null
          cout?: number
          statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
          description: string
          notes?: string | null
          executant_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          materiel_id?: string
          type_id?: string | null
          date_planifiee?: string
          date_execution?: string | null
          heures_machine_debut?: number | null
          heures_machine_fin?: number | null
          duree_heures?: number | null
          cout?: number
          statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
          description?: string
          notes?: string | null
          executant_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}