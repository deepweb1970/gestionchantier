import { Chantier, Ouvrier, Materiel, Client, Facture, SaisieHeure, Utilisateur, PlanningEvent } from '../types';

export const mockChantiers: Chantier[] = [
  {
    id: '1',
    nom: 'Construction Villa Moderne',
    description: 'Construction d\'une villa moderne de 200m² avec piscine et garage',
    client: 'Martin Dubois',
    adresse: '123 Rue de la Paix, 75001 Paris',
    dateDebut: '2024-01-15',
    dateFin: '2024-08-30',
    statut: 'actif',
    avancement: 75,
    budget: 350000,
    photos: [
      { 
        id: '1', 
        url: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg', 
        description: 'Fondations terminées', 
        date: '2024-01-20',
        category: 'avancement'
      },
      { 
        id: '2', 
        url: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg', 
        description: 'Structure béton armé', 
        date: '2024-03-15',
        category: 'avancement'
      },
      { 
        id: '3', 
        url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 
        description: 'Charpente posée', 
        date: '2024-05-10',
        category: 'avancement'
      }
    ],
    coordinates: { lat: 48.8566, lng: 2.3522 }
  },
  {
    id: '2',
    nom: 'Rénovation Appartement Haussmannien',
    description: 'Rénovation complète d\'un appartement 4 pièces avec création d\'une suite parentale',
    client: 'Sophie Martin',
    adresse: '45 Avenue des Champs-Élysées, 75008 Paris',
    dateDebut: '2024-03-01',
    dateFin: '2024-07-15',
    statut: 'actif',
    avancement: 45,
    budget: 120000,
    photos: [
      { 
        id: '4', 
        url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 
        description: 'État avant travaux', 
        date: '2024-02-28',
        category: 'avant'
      },
      { 
        id: '5', 
        url: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg', 
        description: 'Démolition cloisons', 
        date: '2024-03-10',
        category: 'avancement'
      }
    ],
    coordinates: { lat: 48.8698, lng: 2.3076 }
  },
  {
    id: '3',
    nom: 'Extension Maison Contemporaine',
    description: 'Extension de 80m² avec véranda et terrasse surélevée',
    client: 'Pierre Durand',
    adresse: '78 Rue du Commerce, 13001 Marseille',
    dateDebut: '2024-02-01',
    dateFin: '2024-06-30',
    statut: 'termine',
    avancement: 100,
    budget: 180000,
    photos: [
      { 
        id: '6', 
        url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 
        description: 'Extension terminée', 
        date: '2024-06-25',
        category: 'apres'
      }
    ],
    coordinates: { lat: 43.2965, lng: 5.3698 }
  },
  {
    id: '4',
    nom: 'Immeuble de Bureaux',
    description: 'Construction d\'un immeuble de bureaux R+3 avec parking souterrain',
    client: 'Entreprise ABC',
    adresse: '12 Zone Industrielle, 69100 Villeurbanne',
    dateDebut: '2024-04-01',
    dateFin: '2025-02-28',
    statut: 'actif',
    avancement: 25,
    budget: 850000,
    photos: [
      { 
        id: '7', 
        url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg', 
        description: 'Terrassement en cours', 
        date: '2024-04-15',
        category: 'avancement'
      }
    ],
    coordinates: { lat: 45.7640, lng: 4.8357 }
  },
  {
    id: '5',
    nom: 'Rénovation Énergétique',
    description: 'Isolation thermique et installation pompe à chaleur',
    client: 'Marie Lefevre',
    adresse: '34 Rue de la République, 33000 Bordeaux',
    dateDebut: '2024-05-15',
    dateFin: '2024-07-30',
    statut: 'planifie',
    avancement: 0,
    budget: 65000,
    photos: [],
    coordinates: { lat: 44.8378, lng: -0.5792 }
  }
];

