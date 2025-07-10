/*
  # Add material usage tracking based on time entries

  1. New Features
    - Add usage_hours field to materiel table to track total usage
    - Create trigger to automatically update usage_hours when saisies_heures are modified
    - Add utilization_rate field to calculate equipment efficiency

  2. Benefits
    - Real-time tracking of equipment usage
    - Better resource allocation and planning
    - Improved equipment ROI calculations
*/

-- Add usage_hours and utilization_rate columns to materiel table
ALTER TABLE materiel 
ADD COLUMN IF NOT EXISTS usage_hours NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilization_rate NUMERIC(5,2) DEFAULT 0;

-- Create function to update materiel usage_hours
CREATE OR REPLACE FUNCTION update_materiel_usage_hours()
RETURNS TRIGGER AS $$
DECLARE
  materiel_id_val UUID;
BEGIN
  -- For INSERT or UPDATE, use NEW.materiel_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    materiel_id_val := NEW.materiel_id;
  -- For DELETE, use OLD.materiel_id
  ELSIF (TG_OP = 'DELETE') THEN
    materiel_id_val := OLD.materiel_id;
  END IF;

  -- If we have a materiel_id, update its usage_hours
  IF materiel_id_val IS NOT NULL THEN
    -- Calculate total hours for the materiel
    UPDATE materiel
    SET usage_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE materiel_id = materiel_id_val
    ),
    -- Calculate utilization rate (based on 8 hours per day, 22 days per month)
    -- This gives a percentage of usage compared to available time
    utilization_rate = (
      SELECT COALESCE(SUM(heures_total), 0) / (8 * 22) * 100
      FROM saisies_heures
      WHERE materiel_id = materiel_id_val
      AND date >= (CURRENT_DATE - INTERVAL '30 days')
    ),
    updated_at = NOW()
    WHERE id = materiel_id_val;
  END IF;

  -- For UPDATE, also update the old materiel if it changed
  IF (TG_OP = 'UPDATE' AND OLD.materiel_id IS NOT NULL AND OLD.materiel_id != NEW.materiel_id) THEN
    -- Update the old materiel's usage_hours
    UPDATE materiel
    SET usage_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE materiel_id = OLD.materiel_id
    ),
    -- Calculate utilization rate for old materiel
    utilization_rate = (
      SELECT COALESCE(SUM(heures_total), 0) / (8 * 22) * 100
      FROM saisies_heures
      WHERE materiel_id = OLD.materiel_id
      AND date >= (CURRENT_DATE - INTERVAL '30 days')
    ),
    updated_at = NOW()
    WHERE id = OLD.materiel_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update usage_hours
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_materiel_usage_hours_trigger') THEN
    CREATE TRIGGER update_materiel_usage_hours_trigger
    AFTER INSERT OR UPDATE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_materiel_usage_hours();
  END IF;

  -- Check if the delete trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_materiel_usage_hours_delete_trigger') THEN
    CREATE TRIGGER update_materiel_usage_hours_delete_trigger
    AFTER DELETE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_materiel_usage_hours();
  END IF;
END $$;

-- Update existing materiel with current usage_hours
UPDATE materiel m
SET usage_hours = (
  SELECT COALESCE(SUM(heures_total), 0)
  FROM saisies_heures s
  WHERE s.materiel_id = m.id
),
utilization_rate = (
  SELECT COALESCE(SUM(heures_total), 0) / (8 * 22) * 100
  FROM saisies_heures s
  WHERE s.materiel_id = m.id
  AND s.date >= (CURRENT_DATE - INTERVAL '30 days')
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_saisies_heures_materiel_id ON saisies_heures(materiel_id);

-- Add comments to document the changes
COMMENT ON COLUMN materiel.usage_hours IS 'Total hours of usage based on saisies_heures';
COMMENT ON COLUMN materiel.utilization_rate IS 'Percentage of utilization in the last 30 days (based on 8h/day, 22 days/month)';