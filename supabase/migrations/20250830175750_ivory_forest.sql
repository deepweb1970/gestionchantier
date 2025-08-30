/*
  # Création des tables pour le module Petit Matériel

  1. Nouvelles Tables
    - `petit_materiel`
      - `id` (uuid, primary key)
      - `nom` (text, nom du matériel)
      - `type` (text, catégorie)
      - `marque` (text)
      - `modele` (text)
      - `numero_serie` (text, unique)
      - `code_barre` (text, unique)
      - `date_achat` (date)
      - `valeur` (numeric, valeur unitaire)
      - `statut` (text, enum)
      - `localisation` (text)
      - `description` (text, optionnel)
      - `quantite_stock` (integer)
      - `quantite_disponible` (integer)
      - `seuil_alerte` (integer)
      - `poids` (numeric, optionnel)
      - `dimensions` (text, optionnel)
      - `garantie` (date, optionnel)
      - `fournisseur` (text, optionnel)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `prets_petit_materiel`
      - `id` (uuid, primary key)
      - `petit_materiel_id` (uuid, foreign key)
      - `ouvrier_id` (uuid, foreign key)
      - `chantier_id` (uuid, foreign key, optionnel)
      - `date_debut` (date)
      - `date_fin` (date, optionnel)
      - `date_retour_prevue` (date)
      - `date_retour_effective` (date, optionnel)
      - `quantite` (integer)
      - `statut` (text, enum)
      - `notes` (text, optionnel)
      - `etat_depart` (text, enum)
      - `etat_retour` (text, enum, optionnel)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour utilisateurs authentifiés

  3. Index
    - Index sur les codes-barres et numéros de série
    - Index sur les statuts et dates
    - Index sur les foreign keys
*/

-- Création de la table petit_materiel
CREATE TABLE IF NOT EXISTS petit_materiel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type text NOT NULL,
  marque text NOT NULL,
  modele text NOT NULL,
  numero_serie text UNIQUE NOT NULL,
  code_barre text UNIQUE NOT NULL,
  date_achat date NOT NULL,
  valeur numeric(10,2) NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'disponible',
  localisation text NOT NULL,
  description text,
  quantite_stock integer NOT NULL DEFAULT 1,
  quantite_disponible integer NOT NULL DEFAULT 1,
  seuil_alerte integer NOT NULL DEFAULT 1,
  poids numeric(6,2),
  dimensions text,
  garantie date,
  fournisseur text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT petit_materiel_statut_check 
    CHECK (statut = ANY (ARRAY['disponible'::text, 'prete'::text, 'maintenance'::text, 'perdu'::text, 'hors_service'::text])),
  CONSTRAINT petit_materiel_quantites_check 
    CHECK (quantite_disponible >= 0 AND quantite_disponible <= quantite_stock),
  CONSTRAINT petit_materiel_seuil_check 
    CHECK (seuil_alerte >= 0 AND seuil_alerte <= quantite_stock)
);

-- Création de la table prets_petit_materiel
CREATE TABLE IF NOT EXISTS prets_petit_materiel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petit_materiel_id uuid NOT NULL REFERENCES petit_materiel(id) ON DELETE CASCADE,
  ouvrier_id uuid NOT NULL REFERENCES ouvriers(id) ON DELETE CASCADE,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE SET NULL,
  date_debut date NOT NULL,
  date_fin date,
  date_retour_prevue date NOT NULL,
  date_retour_effective date,
  quantite integer NOT NULL DEFAULT 1,
  statut text NOT NULL DEFAULT 'en_cours',
  notes text,
  etat_depart text NOT NULL DEFAULT 'bon',
  etat_retour text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT prets_statut_check 
    CHECK (statut = ANY (ARRAY['en_cours'::text, 'termine'::text, 'retard'::text, 'perdu'::text])),
  CONSTRAINT prets_etat_depart_check 
    CHECK (etat_depart = ANY (ARRAY['neuf'::text, 'bon'::text, 'moyen'::text, 'use'::text])),
  CONSTRAINT prets_etat_retour_check 
    CHECK (etat_retour = ANY (ARRAY['neuf'::text, 'bon'::text, 'moyen'::text, 'use'::text, 'endommage'::text, 'perdu'::text])),
  CONSTRAINT prets_quantite_check 
    CHECK (quantite > 0),
  CONSTRAINT prets_dates_check 
    CHECK (date_retour_prevue >= date_debut)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_petit_materiel_code_barre ON petit_materiel(code_barre);
CREATE INDEX IF NOT EXISTS idx_petit_materiel_numero_serie ON petit_materiel(numero_serie);
CREATE INDEX IF NOT EXISTS idx_petit_materiel_statut ON petit_materiel(statut);
CREATE INDEX IF NOT EXISTS idx_petit_materiel_type ON petit_materiel(type);
CREATE INDEX IF NOT EXISTS idx_petit_materiel_quantite_disponible ON petit_materiel(quantite_disponible);

