/*
  # Add heures_total column to saisies_heures table

  1. Changes
    - Add heures_total column to store the total hours worked
    - Update existing data to populate the new column
    - Create trigger to automatically calculate total hours
    - Add index for better performance
    - Add comments to document the changes

  2. Purpose
    - Simplify the hours tracking by using a single total value
    - Maintain backward compatibility with existing columns
    - Improve query performance with new index
*/

-- Add heures_total column if it doesn't exist
ALTER TABLE saisies_heures 
ADD COLUMN IF NOT EXISTS heures_total numeric(5,2) DEFAULT 0;

-- Update existing data to populate the new column
UPDATE saisies_heures
SET heures_total = heures_normales + heures_supplementaires + COALESCE(heures_exceptionnelles, 0)
WHERE heures_total = 0;

-- Create function to calculate total hours automatically
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    NEW.heures_total = NEW.heures_normales + NEW.heures_supplementaires + COALESCE(NEW.heures_exceptionnelles, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update heures_total automatically
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_saisies_heures_total ON saisies_heures(heures_total);

-- Add comments to document the changes
COMMENT ON COLUMN saisies_heures.heures_total IS 'Total des heures travaillées (remplace la distinction entre types d''heures)';
COMMENT ON COLUMN saisies_heures.heures_normales IS 'Colonne maintenue pour compatibilité, à terme toutes les heures seront dans heures_total';
COMMENT ON COLUMN saisies_heures.heures_supplementaires IS 'Colonne maintenue pour compatibilité, sera dépréciée';
COMMENT ON COLUMN saisies_heures.heures_exceptionnelles IS 'Colonne maintenue pour compatibilité, sera dépréciée';