export const mockOuvriers: Ouvrier[] = [
  {
    id: '1',
    nom: 'Dubois',
    prenom: 'Jean',
    email: 'jean.dubois@chantier.com',
    telephone: '0123456789',
    qualification: 'Chef d\'équipe Maçon',
    certifications: ['CACES R482', 'Habilitation électrique B0', 'SST'],
    dateEmbauche: '2020-01-15',
    statut: 'actif',
    tauxHoraire: 28,
    adresse: '12 Rue de la Construction, 75019 Paris',
    documents: []
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Paul',
    email: 'paul.martin@chantier.com',
    telephone: '0123456790',
    qualification: 'Électricien',
    certifications: ['Habilitation électrique B2V', 'IRVE', 'Qualifelec'],
    dateEmbauche: '2021-03-10',
    statut: 'actif',
    tauxHoraire: 26,
    adresse: '34 Avenue de l\'Électricité, 69003 Lyon',
    documents: []
  },
  {
    id: '3',
    nom: 'Leroy',
    prenom: 'Michel',
    email: 'michel.leroy@chantier.com',
    telephone: '0123456791',
    qualification: 'Plombier-Chauffagiste',
    certifications: ['PGN', 'Soudure cuivre', 'RGE QualiPAC'],
    dateEmbauche: '2019-06-20',
    statut: 'actif',
    tauxHoraire: 25,
    adresse: '56 Rue de la Plomberie, 13002 Marseille',
    documents: []
  },
  {
    id: '4',
    nom: 'Rousseau',
    prenom: 'Antoine',
    email: 'antoine.rousseau@chantier.com',
    telephone: '0123456792',
    qualification: 'Charpentier',
    certifications: ['CACES R486', 'Travail en hauteur'],
    dateEmbauche: '2022-09-01',
    statut: 'actif',
    tauxHoraire: 24,
    adresse: '89 Impasse du Bois, 31000 Toulouse',
    documents: []
  },
  {
    id: '5',
    nom: 'Moreau',
    prenom: 'Sylvie',
    email: 'sylvie.moreau@chantier.com',
    telephone: '0123456793',
    qualification: 'Peintre en bâtiment',
    certifications: ['CQP Peintre', 'Échafaudage'],
    dateEmbauche: '2023-02-15',
    statut: 'actif',
    tauxHoraire: 22,
    adresse: '23 Rue des Artistes, 44000 Nantes',
    documents: []
  },
  {
    id: '6',
    nom: 'Bernard',
    prenom: 'Luc',
    email: 'luc.bernard@chantier.com',
    telephone: '0123456794',
    qualification: 'Carreleur',
    certifications: ['CAP Carrelage', 'Mosaïque'],
    dateEmbauche: '2021-11-08',
    statut: 'conge',
    tauxHoraire: 23,
    adresse: '67 Boulevard des Finitions, 67000 Strasbourg',
    documents: []
  }
];

export const mockMateriel: Materiel[] = [
  {
    id: '1',
    nom: 'Pelleteuse CAT320D',
    type: 'Engin de terrassement',
    marque: 'Caterpillar',
    modele: '320D',
    numeroSerie: 'CAT320D001',
    dateAchat: '2022-01-15',
    valeur: 180000,
    statut: 'en_service',
    prochaineMaintenance: '2024-08-15',
    localisation: 'Construction Villa Moderne',
    tarifHoraire: 85
  },
  {
    id: '2',
    nom: 'Bétonnière Altrad B180',
    type: 'Équipement de construction',
    marque: 'Altrad',
    modele: 'B180',
    numeroSerie: 'ALT180B002',
    dateAchat: '2023-05-10',
    valeur: 1200,
    statut: 'disponible',
    prochaineMaintenance: '2024-09-01',
    localisation: 'Dépôt principal',
    tarifHoraire: 15
  },
  {
    id: '3',
    nom: 'Grue mobile Liebherr',
    type: 'Engin de levage',
    marque: 'Liebherr',
    modele: 'LTM1030',
    numeroSerie: 'LIE1030003',
    dateAchat: '2021-08-20',
    valeur: 450000,
    statut: 'maintenance',
    prochaineMaintenance: '2024-07-30',
    localisation: 'Atelier',
    tarifHoraire: 120
  },
  {
    id: '4',
    nom: 'Compacteur Bomag',
    type: 'Engin de compactage',
    marque: 'Bomag',
    modele: 'BW120AD',
    numeroSerie: 'BOM120004',
    dateAchat: '2023-03-12',
    valeur: 35000,
    statut: 'en_service',
    prochaineMaintenance: '2024-10-15',
    localisation: 'Immeuble de Bureaux',
    tarifHoraire: 45
  },
  {
    id: '5',
    nom: 'Nacelle Haulotte',
    type: 'Plateforme élévatrice',
    marque: 'Haulotte',
    modele: 'Compact 12',
    numeroSerie: 'HAU12005',
    dateAchat: '2022-11-05',
    valeur: 28000,
    statut: 'disponible',
    prochaineMaintenance: '2024-08-20',
    localisation: 'Dépôt principal',
    tarifHoraire: 35
  },
  {
    id: '6',
    nom: 'Marteau-piqueur Hilti',
    type: 'Outillage électroportatif',
    marque: 'Hilti',
    modele: 'TE 3000-AVR',
    numeroSerie: 'HIL3000006',
    dateAchat: '2023-07-18',
    valeur: 2500,
    statut: 'en_service',
    prochaineMaintenance: '2024-07-18',
    localisation: 'Rénovation Appartement Haussmannien',
    tarifHoraire: 8
  }
];

