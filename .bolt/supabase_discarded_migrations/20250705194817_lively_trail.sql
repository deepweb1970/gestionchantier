-- Insertion des clients
INSERT INTO clients (id, nom, type, email, telephone, adresse, siret, contact_principal, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Martin Dubois', 'particulier', 'martin.dubois@email.com', '0123456789', '123 Rue de la Paix, 75001 Paris', NULL, 'Martin Dubois', 'Client fidèle depuis 2020, toujours ponctuel dans les paiements. Recommande souvent nos services.'),
('550e8400-e29b-41d4-a716-446655440002', 'Sophie Martin', 'particulier', 'sophie.martin@email.com', '0123456790', '45 Avenue des Champs-Élysées, 75008 Paris', NULL, 'Sophie Martin', 'Architecte d''intérieur, très exigeante sur la qualité des finitions.'),
('550e8400-e29b-41d4-a716-446655440003', 'Pierre Durand', 'particulier', 'pierre.durand@email.com', '0123456791', '78 Rue du Commerce, 13001 Marseille', NULL, 'Pierre Durand', 'Projet d''extension terminé avec satisfaction. Envisage d''autres travaux.'),
('550e8400-e29b-41d4-a716-446655440004', 'Entreprise ABC', 'entreprise', 'contact@entreprise-abc.com', '0123456792', '12 Zone Industrielle, 69100 Villeurbanne', '12345678901234', 'Directeur Général - M. Leblanc', 'Gros client corporate, projets récurrents. Délais de paiement 60 jours.'),
('550e8400-e29b-41d4-a716-446655440005', 'Marie Lefevre', 'particulier', 'marie.lefevre@email.com', '0123456793', '34 Rue de la République, 33000 Bordeaux', NULL, 'Marie Lefevre', 'Sensible aux questions environnementales, privilégie les matériaux écologiques.'),
('550e8400-e29b-41d4-a716-446655440006', 'SCI Immobilier Plus', 'entreprise', 'gestion@sci-immobilier.com', '0123456794', '89 Avenue de la Liberté, 59000 Lille', '98765432109876', 'Gestionnaire - Mme Petit', 'Société civile immobilière, gère plusieurs biens en rénovation.');

-- Insertion des chantiers
INSERT INTO chantiers (id, nom, description, client_id, adresse, date_debut, date_fin, statut, avancement, budget, latitude, longitude) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Construction Villa Moderne', 'Construction d''une villa moderne de 200m² avec piscine et garage', '550e8400-e29b-41d4-a716-446655440001', '123 Rue de la Paix, 75001 Paris', '2024-01-15', '2024-08-30', 'actif', 75, 350000, 48.8566, 2.3522),
('660e8400-e29b-41d4-a716-446655440002', 'Rénovation Appartement Haussmannien', 'Rénovation complète d''un appartement 4 pièces avec création d''une suite parentale', '550e8400-e29b-41d4-a716-446655440002', '45 Avenue des Champs-Élysées, 75008 Paris', '2024-03-01', '2024-07-15', 'actif', 45, 120000, 48.8698, 2.3076),
('660e8400-e29b-41d4-a716-446655440003', 'Extension Maison Contemporaine', 'Extension de 80m² avec véranda et terrasse surélevée', '550e8400-e29b-41d4-a716-446655440003', '78 Rue du Commerce, 13001 Marseille', '2024-02-01', '2024-06-30', 'termine', 100, 180000, 43.2965, 5.3698),
('660e8400-e29b-41d4-a716-446655440004', 'Immeuble de Bureaux', 'Construction d''un immeuble de bureaux R+3 avec parking souterrain', '550e8400-e29b-41d4-a716-446655440004', '12 Zone Industrielle, 69100 Villeurbanne', '2024-04-01', '2025-02-28', 'actif', 25, 850000, 45.7640, 4.8357),
('660e8400-e29b-41d4-a716-446655440005', 'Rénovation Énergétique', 'Isolation thermique et installation pompe à chaleur', '550e8400-e29b-41d4-a716-446655440005', '34 Rue de la République, 33000 Bordeaux', '2024-05-15', '2024-07-30', 'planifie', 0, 65000, 44.8378, -0.5792);

-- Insertion des ouvriers
INSERT INTO ouvriers (id, nom, prenom, email, telephone, qualification, certifications, date_embauche, statut, taux_horaire, adresse) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Dubois', 'Jean', 'jean.dubois@chantier.com', '0123456789', 'Chef d''équipe Maçon', ARRAY['CACES R482', 'Habilitation électrique B0', 'SST'], '2020-01-15', 'actif', 28.00, '12 Rue de la Construction, 75019 Paris'),
('770e8400-e29b-41d4-a716-446655440002', 'Martin', 'Paul', 'paul.martin@chantier.com', '0123456790', 'Électricien', ARRAY['Habilitation électrique B2V', 'IRVE', 'Qualifelec'], '2021-03-10', 'actif', 26.00, '34 Avenue de l''Électricité, 69003 Lyon'),
('770e8400-e29b-41d4-a716-446655440003', 'Leroy', 'Michel', 'michel.leroy@chantier.com', '0123456791', 'Plombier-Chauffagiste', ARRAY['PGN', 'Soudure cuivre', 'RGE QualiPAC'], '2019-06-20', 'actif', 25.00, '56 Rue de la Plomberie, 13002 Marseille'),
('770e8400-e29b-41d4-a716-446655440004', 'Rousseau', 'Antoine', 'antoine.rousseau@chantier.com', '0123456792', 'Charpentier', ARRAY['CACES R486', 'Travail en hauteur'], '2022-09-01', 'actif', 24.00, '89 Impasse du Bois, 31000 Toulouse'),
('770e8400-e29b-41d4-a716-446655440005', 'Moreau', 'Sylvie', 'sylvie.moreau@chantier.com', '0123456793', 'Peintre en bâtiment', ARRAY['CQP Peintre', 'Échafaudage'], '2023-02-15', 'actif', 22.00, '23 Rue des Artistes, 44000 Nantes'),
('770e8400-e29b-41d4-a716-446655440006', 'Bernard', 'Luc', 'luc.bernard@chantier.com', '0123456794', 'Carreleur', ARRAY['CAP Carrelage', 'Mosaïque'], '2021-11-08', 'conge', 23.00, '67 Boulevard des Finitions, 67000 Strasbourg');

-- Insertion du matériel
INSERT INTO materiel (id, nom, type, marque, modele, numero_serie, date_achat, valeur, statut, prochaine_maintenance, localisation, tarif_horaire) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Pelleteuse CAT320D', 'Engin de terrassement', 'Caterpillar', '320D', 'CAT320D001', '2022-01-15', 180000, 'en_service', '2024-08-15', 'Construction Villa Moderne', 85.00),
('880e8400-e29b-41d4-a716-446655440002', 'Bétonnière Altrad B180', 'Équipement de construction', 'Altrad', 'B180', 'ALT180B002', '2023-05-10', 1200, 'disponible', '2024-09-01', 'Dépôt principal', 15.00),
('880e8400-e29b-41d4-a716-446655440003', 'Grue mobile Liebherr', 'Engin de levage', 'Liebherr', 'LTM1030', 'LIE1030003', '2021-08-20', 450000, 'maintenance', '2024-07-30', 'Atelier', 120.00),
('880e8400-e29b-41d4-a716-446655440004', 'Compacteur Bomag', 'Engin de compactage', 'Bomag', 'BW120AD', 'BOM120004', '2023-03-12', 35000, 'en_service', '2024-10-15', 'Immeuble de Bureaux', 45.00),
('880e8400-e29b-41d4-a716-446655440005', 'Nacelle Haulotte', 'Plateforme élévatrice', 'Haulotte', 'Compact 12', 'HAU12005', '2022-11-05', 28000, 'disponible', '2024-08-20', 'Dépôt principal', 35.00),
('880e8400-e29b-41d4-a716-446655440006', 'Marteau-piqueur Hilti', 'Outillage électroportatif', 'Hilti', 'TE 3000-AVR', 'HIL3000006', '2023-07-18', 2500, 'en_service', '2024-07-18', 'Rénovation Appartement Haussmannien', 8.00);

-- Insertion des utilisateurs
INSERT INTO utilisateurs (id, nom, prenom, email, role, derniere_connexion, actif, permissions) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Admin', 'Super', 'admin@chantier.com', 'admin', '2024-07-12T10:30:00', true, ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']),
('990e8400-e29b-41d4-a716-446655440002', 'Manager', 'Chef', 'manager@chantier.com', 'manager', '2024-07-11T16:45:00', true, ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports']),
('990e8400-e29b-41d4-a716-446655440003', 'Dupont', 'Marie', 'marie.dupont@chantier.com', 'employe', '2024-07-10T09:20:00', true, ARRAY['read', 'view_reports']),
('990e8400-e29b-41d4-a716-446655440004', 'Bernard', 'Pierre', 'pierre.bernard@chantier.com', 'employe', '2024-07-05T14:30:00', false, ARRAY['read']),
('990e8400-e29b-41d4-a716-446655440005', 'Moreau', 'Julie', 'julie.moreau@chantier.com', 'manager', '2024-07-12T08:15:00', true, ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'view_reports']);

