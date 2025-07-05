-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('particulier', 'entreprise')),
  email text NOT NULL UNIQUE,
  telephone text NOT NULL,
  adresse text NOT NULL,
  siret text,
  contact_principal text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des chantiers
CREATE TABLE IF NOT EXISTS chantiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  description text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  adresse text NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  statut text NOT NULL DEFAULT 'planifie' CHECK (statut IN ('actif', 'termine', 'pause', 'planifie')),
  avancement integer DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
  budget numeric(12,2) DEFAULT 0,
  latitude numeric(10,8),
  longitude numeric(11,8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des ouvriers
CREATE TABLE IF NOT EXISTS ouvriers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  telephone text NOT NULL,
  qualification text NOT NULL,
  certifications text[] DEFAULT '{}',
  date_embauche date NOT NULL,
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'conge', 'arret', 'indisponible')),
  taux_horaire numeric(8,2) NOT NULL,
  adresse text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table du matériel
CREATE TABLE IF NOT EXISTS materiel (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL,
  marque text NOT NULL,
  modele text NOT NULL,
  numero_serie text NOT NULL UNIQUE,
  date_achat date NOT NULL,
  valeur numeric(12,2) NOT NULL,
  statut text NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'en_service', 'maintenance', 'hors_service')),
  prochaine_maintenance date,
  localisation text,
  tarif_horaire numeric(8,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'employe' CHECK (role IN ('admin', 'manager', 'employe')),
  derniere_connexion timestamptz DEFAULT now(),
  actif boolean DEFAULT true,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text NOT NULL UNIQUE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE SET NULL,
  date_emission date NOT NULL,
  date_echeance date NOT NULL,
  montant_ht numeric(12,2) NOT NULL DEFAULT 0,
  tva numeric(12,2) NOT NULL DEFAULT 0,
  montant_ttc numeric(12,2) NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'retard', 'annulee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des lignes de facturation
CREATE TABLE IF NOT EXISTS facture_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id uuid REFERENCES factures(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantite numeric(10,2) NOT NULL DEFAULT 1,
  prix_unitaire numeric(10,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des saisies d'heures
CREATE TABLE IF NOT EXISTS saisies_heures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ouvrier_id uuid REFERENCES ouvriers(id) ON DELETE CASCADE,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE,
  materiel_id uuid REFERENCES materiel(id) ON DELETE SET NULL,
  date date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  heures_normales numeric(4,2) NOT NULL DEFAULT 0,
  heures_supplementaires numeric(4,2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  valide boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parametres_id uuid,
  heures_exceptionnelles numeric(4,2) DEFAULT 0,
  heures_total numeric(5,2) DEFAULT 0
);

-- Table des événements de planning
CREATE TABLE IF NOT EXISTS planning_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre text NOT NULL,
  description text,
  date_debut timestamptz NOT NULL,
  date_fin timestamptz NOT NULL,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE,
  ouvrier_id uuid REFERENCES ouvriers(id) ON DELETE CASCADE,
  materiel_id uuid REFERENCES materiel(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('chantier', 'maintenance', 'conge', 'formation')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des photos
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  category text DEFAULT 'avancement' CHECK (category IN ('avancement', 'probleme', 'materiel', 'securite', 'finition', 'avant', 'apres')),
  filename text,
  size_bytes bigint,
  created_at timestamptz DEFAULT now()
);

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  ouvrier_id uuid REFERENCES ouvriers(id) ON DELETE CASCADE,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Table des rapports
CREATE TABLE IF NOT EXISTS rapports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('performance', 'couts', 'activite', 'financier', 'ressources')),
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  parametres jsonb DEFAULT '{}',
  cree_par uuid REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table de l'historique des connexions
CREATE TABLE IF NOT EXISTS historique_connexions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id uuid REFERENCES utilisateurs(id) ON DELETE CASCADE,
  date_connexion timestamptz DEFAULT now(),
  adresse_ip inet,
  navigateur text,
  appareil text,
  succes boolean DEFAULT true
);

-- Table des paramètres heures supplémentaires
CREATE TABLE IF NOT EXISTS parametres_heures_sup (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  description text,
  seuil_heures_normales numeric(4,2) NOT NULL DEFAULT 8.00,
  taux_majoration_sup numeric(5,2) NOT NULL DEFAULT 25.00,
  seuil_heures_exceptionnelles numeric(4,2) NOT NULL DEFAULT 10.00,
  taux_majoration_exceptionnelles numeric(5,2) NOT NULL DEFAULT 50.00,
  jours_travailles_semaine integer NOT NULL DEFAULT 5,
  heures_max_jour numeric(4,2) NOT NULL DEFAULT 10.00,
  heures_max_semaine numeric(5,2) NOT NULL DEFAULT 48.00,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_chantiers_client_id ON chantiers(client_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_date_debut ON chantiers(date_debut);

CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_chantier_id ON factures(chantier_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date_emission ON factures(date_emission);

CREATE INDEX IF NOT EXISTS idx_facture_items_facture_id ON facture_items(facture_id);

CREATE INDEX IF NOT EXISTS idx_saisies_heures_ouvrier_id ON saisies_heures(ouvrier_id);
CREATE INDEX IF NOT EXISTS idx_saisies_heures_chantier_id ON saisies_heures(chantier_id);
CREATE INDEX IF NOT EXISTS idx_saisies_heures_date ON saisies_heures(date);
CREATE INDEX IF NOT EXISTS idx_saisies_heures_valide ON saisies_heures(valide);
CREATE INDEX IF NOT EXISTS idx_saisies_heures_parametres_id ON saisies_heures(parametres_id);
CREATE INDEX IF NOT EXISTS idx_saisies_heures_total ON saisies_heures(heures_total);

CREATE INDEX IF NOT EXISTS idx_planning_events_date_debut ON planning_events(date_debut);
CREATE INDEX IF NOT EXISTS idx_planning_events_chantier_id ON planning_events(chantier_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_ouvrier_id ON planning_events(ouvrier_id);

CREATE INDEX IF NOT EXISTS idx_photos_chantier_id ON photos(chantier_id);
CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date);

CREATE INDEX IF NOT EXISTS idx_ouvriers_statut ON ouvriers(statut);
CREATE INDEX IF NOT EXISTS idx_materiel_statut ON materiel(statut);
CREATE INDEX IF NOT EXISTS idx_parametres_heures_sup_actif ON parametres_heures_sup(actif);

-- Fonction pour calculer le total des heures
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    NEW.heures_total = NEW.heures_normales + NEW.heures_supplementaires + COALESCE(NEW.heures_exceptionnelles, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement heures_total
CREATE TRIGGER update_saisies_heures_total
BEFORE INSERT OR UPDATE ON saisies_heures
FOR EACH ROW EXECUTE FUNCTION calculate_total_hours();

-- Triggers pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chantiers_updated_at BEFORE UPDATE ON chantiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ouvriers_updated_at BEFORE UPDATE ON ouvriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materiel_updated_at BEFORE UPDATE ON materiel FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utilisateurs_updated_at BEFORE UPDATE ON utilisateurs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saisies_heures_updated_at BEFORE UPDATE ON saisies_heures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planning_events_updated_at BEFORE UPDATE ON planning_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parametres_heures_sup_updated_at BEFORE UPDATE ON parametres_heures_sup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();