export const mockClients: Client[] = [
  {
    id: '1',
    nom: 'Martin Dubois',
    type: 'particulier',
    email: 'martin.dubois@email.com',
    telephone: '0123456789',
    adresse: '123 Rue de la Paix, 75001 Paris',
    contactPrincipal: 'Martin Dubois',
    notes: 'Client fidèle depuis 2020, toujours ponctuel dans les paiements. Recommande souvent nos services.',
    projets: ['1']
  },
  {
    id: '2',
    nom: 'Sophie Martin',
    type: 'particulier',
    email: 'sophie.martin@email.com',
    telephone: '0123456790',
    adresse: '45 Avenue des Champs-Élysées, 75008 Paris',
    contactPrincipal: 'Sophie Martin',
    notes: 'Architecte d\'intérieur, très exigeante sur la qualité des finitions.',
    projets: ['2']
  },
  {
    id: '3',
    nom: 'Pierre Durand',
    type: 'particulier',
    email: 'pierre.durand@email.com',
    telephone: '0123456791',
    adresse: '78 Rue du Commerce, 13001 Marseille',
    contactPrincipal: 'Pierre Durand',
    notes: 'Projet d\'extension terminé avec satisfaction. Envisage d\'autres travaux.',
    projets: ['3']
  },
  {
    id: '4',
    nom: 'Entreprise ABC',
    type: 'entreprise',
    email: 'contact@entreprise-abc.com',
    telephone: '0123456792',
    adresse: '12 Zone Industrielle, 69100 Villeurbanne',
    siret: '12345678901234',
    contactPrincipal: 'Directeur Général - M. Leblanc',
    notes: 'Gros client corporate, projets récurrents. Délais de paiement 60 jours.',
    projets: ['4']
  },
  {
    id: '5',
    nom: 'Marie Lefevre',
    type: 'particulier',
    email: 'marie.lefevre@email.com',
    telephone: '0123456793',
    adresse: '34 Rue de la République, 33000 Bordeaux',
    contactPrincipal: 'Marie Lefevre',
    notes: 'Sensible aux questions environnementales, privilégie les matériaux écologiques.',
    projets: ['5']
  },
  {
    id: '6',
    nom: 'SCI Immobilier Plus',
    type: 'entreprise',
    email: 'gestion@sci-immobilier.com',
    telephone: '0123456794',
    adresse: '89 Avenue de la Liberté, 59000 Lille',
    siret: '98765432109876',
    contactPrincipal: 'Gestionnaire - Mme Petit',
    notes: 'Société civile immobilière, gère plusieurs biens en rénovation.',
    projets: []
  }
];