-- Insertion des factures
INSERT INTO factures (id, numero, client_id, chantier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'FAC-2024-001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2024-02-15', 25000, 5000, 30000, 'payee'),
('aa0e8400-e29b-41d4-a716-446655440002', 'FAC-2024-002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '2024-03-01', '2024-04-01', 15000, 3000, 18000, 'payee'),
('aa0e8400-e29b-41d4-a716-446655440003', 'FAC-2024-003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-05-15', '2024-06-15', 45000, 9000, 54000, 'envoyee'),
('aa0e8400-e29b-41d4-a716-446655440004', 'FAC-2024-004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '2024-06-01', '2024-08-01', 120000, 24000, 144000, 'envoyee'),
('aa0e8400-e29b-41d4-a716-446655440005', 'FAC-2024-005', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '2024-06-30', '2024-07-30', 35000, 7000, 42000, 'retard');

-- Insertion des lignes de facturation
INSERT INTO facture_items (id, facture_id, description, quantite, prix_unitaire, total) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', 'Fondations et terrassement', 1, 25000, 25000),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440002', 'Démolition et évacuation', 1, 15000, 15000),
('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440003', 'Gros œuvre et charpente', 1, 45000, 45000),
('bb0e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440004', 'Terrassement et fondations immeuble', 1, 120000, 120000),
('bb0e8400-e29b-41d4-a716-446655440005', 'aa0e8400-e29b-41d4-a716-446655440005', 'Finitions extension', 1, 35000, 35000);

-- Insertion des saisies d'heures
INSERT INTO saisies_heures (id, ouvrier_id, chantier_id, materiel_id, date, heure_debut, heure_fin, heures_normales, heures_supplementaires, description, valide) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '2024-01-15', '08:00', '17:30', 9.5, 0, 'Terrassement avec pelleteuse - préparation fondations', true),
('cc0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-01-15', '09:00', '18:00', 9, 0, 'Installation tableau électrique provisoire', true),
('cc0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', NULL, '2024-01-16', '08:30', '16:30', 8, 0, 'Démolition cloisons anciennes', true),
('cc0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', '2024-01-17', '08:00', '19:00', 11, 0, 'Coulage béton fondations avec bétonnière - urgence météo', true),
('cc0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-01-18', '09:00', '17:00', 8, 0, 'Préparation charpente - découpe et assemblage', false),
('cc0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440006', '2024-01-22', '08:00', '17:00', 9, 0, 'Perçage murs porteurs avec marteau-piqueur', false),
('cc0e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', NULL, '2024-01-23', '09:00', '16:00', 7, 0, 'Préparation surfaces pour peinture', false),
('cc0e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-01-24', '08:30', '17:30', 9, 0, 'Installation plomberie sanitaires', false),
('cc0e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', '2024-01-29', '07:30', '16:30', 9, 0, 'Compactage terrain avec compacteur Bomag', false),
('cc0e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', '2024-01-30', '08:00', '18:30', 10.5, 0, 'Pose charpente avec nacelle - rattrapage planning', false),
('cc0e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-02-05', '08:00', '17:00', 9, 0, 'Câblage électrique étages', true),
('cc0e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', NULL, '2024-02-06', '09:00', '17:30', 8.5, 0, 'Peinture chambres - première couche', true),
('cc0e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', NULL, '2024-03-12', '08:00', '16:00', 8, 0, 'Installation chauffage central', true),
('cc0e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-03-15', '08:30', '18:00', 9.5, 0, 'Montage murs porteurs étage', false),
('cc0e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-07-08', '08:00', '17:00', 9, 0, 'Pose couverture toiture', false),
('cc0e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', NULL, '2024-07-09', '07:30', '16:30', 9, 0, 'Installation électrique immeuble - RDC', false),
('cc0e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', NULL, '2024-07-10', '09:00', '18:00', 9, 0, 'Peinture façade extérieure', false),
('cc0e8400-e29b-41d4-a716-446655440018', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', NULL, '2024-07-11', '08:00', '17:30', 9.5, 0, 'Plomberie sanitaires collectifs', false);

-- Insertion des événements de planning
INSERT INTO planning_events (id, titre, description, date_debut, date_fin, chantier_id, ouvrier_id, materiel_id, type) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'Chantier Villa Moderne - Toiture', 'Pose de la couverture et isolation', '2024-07-15T08:00:00', '2024-07-15T17:00:00', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440005', 'chantier'),
('dd0e8400-e29b-41d4-a716-446655440002', 'Maintenance Pelleteuse', 'Révision 500h et contrôle hydraulique', '2024-07-20T09:00:00', '2024-07-20T15:00:00', NULL, NULL, '880e8400-e29b-41d4-a716-446655440001', 'maintenance'),
('dd0e8400-e29b-41d4-a716-446655440003', 'Formation Sécurité Chantier', 'Formation obligatoire sécurité et EPI', '2024-07-22T14:00:00', '2024-07-22T17:00:00', NULL, '770e8400-e29b-41d4-a716-446655440005', NULL, 'formation'),
('dd0e8400-e29b-41d4-a716-446655440004', 'Congé Été - Michel Leroy', 'Congé payé été', '2024-07-25T00:00:00', '2024-08-09T23:59:59', NULL, '770e8400-e29b-41d4-a716-446655440003', NULL, 'conge'),
('dd0e8400-e29b-41d4-a716-446655440005', 'Rénovation Appartement - Électricité', 'Installation nouveau tableau et prises', '2024-07-16T08:30:00', '2024-07-16T17:30:00', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', NULL, 'chantier'),
('dd0e8400-e29b-41d4-a716-446655440006', 'Maintenance Grue Mobile', 'Contrôle mensuel et test de charge', '2024-07-18T10:00:00', '2024-07-18T16:00:00', NULL, NULL, '880e8400-e29b-41d4-a716-446655440003', 'maintenance'),
('dd0e8400-e29b-41d4-a716-446655440007', 'Immeuble Bureaux - Terrassement', 'Continuation terrassement parking souterrain', '2024-07-17T07:30:00', '2024-07-17T16:30:00', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440004', 'chantier'),
('dd0e8400-e29b-41d4-a716-446655440008', 'Formation CACES R482', 'Recyclage CACES engins de chantier', '2024-07-24T08:00:00', '2024-07-24T17:00:00', NULL, '770e8400-e29b-41d4-a716-446655440001', NULL, 'formation'),
('dd0e8400-e29b-41d4-a716-446655440009', 'Villa Moderne - Finitions', 'Peinture intérieure et pose parquet', '2024-08-05T08:00:00', '2024-08-05T17:00:00', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', NULL, 'chantier'),
('dd0e8400-e29b-41d4-a716-446655440010', 'Maintenance Compacteur', 'Vidange et contrôle général', '2024-08-12T09:00:00', '2024-08-12T12:00:00', NULL, NULL, '880e8400-e29b-41d4-a716-446655440004', 'maintenance');

-- Insertion des photos
INSERT INTO photos (id, chantier_id, url, description, date, category, filename, size_bytes) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg', 'Fondations terminées', '2024-01-20', 'avancement', 'fondations.jpg', 2048576),
('ee0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg', 'Structure béton armé', '2024-03-15', 'avancement', 'structure.jpg', 1843200),
('ee0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'Charpente posée', '2024-05-10', 'avancement', 'charpente.jpg', 2359296),
('ee0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'État avant travaux', '2024-02-28', 'avant', 'avant_travaux.jpg', 1572864),
('ee0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg', 'Démolition cloisons', '2024-03-10', 'avancement', 'demolition.jpg', 1966080),
('ee0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'Extension terminée', '2024-06-25', 'apres', 'extension_finie.jpg', 2621440),
('ee0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg', 'Terrassement en cours', '2024-04-15', 'avancement', 'terrassement.jpg', 1789952);

-- Insertion de l'historique des connexions
INSERT INTO historique_connexions (id, utilisateur_id, date_connexion, adresse_ip, navigateur, appareil, succes) VALUES
('ff0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '2024-07-12T10:30:00', '192.168.1.100', 'Chrome 126.0', 'Windows 11', true),
('ff0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', '2024-07-11T09:15:00', '192.168.1.100', 'Chrome 126.0', 'Windows 11', true),
('ff0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', '2024-07-11T16:45:00', '10.0.0.50', 'Firefox 128.0', 'macOS 14', true),
('ff0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440001', '2024-07-10T08:20:00', '203.0.113.1', 'Chrome 126.0', 'Android 14', false),
('ff0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440003', '2024-07-10T09:20:00', '172.16.0.25', 'Safari 17.5', 'iPhone 15', true),
('ff0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440005', '2024-07-12T08:15:00', '192.168.1.200', 'Edge 126.0', 'Windows 11', true);

-- Insertion des paramètres heures supplémentaires
INSERT INTO parametres_heures_sup (id, nom, description, seuil_heures_normales, taux_majoration_sup, seuil_heures_exceptionnelles, taux_majoration_exceptionnelles, jours_travailles_semaine, heures_max_jour, heures_max_semaine, actif) VALUES
('dd1e8400-e29b-41d4-a716-446655440001', 'Configuration Standard', 'Paramètres par défaut selon la convention collective du BTP', 8.00, 25.00, 10.00, 50.00, 5, 10.00, 48.00, true),
('dd1e8400-e29b-41d4-a716-446655440002', 'Configuration Urgence', 'Paramètres pour les chantiers d''urgence avec majorations renforcées', 7.00, 30.00, 9.00, 60.00, 6, 12.00, 50.00, false),
('dd1e8400-e29b-41d4-a716-446655440003', 'Configuration Week-end', 'Paramètres spéciaux pour le travail de week-end', 6.00, 50.00, 8.00, 100.00, 2, 8.00, 16.00, false);

-- Mise à jour des heures_total pour les saisies d'heures
UPDATE saisies_heures
SET heures_total = heures_normales + heures_supplementaires + COALESCE(heures_exceptionnelles, 0)
WHERE heures_total = 0;