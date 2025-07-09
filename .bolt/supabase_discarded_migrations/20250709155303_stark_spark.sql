/*
  # Fixed data migration with dynamic IDs

  1. Changes
    - Uses dynamic UUID generation instead of hardcoded IDs
    - Maintains all the same data relationships
    - Avoids primary key conflicts
    - Preserves all the original data

  2. Implementation
    - Uses DO block with PL/pgSQL for safer execution
    - Checks if data already exists before inserting
    - Uses variables to maintain relationships between entities
*/

DO $$
DECLARE
  client_count integer;
  client_martin_id uuid;
  client_sophie_id uuid;
  client_pierre_id uuid;
  client_abc_id uuid;
  client_marie_id uuid;
  client_sci_id uuid;
  
  chantier_villa_id uuid;
  chantier_appart_id uuid;
  chantier_extension_id uuid;
  chantier_immeuble_id uuid;
  chantier_energie_id uuid;
  
  ouvrier_jean_id uuid;
  ouvrier_paul_id uuid;
  ouvrier_michel_id uuid;
  ouvrier_antoine_id uuid;
  ouvrier_sylvie_id uuid;
  ouvrier_luc_id uuid;
  
  materiel_pelleteuse_id uuid;
  materiel_betonniere_id uuid;
  materiel_grue_id uuid;
  materiel_compacteur_id uuid;
  materiel_nacelle_id uuid;
  materiel_marteau_id uuid;
  
  utilisateur_admin_id uuid;
  utilisateur_manager_id uuid;
  utilisateur_marie_id uuid;
  utilisateur_pierre_id uuid;
  utilisateur_julie_id uuid;
  
  facture_1_id uuid;
  facture_2_id uuid;
  facture_3_id uuid;
  facture_4_id uuid;
  facture_5_id uuid;
  
  param_standard_id uuid;
  param_urgence_id uuid;
  param_weekend_id uuid;