export const mockFactures: Facture[] = [
  {
    id: '1',
    numero: 'FAC-2024-001',
    clientId: '1',
    chantierId: '1',
    dateEmission: '2024-01-15',
    dateEcheance: '2024-02-15',
    montantHT: 25000,
    tva: 5000,
    montantTTC: 30000,
    statut: 'payee',
    items: [
      { id: '1', description: 'Fondations et terrassement', quantite: 1, prixUnitaire: 25000, total: 25000 }
    ]
  },
  {
    id: '2',
    numero: 'FAC-2024-002',
    clientId: '2',
    chantierId: '2',
    dateEmission: '2024-03-01',
    dateEcheance: '2024-04-01',
    montantHT: 15000,
    tva: 3000,
    montantTTC: 18000,
    statut: 'payee',
    items: [
      { id: '2', description: 'Démolition et évacuation', quantite: 1, prixUnitaire: 15000, total: 15000 }
    ]
  },
  {
    id: '3',
    numero: 'FAC-2024-003',
    clientId: '1',
    chantierId: '1',
    dateEmission: '2024-05-15',
    dateEcheance: '2024-06-15',
    montantHT: 45000,
    tva: 9000,
    montantTTC: 54000,
    statut: 'envoyee',
    items: [
      { id: '3', description: 'Gros œuvre et charpente', quantite: 1, prixUnitaire: 45000, total: 45000 }
    ]
  },
  {
    id: '4',
    numero: 'FAC-2024-004',
    clientId: '4',
    chantierId: '4',
    dateEmission: '2024-06-01',
    dateEcheance: '2024-08-01',
    montantHT: 120000,
    tva: 24000,
    montantTTC: 144000,
    statut: 'envoyee',
    items: [
      { id: '4', description: 'Terrassement et fondations immeuble', quantite: 1, prixUnitaire: 120000, total: 120000 }
    ]
  },
  {
    id: '5',
    numero: 'FAC-2024-005',
    clientId: '3',
    chantierId: '3',
    dateEmission: '2024-06-30',
    dateEcheance: '2024-07-30',
    montantHT: 35000,
    tva: 7000,
    montantTTC: 42000,
    statut: 'retard',
    items: [
      { id: '5', description: 'Finitions extension', quantite: 1, prixUnitaire: 35000, total: 35000 }
    ]
  }
];

