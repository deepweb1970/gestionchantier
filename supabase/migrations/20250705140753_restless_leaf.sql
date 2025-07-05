/*
  # Passage aux heures totales

  1. Nouvelles fonctionnalités
    - Ajout d'une colonne `heures_total` à la table `saisies_heures`
    - Calcul automatique du total des heures via un trigger
    - Maintien des colonnes existantes pour compatibilité
    
  2. Changements
    - Nouvelle colonne `heures_total` (numeric)
    - Fonction `calculate_total_hours()` pour calcul automatique
    - Trigger `update_saisies_heures_total` sur INSERT et UPDATE
    - Index sur `heures_total` pour optimiser les performances
    - Commentaires sur les colonnes pour documentation
*/

-- Ajouter la colonne heures_total à la table saisies_heures
ALTER TABLE saisies_heures 
ADD COLUMN IF NOT EXISTS heures_total numeric(5,2) DEFAULT 0;

-- Mettre à jour les données existantes
UPDATE saisies_heures
SET heures_total = heures_normales + heures_supplementaires + COALESCE(heures_exceptionnelles, 0)
WHERE heures_total = 0;

-- Créer une fonction pour calculer automatiquement le total des heures
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    NEW.heures_total = NEW.heures_normales + NEW.heures_supplementaires + COALESCE(NEW.heures_exceptionnelles, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer un trigger pour mettre à jour automatiquement heures_total
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_saisies_heures_total'
  ) THEN
    CREATE TRIGGER update_saisies_heures_total
    BEFORE INSERT OR UPDATE ON saisies_heures
    FOR EACH ROW EXECUTE FUNCTION calculate_total_hours();
  END IF;
END $$;

-- Ajouter un index pour améliorer les performances des requêtes sur heures_total
CREATE INDEX IF NOT EXISTS idx_saisies_heures_total ON saisies_heures(heures_total);

-- Commentaire sur les colonnes (pour documentation)
COMMENT ON COLUMN saisies_heures.heures_total IS 'Total des heures travaillées (remplace la distinction entre types d''heures)';
COMMENT ON COLUMN saisies_heures.heures_normales IS 'Colonne maintenue pour compatibilité, à terme toutes les heures seront dans heures_total';
COMMENT ON COLUMN saisies_heures.heures_supplementaires IS 'Colonne maintenue pour compatibilité, sera dépréciée';
COMMENT ON COLUMN saisies_heures.heures_exceptionnelles IS 'Colonne maintenue pour compatibilité, sera dépréciée';