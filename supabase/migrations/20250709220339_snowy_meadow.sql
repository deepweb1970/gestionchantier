/*
  # Add worked_hours field to chantiers table

  1. New Fields
    - `worked_hours` (numeric) - Total hours worked on the project, calculated from saisies_heures

  2. Changes
    - Add worked_hours column to chantiers table with default value of 0
    - Create function to update worked_hours when saisies_heures are modified
    - Create triggers to automatically update worked_hours on insert, update, or delete of saisies_heures
*/

-- Add worked_hours column to chantiers table
ALTER TABLE chantiers ADD COLUMN IF NOT EXISTS worked_hours NUMERIC(10,2) DEFAULT 0;

-- Create function to update worked_hours
CREATE OR REPLACE FUNCTION update_chantier_worked_hours()
RETURNS TRIGGER AS $$
DECLARE
  chantier_id_val UUID;
BEGIN
  -- For INSERT or UPDATE, use NEW.chantier_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    chantier_id_val := NEW.chantier_id;
  -- For DELETE, use OLD.chantier_id
  ELSIF (TG_OP = 'DELETE') THEN
    chantier_id_val := OLD.chantier_id;
  END IF;

  -- If we have a chantier_id, update its worked_hours
  IF chantier_id_val IS NOT NULL THEN
    -- Calculate total hours for the chantier
    UPDATE chantiers
    SET worked_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE chantier_id = chantier_id_val
    )
    WHERE id = chantier_id_val;
  END IF;

  -- For UPDATE, also update the old chantier if it changed
  IF (TG_OP = 'UPDATE' AND OLD.chantier_id IS NOT NULL AND OLD.chantier_id != NEW.chantier_id) THEN
    -- Update the old chantier's worked_hours
    UPDATE chantiers
    SET worked_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE chantier_id = OLD.chantier_id
    )
    WHERE id = OLD.chantier_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update worked_hours
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chantier_worked_hours_trigger') THEN
    CREATE TRIGGER update_chantier_worked_hours_trigger
    AFTER INSERT OR UPDATE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_chantier_worked_hours();
  END IF;

  -- Check if the delete trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chantier_worked_hours_delete_trigger') THEN
    CREATE TRIGGER update_chantier_worked_hours_delete_trigger
    AFTER DELETE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_chantier_worked_hours();
  END IF;
END $$;

-- Update existing chantiers with current worked_hours
UPDATE chantiers c
SET worked_hours = (
  SELECT COALESCE(SUM(heures_total), 0)
  FROM saisies_heures s
  WHERE s.chantier_id = c.id
);