BEGIN
  -- Count existing records
  SELECT COUNT(*) INTO client_count FROM clients;
  
  -- Only insert data if tables are empty
  IF client_count = 0 THEN
    -- Insertion des clients
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('Martin Dubois', 'particulier', 'martin.dubois@email.com', '0123456789', '123 Rue de la Paix, 75001 Paris', NULL, 'Martin Dubois', 'Client fidèle depuis 2020, toujours ponctuel dans les paiements. Recommande souvent nos services.')
    RETURNING id INTO client_martin_id;
    
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('Sophie Martin', 'particulier', 'sophie.martin@email.com', '0123456790', '45 Avenue des Champs-Élysées, 75008 Paris', NULL, 'Sophie Martin', 'Architecte d''intérieur, très exigeante sur la qualité des finitions.')
    RETURNING id INTO client_sophie_id;
    
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('Pierre Durand', 'particulier', 'pierre.durand@email.com', '0123456791', '78 Rue du Commerce, 13001 Marseille', NULL, 'Pierre Durand', 'Projet d''extension terminé avec satisfaction. Envisage d''autres travaux.')
    RETURNING id INTO client_pierre_id;
    
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('Entreprise ABC', 'entreprise', 'contact@entreprise-abc.com', '0123456792', '12 Zone Industrielle, 69100 Villeurbanne', '12345678901234', 'Directeur Général - M. Leblanc', 'Gros client corporate, projets récurrents. Délais de paiement 60 jours.')
    RETURNING id INTO client_abc_id;
    
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('Marie Lefevre', 'particulier', 'marie.lefevre@email.com', '0123456793', '34 Rue de la République, 33000 Bordeaux', NULL, 'Marie Lefevre', 'Sensible aux questions environnementales, privilégie les matériaux écologiques.')
    RETURNING id INTO client_marie_id;
    
    INSERT INTO clients (nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
    ('SCI Immobilier Plus', 'entreprise', 'gestion@sci-immobilier.com', '0123456794', '89 Avenue de la Liberté, 59000 Lille', '98765432109876', 'Gestionnaire - Mme Petit', 'Société civile immobilière, gère plusieurs biens en rénovation.')
    RETURNING id INTO client_sci_id;

    -- Insertion des chantiers
    INSERT INTO chantiers (nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
    ('Construction Villa Moderne', 'Construction d''une villa moderne de 200m² avec piscine et garage', client_martin_id, '123 Rue de la Paix, 75001 Paris', '2024-01-15', '2024-08-30', 'actif', 75, 350000, 48.8566, 2.3522)
    RETURNING id INTO chantier_villa_id;
    
    INSERT INTO chantiers (nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
    ('Rénovation Appartement Haussmannien', 'Rénovation complète d''un appartement 4 pièces avec création d''une suite parentale', client_sophie_id, '45 Avenue des Champs-Élysées, 75008 Paris', '2024-03-01', '2024-07-15', 'actif', 45, 120000, 48.8698, 2.3076)
    RETURNING id INTO chantier_appart_id;
    
    INSERT INTO chantiers (nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
    ('Extension Maison Contemporaine', 'Extension de 80m² avec véranda et terrasse surélevée', client_pierre_id, '78 Rue du Commerce, 13001 Marseille', '2024-02-01', '2024-06-30', 'termine', 100, 180000, 43.2965, 5.3698)
    RETURNING id INTO chantier_extension_id;
    
    INSERT INTO chantiers (nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
    ('Immeuble de Bureaux', 'Construction d''un immeuble de bureaux R+3 avec parking souterrain', client_abc_id, '12 Zone Industrielle, 69100 Villeurbanne', '2024-04-01', '2025-02-28', 'actif', 25, 850000, 45.7640, 4.8357)
    RETURNING id INTO chantier_immeuble_id;
    
    INSERT INTO chantiers (nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
    ('Rénovation Énergétique', 'Isolation thermique et installation pompe à chaleur', client_marie_id, '34 Rue de la République, 33000 Bordeaux', '2024-05-15', '2024-07-30', 'planifie', 0, 65000, 44.8378, -0.5792)
    RETURNING id INTO chantier_energie_id;

    -- Insertion des ouvriers
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Dubois', 'Jean', 'jean.dubois@chantier.com', '0123456789', 'Chef d''équipe Maçon', ARRAY['CACES R482', 'Habilitation électrique B0', 'SST'], '2020-01-15', 'actif', 28.00, '12 Rue de la Construction, 75019 Paris')
    RETURNING id INTO ouvrier_jean_id;
    
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Martin', 'Paul', 'paul.martin@chantier.com', '0123456790', 'Électricien', ARRAY['Habilitation électrique B2V', 'IRVE', 'Qualifelec'], '2021-03-10', 'actif', 26.00, '34 Avenue de l''Électricité, 69003 Lyon')
    RETURNING id INTO ouvrier_paul_id;
    
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Leroy', 'Michel', 'michel.leroy@chantier.com', '0123456791', 'Plombier-Chauffagiste', ARRAY['PGN', 'Soudure cuivre', 'RGE QualiPAC'], '2019-06-20', 'actif', 25.00, '56 Rue de la Plomberie, 13002 Marseille')
    RETURNING id INTO ouvrier_michel_id;
    
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Rousseau', 'Antoine', 'antoine.rousseau@chantier.com', '0123456792', 'Charpentier', ARRAY['CACES R486', 'Travail en hauteur'], '2022-09-01', 'actif', 24.00, '89 Impasse du Bois, 31000 Toulouse')
    RETURNING id INTO ouvrier_antoine_id;
    
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Moreau', 'Sylvie', 'sylvie.moreau@chantier.com', '0123456793', 'Peintre en bâtiment', ARRAY['CQP Peintre', 'Échafaudage'], '2023-02-15', 'actif', 22.00, '23 Rue des Artistes, 44000 Nantes')
    RETURNING id INTO ouvrier_sylvie_id;
    
    INSERT INTO ouvriers (nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
    ('Bernard', 'Luc', 'luc.bernard@chantier.com', '0123456794', 'Carreleur', ARRAY['CAP Carrelage', 'Mosaïque'], '2021-11-08', 'conge', 23.00, '67 Boulevard des Finitions, 67000 Strasbourg')
    RETURNING id INTO ouvrier_luc_id;

    -- Insertion du matériel
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Pelleteuse CAT320D', 'Engin de terrassement', 'Caterpillar', '320D', 'CAT320D001', '2022-01-15', 180000, 'en_service', '2024-08-15', 'Construction Villa Moderne', 85.00)
    RETURNING id INTO materiel_pelleteuse_id;
    
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Bétonnière Altrad B180', 'Équipement de construction', 'Altrad', 'B180', 'ALT180B002', '2023-05-10', 1200, 'disponible', '2024-09-01', 'Dépôt principal', 15.00)
    RETURNING id INTO materiel_betonniere_id;
    
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Grue mobile Liebherr', 'Engin de levage', 'Liebherr', 'LTM1030', 'LIE1030003', '2021-08-20', 450000, 'maintenance', '2024-07-30', 'Atelier', 120.00)
    RETURNING id INTO materiel_grue_id;
    
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Compacteur Bomag', 'Engin de compactage', 'Bomag', 'BW120AD', 'BOM120004', '2023-03-12', 35000, 'en_service', '2024-10-15', 'Immeuble de Bureaux', 45.00)
    RETURNING id INTO materiel_compacteur_id;
    
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Nacelle Haulotte', 'Plateforme élévatrice', 'Haulotte', 'Compact 12', 'HAU12005', '2022-11-05', 28000, 'disponible', '2024-08-20', 'Dépôt principal', 35.00)
    RETURNING id INTO materiel_nacelle_id;
    
    INSERT INTO materiel (nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
    ('Marteau-piqueur Hilti', 'Outillage électroportatif', 'Hilti', 'TE 3000-AVR', 'HIL3000006', '2023-07-18', 2500, 'en_service', '2024-07-18', 'Rénovation Appartement Haussmannien', 8.00)
    RETURNING id INTO materiel_marteau_id;

    -- Insertion des utilisateurs
    INSERT INTO utilisateurs (nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
    ('Admin', 'Super', 'admin@chantier.com', 'admin', '2024-07-12T10:30:00', true, ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings'])
    RETURNING id INTO utilisateur_admin_id;
    
    INSERT INTO utilisateurs (nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
    ('Manager', 'Chef', 'manager@chantier.com', 'manager', '2024-07-11T16:45:00', true, ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports'])
    RETURNING id INTO utilisateur_manager_id;
    
    INSERT INTO utilisateurs (nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
    ('Dupont', 'Marie', 'marie.dupont@chantier.com', 'employe', '2024-07-10T09:20:00', true, ARRAY['read', 'view_reports'])
    RETURNING id INTO utilisateur_marie_id;
    
    INSERT INTO utilisateurs (nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
    ('Bernard', 'Pierre', 'pierre.bernard@chantier.com', 'employe', '2024-07-05T14:30:00', false, ARRAY['read'])
    RETURNING id INTO utilisateur_pierre_id;
    
    INSERT INTO utilisateurs (nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
    ('Moreau', 'Julie', 'julie.moreau@chantier.com', 'manager', '2024-07-12T08:15:00', true, ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'view_reports'])
    RETURNING id INTO utilisateur_julie_id;

    -- Insertion des factures
    INSERT INTO factures (numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
    ('FAC-2024-001', client_martin_id, chantier_villa_id, '2024-01-15', '2024-02-15', 25000, 5000, 30000, 'payee')
    RETURNING id INTO facture_1_id;
    
    INSERT INTO factures (numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
    ('FAC-2024-002', client_sophie_id, chantier_appart_id, '2024-03-01', '2024-04-01', 15000, 3000, 18000, 'payee')
    RETURNING id INTO facture_2_id;
    
    INSERT INTO factures (numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
    ('FAC-2024-003', client_martin_id, chantier_villa_id, '2024-05-15', '2024-06-15', 45000, 9000, 54000, 'envoyee')
    RETURNING id INTO facture_3_id;
    
    INSERT INTO factures (numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
    ('FAC-2024-004', client_abc_id, chantier_immeuble_id, '2024-06-01', '2024-08-01', 120000, 24000, 144000, 'envoyee')
    RETURNING id INTO facture_4_id;
    
    INSERT INTO factures (numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
    ('FAC-2024-005', client_pierre_id, chantier_extension_id, '2024-06-30', '2024-07-30', 35000, 7000, 42000, 'retard')
    RETURNING id INTO facture_5_id;

    -- Insertion des lignes de facturation
    INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES
    (facture_1_id, 'Fondations et terrassement', 1, 25000, 25000);
    
    INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES
    (facture_2_id, 'Démolition et évacuation', 1, 15000, 15000);
    
    INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES
    (facture_3_id, 'Gros œuvre et charpente', 1, 45000, 45000);
    
    INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES
    (facture_4_id, 'Terrassement et fondations immeuble', 1, 120000, 120000);
    
    INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES
    (facture_5_id, 'Finitions extension', 1, 35000, 35000);

    -- Insertion des saisies d'heures
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_jean_id, chantier_villa_id, materiel_pelleteuse_id, '2024-01-15', '08:00', '17:30', 8, 1.5, 'Terrassement avec pelleteuse - préparation fondations', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_paul_id, chantier_villa_id, NULL, '2024-01-15', '09:00', '18:00', 8, 1, 'Installation tableau électrique provisoire', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_michel_id, chantier_appart_id, NULL, '2024-01-16', '08:30', '16:30', 8, 0, 'Démolition cloisons anciennes', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_jean_id, chantier_villa_id, materiel_betonniere_id, '2024-01-17', '08:00', '19:00', 8, 3, 'Coulage béton fondations avec bétonnière - urgence météo', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_antoine_id, chantier_villa_id, NULL, '2024-01-18', '09:00', '17:00', 8, 0, 'Préparation charpente - découpe et assemblage', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_paul_id, chantier_appart_id, materiel_marteau_id, '2024-01-22', '08:00', '17:00', 8, 1, 'Perçage murs porteurs avec marteau-piqueur', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_sylvie_id, chantier_appart_id, NULL, '2024-01-23', '09:00', '16:00', 7, 0, 'Préparation surfaces pour peinture', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_michel_id, chantier_villa_id, NULL, '2024-01-24', '08:30', '17:30', 8, 1, 'Installation plomberie sanitaires', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_jean_id, chantier_immeuble_id, materiel_compacteur_id, '2024-01-29', '07:30', '16:30', 8, 1, 'Compactage terrain avec compacteur Bomag', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_antoine_id, chantier_villa_id, materiel_nacelle_id, '2024-01-30', '08:00', '18:30', 8, 2.5, 'Pose charpente avec nacelle - rattrapage planning', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_paul_id, chantier_villa_id, NULL, '2024-02-05', '08:00', '17:00', 8, 1, 'Câblage électrique étages', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_sylvie_id, chantier_appart_id, NULL, '2024-02-06', '09:00', '17:30', 8, 0.5, 'Peinture chambres - première couche', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_michel_id, chantier_appart_id, NULL, '2024-03-12', '08:00', '16:00', 8, 0, 'Installation chauffage central', true);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_jean_id, chantier_villa_id, NULL, '2024-03-15', '08:30', '18:00', 8, 1.5, 'Montage murs porteurs étage', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_antoine_id, chantier_villa_id, NULL, '2024-07-08', '08:00', '17:00', 8, 1, 'Pose couverture toiture', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_paul_id, chantier_immeuble_id, NULL, '2024-07-09', '07:30', '16:30', 8, 1, 'Installation électrique immeuble - RDC', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_sylvie_id, chantier_villa_id, NULL, '2024-07-10', '09:00', '18:00', 8, 1, 'Peinture façade extérieure', false);
    
    INSERT INTO saisies_heures (ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
    (ouvrier_michel_id, chantier_immeuble_id, NULL, '2024-07-11', '08:00', '17:30', 8, 1.5, 'Plomberie sanitaires collectifs', false);

    -- Insertion des événements de planning
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Chantier Villa Moderne - Toiture', 'Pose de la couverture et isolation', '2024-07-15T08:00:00', '2024-07-15T17:00:00', chantier_villa_id, ouvrier_antoine_id, materiel_nacelle_id, 'chantier');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Maintenance Pelleteuse', 'Révision 500h et contrôle hydraulique', '2024-07-20T09:00:00', '2024-07-20T15:00:00', NULL, NULL, materiel_pelleteuse_id, 'maintenance');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Formation Sécurité Chantier', 'Formation obligatoire sécurité et EPI', '2024-07-22T14:00:00', '2024-07-22T17:00:00', NULL, ouvrier_sylvie_id, NULL, 'formation');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Congé Été - Michel Leroy', 'Congé payé été', '2024-07-25T00:00:00', '2024-08-09T23:59:59', NULL, ouvrier_michel_id, NULL, 'conge');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Rénovation Appartement - Électricité', 'Installation nouveau tableau et prises', '2024-07-16T08:30:00', '2024-07-16T17:30:00', chantier_appart_id, ouvrier_paul_id, NULL, 'chantier');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Maintenance Grue Mobile', 'Contrôle mensuel et test de charge', '2024-07-18T10:00:00', '2024-07-18T16:00:00', NULL, NULL, materiel_grue_id, 'maintenance');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Immeuble Bureaux - Terrassement', 'Continuation terrassement parking souterrain', '2024-07-17T07:30:00', '2024-07-17T16:30:00', chantier_immeuble_id, ouvrier_jean_id, materiel_compacteur_id, 'chantier');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Formation CACES R482', 'Recyclage CACES engins de chantier', '2024-07-24T08:00:00', '2024-07-24T17:00:00', NULL, ouvrier_jean_id, NULL, 'formation');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Villa Moderne - Finitions', 'Peinture intérieure et pose parquet', '2024-08-05T08:00:00', '2024-08-05T17:00:00', chantier_villa_id, ouvrier_sylvie_id, NULL, 'chantier');
    
    INSERT INTO planning_events (titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
    ('Maintenance Compacteur', 'Vidange et contrôle général', '2024-08-12T09:00:00', '2024-08-12T12:00:00', NULL, NULL, materiel_compacteur_id, 'maintenance');

    -- Insertion des photos
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_villa_id, 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg', 'Fondations terminées', '2024-01-20', 'avancement', 'fondations.jpg', 2048576);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_villa_id, 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg', 'Structure béton armé', '2024-03-15', 'avancement', 'structure.jpg', 1843200);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_villa_id, 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'Charpente posée', '2024-05-10', 'avancement', 'charpente.jpg', 2359296);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_appart_id, 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'État avant travaux', '2024-02-28', 'avant', 'avant_travaux.jpg', 1572864);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_appart_id, 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg', 'Démolition cloisons', '2024-03-10', 'avancement', 'demolition.jpg', 1966080);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_extension_id, 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'Extension terminée', '2024-06-25', 'apres', 'extension_finie.jpg', 2621440);
    
    INSERT INTO photos (chantier_id, url, description, date, category, filename, size_bytes) VALUES
    (chantier_immeuble_id, 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg', 'Terrassement en cours', '2024-04-15', 'avancement', 'terrassement.jpg', 1789952);

    -- Insertion de l'historique des connexions
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_admin_id, '2024-07-12T10:30:00', '192.168.1.100', 'Chrome 126.0', 'Windows 11', true);
    
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_admin_id, '2024-07-11T09:15:00', '192.168.1.100', 'Chrome 126.0', 'Windows 11', true);
    
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_manager_id, '2024-07-11T16:45:00', '10.0.0.50', 'Firefox 128.0', 'macOS 14', true);
    
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_admin_id, '2024-07-10T08:20:00', '203.0.113.1', 'Chrome 126.0', 'Android 14', false);
    
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_marie_id, '2024-07-10T09:20:00', '172.16.0.25', 'Safari 17.5', 'iPhone 15', true);
    
    INSERT INTO historique_connexions (utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
    (utilisateur_julie_id, '2024-07-12T08:15:00', '192.168.1.200', 'Edge 126.0', 'Windows 11', true);

    -- Insertion des paramètres heures supplémentaires
    INSERT INTO parametres_heures_sup (nom, description, seuil_heures_normales, taux_majoration_sup, seuil_heures_exceptionnelles, taux_majoration_exceptionnelles, jours_travailles_semaine, heures_max_jour, heures_max_semaine, actif) VALUES
    ('Configuration Standard', 'Paramètres par défaut selon la convention collective du BTP', 8.00, 25.00, 10.00, 50.00, 5, 10.00, 48.00, true)
    RETURNING id INTO param_standard_id;
    
    INSERT INTO parametres_heures_sup (nom, description, seuil_heures_normales, taux_majoration_sup, seuil_heures_exceptionnelles, taux_majoration_exceptionnelles, jours_travailles_semaine, heures_max_jour, heures_max_semaine, actif) VALUES
    ('Configuration Urgence', 'Paramètres pour les chantiers d''urgence avec majorations renforcées', 7.00, 30.00, 9.00, 60.00, 6, 12.00, 50.00, false)
    RETURNING id INTO param_urgence_id;
    
    INSERT INTO parametres_heures_sup (nom, description, seuil_heures_normales, taux_majoration_sup, seuil_heures_exceptionnelles, taux_majoration_exceptionnelles, jours_travailles_semaine, heures_max_jour, heures_max_semaine, actif) VALUES
    ('Configuration Week-end', 'Paramètres spéciaux pour le travail de week-end', 6.00, 50.00, 8.00, 100.00, 2, 8.00, 16.00, false)
    RETURNING id INTO param_weekend_id;
  END IF;

  -- Mise à jour des heures_total pour les saisies d'heures
  UPDATE saisies_heures
  SET heures_total = heures_normales + heures_supplementaires + COALESCE(heures_exceptionnelles, 0)
  WHERE heures_total = 0;
END $$;