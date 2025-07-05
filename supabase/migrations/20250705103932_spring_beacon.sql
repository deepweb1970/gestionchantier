/*
  # Création de la table parametres_heures_sup

  1. Table
    - `parametres_heures_sup` - Configuration des heures supplémentaires
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

  2. Sécurité
    - Enable RLS
    - Politiques pour utilisateurs authentifiés
*/

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

-- Ajouter une référence aux paramètres dans la table saisies_heures
ALTER TABLE saisies_heures 
ADD COLUMN IF NOT EXISTS parametres_id uuid REFERENCES parametres_heures_sup(id) ON DELETE SET NULL;

-- Ajouter des colonnes pour les heures exceptionnelles
ALTER TABLE saisies_heures 
ADD COLUMN IF NOT EXISTS heures_exceptionnelles numeric(4,2) DEFAULT 0;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_saisies_heures_parametres_id ON saisies_heures(parametres_id);
CREATE INDEX IF NOT EXISTS idx_parametres_heures_sup_actif ON parametres_heures_sup(actif);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_parametres_heures_sup_updated_at 
BEFORE UPDATE ON parametres_heures_sup 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE parametres_heures_sup ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Authenticated users can view all parametres_heures_sup"
  ON parametres_heures_sup
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert parametres_heures_sup"
  ON parametres_heures_sup
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parametres_heures_sup"
  ON parametres_heures_sup
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parametres_heures_sup"
  ON parametres_heures_sup
  FOR DELETE
  TO authenticated
  USING (true);

-- Insérer les paramètres par défaut
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
) VALUES 
(
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
),
(
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
),
(
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
);