export const mockSaisiesHeures: SaisieHeure[] = [
  // Semaine du 15-19 Janvier 2024
  {
    id: '1',
    ouvrierId: '1',
    chantierId: '1',
    materielId: '1',
    date: '2024-01-15',
    heureDebut: '08:00',
    heureFin: '17:30',
    heuresNormales: 8,
    heuresSupplementaires: 1.5,
    description: 'Terrassement avec pelleteuse - préparation fondations',
    valide: true
  },
  {
    id: '2', 
    ouvrierId: '2',
    chantierId: '1',
    date: '2024-01-15',
    heureDebut: '09:00',
    heureFin: '18:00',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Installation tableau électrique provisoire',
    valide: true
  },
  {
    id: '3',
    ouvrierId: '3',
    chantierId: '2',
    date: '2024-01-16',
    heureDebut: '08:30',
    heureFin: '16:30',
    heuresNormales: 8,
    heuresSupplementaires: 0,
    description: 'Démolition cloisons anciennes',
    valide: true
  },
  {
    id: '4',
    ouvrierId: '1',
    chantierId: '1',
    materielId: '2',
    date: '2024-01-17',
    heureDebut: '08:00',
    heureFin: '19:00',
    heuresNormales: 8,
    heuresSupplementaires: 3,
    description: 'Coulage béton fondations avec bétonnière - urgence météo',
    valide: true
  },
  {
    id: '5',
    ouvrierId: '4',
    chantierId: '1',
    date: '2024-01-18',
    heureDebut: '09:00',
    heureFin: '17:00',
    heuresNormales: 8,
    heuresSupplementaires: 0,
    description: 'Préparation charpente - découpe et assemblage',
    valide: false
  },
  // Semaine du 22-26 Janvier 2024
  {
    id: '6',
    ouvrierId: '2',
    chantierId: '2',
    materielId: '6',
    date: '2024-01-22',
    heureDebut: '08:00',
    heureFin: '17:00',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Perçage murs porteurs avec marteau-piqueur',
    valide: false
  },
  {
    id: '7',
    ouvrierId: '5',
    chantierId: '2',
    date: '2024-01-23',
    heureDebut: '09:00',
    heureFin: '16:00',
    heuresNormales: 7,
    heuresSupplementaires: 0,
    description: 'Préparation surfaces pour peinture',
    valide: false
  },
  {
    id: '8',
    ouvrierId: '3',
    chantierId: '1',
    date: '2024-01-24',
    heureDebut: '08:30',
    heureFin: '17:30',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Installation plomberie sanitaires',
    valide: false
  },
  // Semaine du 29 Janvier - 2 Février 2024
  {
    id: '9',
    ouvrierId: '1',
    chantierId: '4',
    materielId: '4',
    date: '2024-01-29',
    heureDebut: '07:30',
    heureFin: '16:30',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Compactage terrain avec compacteur Bomag',
    valide: false
  },
  {
    id: '10',
    ouvrierId: '4',
    chantierId: '1',
    materielId: '5',
    date: '2024-01-30',
    heureDebut: '08:00',
    heureFin: '18:30',
    heuresNormales: 8,
    heuresSupplementaires: 2.5,
    description: 'Pose charpente avec nacelle - rattrapage planning',
    valide: false
  },
  // Février 2024
  {
    id: '11',
    ouvrierId: '2',
    chantierId: '1',
    date: '2024-02-05',
    heureDebut: '08:00',
    heureFin: '17:00',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Câblage électrique étages',
    valide: true
  },
  {
    id: '12',
    ouvrierId: '5',
    chantierId: '2',
    date: '2024-02-06',
    heureDebut: '09:00',
    heureFin: '17:30',
    heuresNormales: 8,
    heuresSupplementaires: 0.5,
    description: 'Peinture chambres - première couche',
    valide: true
  },
  // Mars 2024
  {
    id: '13',
    ouvrierId: '3',
    chantierId: '2',
    date: '2024-03-12',
    heureDebut: '08:00',
    heureFin: '16:00',
    heuresNormales: 8,
    heuresSupplementaires: 0,
    description: 'Installation chauffage central',
    valide: true
  },
  {
    id: '14',
    ouvrierId: '1',
    chantierId: '1',
    date: '2024-03-15',
    heureDebut: '08:30',
    heureFin: '18:00',
    heuresNormales: 8,
    heuresSupplementaires: 1.5,
    description: 'Montage murs porteurs étage',
    valide: false
  },
  // Données récentes - Juillet 2024
  {
    id: '15',
    ouvrierId: '4',
    chantierId: '1',
    date: '2024-07-08',
    heureDebut: '08:00',
    heureFin: '17:00',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Pose couverture toiture',
    valide: false
  },
  {
    id: '16',
    ouvrierId: '2',
    chantierId: '4',
    date: '2024-07-09',
    heureDebut: '07:30',
    heureFin: '16:30',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Installation électrique immeuble - RDC',
    valide: false
  },
  {
    id: '17',
    ouvrierId: '5',
    chantierId: '1',
    date: '2024-07-10',
    heureDebut: '09:00',
    heureFin: '18:00',
    heuresNormales: 8,
    heuresSupplementaires: 1,
    description: 'Peinture façade extérieure',
    valide: false
  },
  {
    id: '18',
    ouvrierId: '3',
    chantierId: '4',
    date: '2024-07-11',
    heureDebut: '08:00',
    heureFin: '17:30',
    heuresNormales: 8,
    heuresSupplementaires: 1.5,
    description: 'Plomberie sanitaires collectifs',
    valide: false
  }
];

