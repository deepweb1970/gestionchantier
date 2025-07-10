export interface Chantier {
  id: string;
  nom: string;
  description: string;
  client: string;
  adresse: string;
  dateDebut: string;
  dateFin?: string;
  statut: 'actif' | 'termine' | 'pause' | 'planifie';
  avancement: number;
  budget: number;
  photos: Photo[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Photo {
  id: string;
  url: string;
  description: string;
  date: string;
  category?: 'avancement' | 'probleme' | 'materiel' | 'securite' | 'finition' | 'avant' | 'apres';
  filename?: string;
  size?: number;
  chantierId?: string;
  chantierNom?: string;
}

export interface Ouvrier {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  qualification: string;
  certifications: string[];
  dateEmbauche: string;
  statut: 'actif' | 'conge' | 'arret' | 'indisponible';
  tauxHoraire: number;
  adresse: string;
  documents: Document[];
}

export interface Materiel {
  id: string;
  nom: string;
  type: string;
  marque: string;
  modele: string;
  numeroSerie: string;
  dateAchat: string;
  valeur: number;
  statut: 'disponible' | 'en_service' | 'maintenance' | 'hors_service';
  prochaineMaintenance?: string;
  localisation?: string;
  tarifHoraire?: number;
  usageHours?: number;
  utilizationRate?: number;
}

export interface Client {
  id: string;
  nom: string;
  type: 'particulier' | 'entreprise';
  email: string;
  telephone: string;
  adresse: string;
  siret?: string;
  contactPrincipal: string;
  notes: string;
  projets: string[];
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  chantierId: string;
  dateEmission: string;
  dateEcheance: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee';
  items: FactureItem[];
}

export interface FactureItem {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export interface SaisieHeure {
  id: string;
  ouvrierId: string;
  chantierId: string;
  materielId?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  heuresNormales: number;
  heuresSupplementaires: number;
  heuresExceptionnelles?: number;
  description: string;
  valide: boolean;
  parametresId?: string;
}

// Version simplifiée de SaisieHeure avec heures totales
export interface SimpleSaisieHeure {
  id: string;
  ouvrierId: string;
  chantierId: string;
  materielId?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  heuresTotal: number;
  description: string;
  valide: boolean;
}

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'manager' | 'employe';
  dernierConnexion: string;
  actif: boolean;
  permissions: string[];
}

export interface Document {
  id: string;
  nom: string;
  type: string;
  url: string;
  dateUpload: string;
}

export interface PlanningEvent {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  chantierId?: string;
  ouvrierId?: string;
  materielId?: string;
  type: 'chantier' | 'maintenance' | 'conge' | 'formation';
}

export type RapportType = 'performance' | 'couts' | 'activite' | 'financier' | 'ressources';

export interface Rapport {
  id: string;
  nom: string;
  type: RapportType;
  dateDebut: string;
  dateFin: string;
  parametres: {
    chantiers?: string[];
    ouvriers?: string[];
    materiel?: string[];
  };
  dateCreation: string;
  creePar: string;
}

export interface ParametresHeuresSup {
  id: string;
  nom: string;
  description?: string;
  seuilHeuresNormales: number;
  tauxMajorationSup: number;
  seuilHeuresExceptionnelles: number;
  tauxMajorationExceptionnelles: number;
  joursTravaillesSemaine: number;
  heuresMaxJour: number;
  heuresMaxSemaine: number;
  actif: boolean;
}