/*
  # Ajout des paramètres d'heures supplémentaires

  1. Nouvelle table
    - `parametres_heures_sup`
      - `id` (uuid, primary key)
      - `nom` (text, nom de la configuration)
      - `description` (text, description détaillée)
      - `seuil_heures_normales` (numeric, heures payées au taux normal)
      - `taux_majoration_sup` (numeric, pourcentage majoration heures sup)
      - `seuil_heures_exceptionnelles` (numeric, seuil heures exceptionnelles)
      - `taux_majoration_exceptionnelles` (numeric, pourcentage majoration exceptionnelles)
      - `jours_travailles_semaine` (integer, jours travaillés par semaine)
      - `heures_max_jour` (numeric, limite heures par jour)
      - `heures_max_semaine` (numeric, limite heures par semaine)
      - `actif` (boolean, configuration active)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications table saisies_heures
    - Ajout colonne `parametres_id` (référence vers parametres_heures_sup)
    - Ajout colonne `heures_exceptionnelles` (numeric)

  3. Sécurité
    - Enable RLS sur parametres_heures_sup
    - Politique pour utilisateurs authentifiés
    - Index pour performances
    - Trigger pour updated_at

  4. Données initiales
    - Configuration Standard (BTP)
    - Configuration Urgence
    - Configuration Week-end
*/

-- Table des paramètres heures supplémentaires
CREATE TABLE IF NOT EXISTS parametres_heures_sup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Ajouter une référence aux paramètres dans la table saisies_heures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saisies_heures' AND column_name = 'parametres_id'
  ) THEN
    ALTER TABLE saisies_heures 
    ADD COLUMN parametres_id uuid REFERENCES parametres_heures_sup(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter des colonnes pour les heures exceptionnelles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saisies_heures' AND column_name = 'heures_exceptionnelles'
  ) THEN
    ALTER TABLE saisies_heures 
    ADD COLUMN heures_exceptionnelles numeric(4,2) DEFAULT 0;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_saisies_heures_parametres_id ON saisies_heures(parametres_id);
CREATE INDEX IF NOT EXISTS idx_parametres_heures_sup_actif ON parametres_heures_sup(actif);

-- Trigger pour mettre à jour updated_at (avec vérification d'existence)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_parametres_heures_sup_updated_at'
  ) THEN
    CREATE TRIGGER update_parametres_heures_sup_updated_at 
    BEFORE UPDATE ON parametres_heures_sup 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Activer RLS
ALTER TABLE parametres_heures_sup ENABLE ROW LEVEL SECURITY;

-- Politique RLS (avec vérification d'existence)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parametres_heures_sup' 
    AND policyname = 'Utilisateurs authentifiés peuvent tout voir'
  ) THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" 
    ON parametres_heures_sup FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Insérer les paramètres par défaut (avec vérification d'existence)
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
) 
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM parametres_heures_sup WHERE nom = 'Configuration Standard'
);

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
) 
SELECT 
  'Configuration Urgence',
  'Paramètres pour les chantiers d''urgence avec majorations renforcées',
  7.00,
  30.00,
  9.00,
  60.00,
  6,
  12.00,
  50.00,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM parametres_heures_sup WHERE nom = 'Configuration Urgence'
);

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
) 
SELECT 
  'Configuration Week-end',
  'Paramètres spéciaux pour le travail de week-end',
  6.00,
  50.00,
  8.00,
  100.00,
  2,
  8.00,
  16.00,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM parametres_heures_sup WHERE nom = 'Configuration Week-end'
);