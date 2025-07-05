/*
  # Suppression de toutes les données de la base de données
  
  1. Objectif
    - Vider toutes les tables de la base de données
    - Préserver la structure des tables
    - Réinitialiser les séquences
  
  2. Tables concernées
    - Toutes les tables de l'application
    
  3. Sécurité
    - Exécuter uniquement en environnement de production contrôlé
    - Faire une sauvegarde avant exécution
*/

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Vider toutes les tables en préservant la structure
TRUNCATE TABLE historique_connexions CASCADE;
TRUNCATE TABLE rapports CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE photos CASCADE;
TRUNCATE TABLE planning_events CASCADE;
TRUNCATE TABLE saisies_heures CASCADE;
TRUNCATE TABLE facture_items CASCADE;
TRUNCATE TABLE factures CASCADE;
TRUNCATE TABLE parametres_heures_sup CASCADE;
TRUNCATE TABLE utilisateurs CASCADE;
TRUNCATE TABLE materiel CASCADE;
TRUNCATE TABLE ouvriers CASCADE;
TRUNCATE TABLE chantiers CASCADE;
TRUNCATE TABLE clients CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- Insérer un utilisateur administrateur par défaut
INSERT INTO utilisateurs (
  nom, 
  prenom, 
  email, 
  role, 
  derniere_connexion, 
  actif, 
  permissions
) VALUES (
  'Admin', 
  'Système', 
  'admin@gestion-chantier.com', 
  'admin', 
  now(), 
  true, 
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
);

-- Insérer une configuration d'heures supplémentaires par défaut
INSERT INTO parametres_heures_sup (
  nom, 
  description, 
  seuil_heures_normales, 
  taux_majoration_sup,
  seuil_heures_exceptionnelles,
  taux_majoration_exceptionnelles,
  jours_travailles_semaine,
  heures_max_jour,
  heures_max_semaine,
  actif
) VALUES (
  'Configuration Standard',
  'Paramètres par défaut selon la convention collective du BTP',
  8.00,
  25.00,
  10.00,
  50.00,
  5,
  10.00,
  48.00,
  true
);