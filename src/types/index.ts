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
  heuresOuvriersTotal?: number;
  heuresMaterielTotal?: number;
  coutMainOeuvre?: number;
  coutMateriel?: number;
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
  nextMaintenanceHours?: number;
  localisation?: string;
  tarifHoraire?: number;
  usageHours?: number;
  utilizationRate?: number;
  machineHours?: number;
}

export interface PetitMateriel {
  id: string;
  nom: string;
  type: string;
  marque: string;
  modele: string;
  numeroSerie: string;
  codeBarre: string;
  dateAchat: string;
  valeur: number;
  statut: 'disponible' | 'prete' | 'maintenance' | 'perdu' | 'hors_service';
  localisation: string;
  description?: string;
  quantiteStock: number;
  quantiteDisponible: number;
  seuilAlerte: number;
  poids?: number;
  dimensions?: string;
  garantie?: string;
  fournisseur?: string;
  prets: PretPetitMateriel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PretPetitMateriel {
  id: string;
  petitMaterielId: string;
  ouvrierId: string;
  chantierId?: string;
  dateDebut: string;
  dateFin?: string;
  dateRetourPrevue: string;
  dateRetourEffective?: string;
  quantite: number;
  statut: 'en_cours' | 'termine' | 'retard' | 'perdu';
  notes?: string;
  etatDepart: 'neuf' | 'bon' | 'moyen' | 'use';
  etatRetour?: 'neuf' | 'bon' | 'moyen' | 'use' | 'endommage' | 'perdu';
  ouvrierNom?: string;
  chantierNom?: string;
  petitMaterielNom?: string;
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

export interface MaintenanceType {
  id: string;
  nom: string;
  description: string;
  intervalleHeures: number;
  intervalleJours: number;
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  coutEstime?: number;
  tempsEstimeHeures?: number;
}

export interface Maintenance {
  id: string;
  materielId: string;
  typeId: string;
  datePlanifiee: string;
  dateExecution?: string;
  heuresMachineDebut?: number;
  heuresMachineFin?: number;
  dureeHeures?: number;
  cout: number;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  description: string;
  notes?: string;
  executantId?: string;
  observations?: string;
  piecesUtilisees?: string[];
  materielNom?: string;
  typeNom?: string;
  executantNom?: string;
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