export const mockUtilisateurs: Utilisateur[] = [
  {
    id: '1',
    nom: 'Admin',
    prenom: 'Super',
    email: 'admin@chantier.com',
    role: 'admin',
    dernierConnexion: '2024-07-12T10:30:00',
    actif: true,
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
  },
  {
    id: '2',
    nom: 'Manager',
    prenom: 'Chef',
    email: 'manager@chantier.com',
    role: 'manager',
    dernierConnexion: '2024-07-11T16:45:00',
    actif: true,
    permissions: ['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports']
  },
  {
    id: '3',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@chantier.com',
    role: 'employe',
    dernierConnexion: '2024-07-10T09:20:00',
    actif: true,
    permissions: ['read', 'view_reports']
  },
  {
    id: '4',
    nom: 'Bernard',
    prenom: 'Pierre',
    email: 'pierre.bernard@chantier.com',
    role: 'employe',
    dernierConnexion: '2024-07-05T14:30:00',
    actif: false,
    permissions: ['read']
  },
  {
    id: '5',
    nom: 'Moreau',
    prenom: 'Julie',
    email: 'julie.moreau@chantier.com',
    role: 'manager',
    dernierConnexion: '2024-07-12T08:15:00',
    actif: true,
    permissions: ['read', 'write', 'manage_workers', 'manage_projects', 'view_reports']
  }
];

export const mockPlanningEvents: PlanningEvent[] = [
  // Juillet 2024
  {
    id: '1',
    titre: 'Chantier Villa Moderne - Toiture',
    description: 'Pose de la couverture et isolation',
    dateDebut: '2024-07-15T08:00:00',
    dateFin: '2024-07-15T17:00:00',
    chantierId: '1',
    ouvrierId: '4',
    materielId: '5',
    type: 'chantier'
  },
  {
    id: '2',
    titre: 'Maintenance Pelleteuse',
    description: 'Révision 500h et contrôle hydraulique',
    dateDebut: '2024-07-20T09:00:00',
    dateFin: '2024-07-20T15:00:00',
    materielId: '1',
    type: 'maintenance'
  },
  {
    id: '3',
    titre: 'Formation Sécurité Chantier',
    description: 'Formation obligatoire sécurité et EPI',
    dateDebut: '2024-07-22T14:00:00',
    dateFin: '2024-07-22T17:00:00',
    ouvrierId: '5',
    type: 'formation'
  },
  {
    id: '4',
    titre: 'Congé Été - Michel Leroy',
    description: 'Congé payé été',
    dateDebut: '2024-07-25T00:00:00',
    dateFin: '2024-08-09T23:59:59',
    ouvrierId: '3',
    type: 'conge'
  },
  {
    id: '5',
    titre: 'Rénovation Appartement - Électricité',
    description: 'Installation nouveau tableau et prises',
    dateDebut: '2024-07-16T08:30:00',
    dateFin: '2024-07-16T17:30:00',
    chantierId: '2',
    ouvrierId: '2',
    type: 'chantier'
  },
  {
    id: '6',
    titre: 'Maintenance Grue Mobile',
    description: 'Contrôle mensuel et test de charge',
    dateDebut: '2024-07-18T10:00:00',
    dateFin: '2024-07-18T16:00:00',
    materielId: '3',
    type: 'maintenance'
  },
  {
    id: '7',
    titre: 'Immeuble Bureaux - Terrassement',
    description: 'Continuation terrassement parking souterrain',
    dateDebut: '2024-07-17T07:30:00',
    dateFin: '2024-07-17T16:30:00',
    chantierId: '4',
    ouvrierId: '1',
    materielId: '4',
    type: 'chantier'
  },
  {
    id: '8',
    titre: 'Formation CACES R482',
    description: 'Recyclage CACES engins de chantier',
    dateDebut: '2024-07-24T08:00:00',
    dateFin: '2024-07-24T17:00:00',
    ouvrierId: '1',
    type: 'formation'
  },
  // Août 2024
  {
    id: '9',
    titre: 'Villa Moderne - Finitions',
    description: 'Peinture intérieure et pose parquet',
    dateDebut: '2024-08-05T08:00:00',
    dateFin: '2024-08-05T17:00:00',
    chantierId: '1',
    ouvrierId: '5',
    type: 'chantier'
  },
  {
    id: '10',
    titre: 'Maintenance Compacteur',
    description: 'Vidange et contrôle général',
    dateDebut: '2024-08-12T09:00:00',
    dateFin: '2024-08-12T12:00:00',
    materielId: '4',
    type: 'maintenance'
  }
];