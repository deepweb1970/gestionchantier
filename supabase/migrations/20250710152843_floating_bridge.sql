/*
  # Material Usage Tracking System
  
  1. New Columns
    - `usage_hours` (numeric) - Total hours the equipment has been used
    - `utilization_rate` (numeric) - Percentage of time the equipment is being used
  
  2. New Functions
    - `update_materiel_usage()` - Updates usage statistics when time entries change
    - `calculate_materiel_utilization()` - Calculates utilization rate based on usage hours
  
  3. New Triggers
    - Automatically updates material usage when time entries are added, modified, or deleted
*/

-- Add usage tracking columns to materiel table
ALTER TABLE materiel 
ADD COLUMN IF NOT EXISTS usage_hours numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilization_rate numeric(5,2) DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_materiel_usage_hours ON materiel(usage_hours);
CREATE INDEX IF NOT EXISTS idx_materiel_utilization_rate ON materiel(utilization_rate);

-- Function to update materiel usage hours
CREATE OR REPLACE FUNCTION update_materiel_usage()
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
    )
    WHERE id = materiel_id_val;
    
    -- Update utilization rate
    PERFORM calculate_materiel_utilization(materiel_id_val);
  END IF;

  -- For UPDATE, also update the old materiel if it changed
  IF (TG_OP = 'UPDATE' AND OLD.materiel_id IS NOT NULL AND OLD.materiel_id != NEW.materiel_id) THEN
    -- Update the old materiel's usage_hours
    UPDATE materiel
    SET usage_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE materiel_id = OLD.materiel_id
    )
    WHERE id = OLD.materiel_id;
    
    -- Update utilization rate for old materiel
    PERFORM calculate_materiel_utilization(OLD.materiel_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate utilization rate
CREATE OR REPLACE FUNCTION calculate_materiel_utilization(materiel_id_val UUID)
RETURNS VOID AS $$
DECLARE
  usage_hours_val NUMERIC;
  days_period INTEGER := 30; -- Last 30 days
  work_hours_per_day INTEGER := 8; -- 8 hours per day
  max_possible_hours NUMERIC;
  utilization_rate_val NUMERIC;
BEGIN
  -- Get current usage hours
  SELECT usage_hours INTO usage_hours_val
  FROM materiel
  WHERE id = materiel_id_val;
  
  -- Calculate maximum possible hours in the period
  max_possible_hours := days_period * work_hours_per_day;
  
  -- Calculate utilization rate (percentage)
  IF max_possible_hours > 0 THEN
    utilization_rate_val := (usage_hours_val / max_possible_hours) * 100;
  ELSE
    utilization_rate_val := 0;
  END IF;
  
  -- Update the utilization rate
  UPDATE materiel
  SET utilization_rate = ROUND(utilization_rate_val::numeric, 2)
  WHERE id = materiel_id_val;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update materiel usage
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_materiel_usage_trigger') THEN
    CREATE TRIGGER update_materiel_usage_trigger
    AFTER INSERT OR UPDATE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_materiel_usage();
  END IF;

  -- Check if the delete trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_materiel_usage_delete_trigger') THEN
    CREATE TRIGGER update_materiel_usage_delete_trigger
    AFTER DELETE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_materiel_usage();
  END IF;
END $$;

-- Update existing materiel with current usage hours
DO $$
DECLARE
  m_record RECORD;
BEGIN
  FOR m_record IN SELECT id FROM materiel LOOP
    -- Update usage hours
    UPDATE materiel
    SET usage_hours = (
      SELECT COALESCE(SUM(heures_total), 0)
      FROM saisies_heures
      WHERE materiel_id = m_record.id
    )
    WHERE id = m_record.id;
    
    -- Update utilization rate
    PERFORM calculate_materiel_utilization(m_record.id);
  END LOOP;
END $$;

-- Add comment to explain the columns
COMMENT ON COLUMN materiel.usage_hours IS 'Total hours the equipment has been used based on time entries';
COMMENT ON COLUMN materiel.utilization_rate IS 'Percentage of time the equipment is being used (based on 8h/day, 30 days)';