CREATE INDEX IF NOT EXISTS idx_prets_petit_materiel_id ON prets_petit_materiel(petit_materiel_id);
CREATE INDEX IF NOT EXISTS idx_prets_ouvrier_id ON prets_petit_materiel(ouvrier_id);
CREATE INDEX IF NOT EXISTS idx_prets_chantier_id ON prets_petit_materiel(chantier_id);
CREATE INDEX IF NOT EXISTS idx_prets_statut ON prets_petit_materiel(statut);
CREATE INDEX IF NOT EXISTS idx_prets_date_debut ON prets_petit_materiel(date_debut);
CREATE INDEX IF NOT EXISTS idx_prets_date_retour_prevue ON prets_petit_materiel(date_retour_prevue);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_petit_materiel_updated_at'
  ) THEN
    CREATE TRIGGER update_petit_materiel_updated_at
      BEFORE UPDATE ON petit_materiel
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_prets_petit_materiel_updated_at'
  ) THEN
    CREATE TRIGGER update_prets_petit_materiel_updated_at
      BEFORE UPDATE ON prets_petit_materiel
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Fonction pour mettre à jour automatiquement les quantités disponibles
CREATE OR REPLACE FUNCTION update_petit_materiel_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Lors de la création d'un nouveau prêt
  IF TG_OP = 'INSERT' THEN
    UPDATE petit_materiel 
    SET quantite_disponible = quantite_disponible - NEW.quantite,
        statut = CASE 
          WHEN quantite_disponible - NEW.quantite = 0 THEN 'prete'::text
          ELSE statut
        END
    WHERE id = NEW.petit_materiel_id;
    RETURN NEW;
  END IF;
  
  -- Lors de la mise à jour d'un prêt (retour)
  IF TG_OP = 'UPDATE' THEN
    -- Si le statut passe à 'termine', remettre les quantités
    IF OLD.statut != 'termine' AND NEW.statut = 'termine' THEN
      UPDATE petit_materiel 
      SET quantite_disponible = quantite_disponible + NEW.quantite,
          statut = CASE 
            WHEN quantite_disponible + NEW.quantite = quantite_stock THEN 'disponible'::text
            ELSE statut
          END
      WHERE id = NEW.petit_materiel_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Lors de la suppression d'un prêt
  IF TG_OP = 'DELETE' THEN
    -- Si le prêt était en cours, remettre les quantités
    IF OLD.statut = 'en_cours' THEN
      UPDATE petit_materiel 
      SET quantite_disponible = quantite_disponible + OLD.quantite,
          statut = CASE 
            WHEN quantite_disponible + OLD.quantite = quantite_stock THEN 'disponible'::text
            ELSE statut
          END
      WHERE id = OLD.petit_materiel_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la gestion automatique des quantités
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_petit_materiel_quantities_trigger'
  ) THEN
    CREATE TRIGGER update_petit_materiel_quantities_trigger
      AFTER INSERT OR UPDATE OR DELETE ON prets_petit_materiel
      FOR EACH ROW EXECUTE FUNCTION update_petit_materiel_quantities();
  END IF;
END $$;

-- Fonction pour détecter les prêts en retard
CREATE OR REPLACE FUNCTION update_prets_retard_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le statut des prêts en retard
  UPDATE prets_petit_materiel 
  SET statut = 'retard'
  WHERE statut = 'en_cours' 
    AND date_retour_prevue < CURRENT_DATE
    AND date_retour_effective IS NULL;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger quotidien pour détecter les retards (sera exécuté par un cron job)
-- Pour l'instant, on peut l'appeler manuellement ou via une fonction

-- Enable Row Level Security
ALTER TABLE petit_materiel ENABLE ROW LEVEL SECURITY;
ALTER TABLE prets_petit_materiel ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour petit_materiel
CREATE POLICY "Authenticated users can view all petit_materiel"
  ON petit_materiel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert petit_materiel"
  ON petit_materiel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update petit_materiel"
  ON petit_materiel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete petit_materiel"
  ON petit_materiel
  FOR DELETE
  TO authenticated
  USING (true);

-- Politiques RLS pour prets_petit_materiel
CREATE POLICY "Authenticated users can view all prets_petit_materiel"
  ON prets_petit_materiel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prets_petit_materiel"
  ON prets_petit_materiel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update prets_petit_materiel"
  ON prets_petit_materiel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete prets_petit_materiel"
  ON prets_petit_materiel
  FOR DELETE
  TO authenticated
  USING (true);