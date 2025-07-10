/*
  # Add worker hours and equipment usage tracking to chantiers
  
  1. New Columns
    - `heures_ouvriers_total` (numeric) - Total hours worked by all workers on this project
    - `heures_materiel_total` (numeric) - Total hours of equipment usage on this project
    - `cout_main_oeuvre` (numeric) - Total labor cost for this project
    - `cout_materiel` (numeric) - Total equipment cost for this project
  
  2. New Functions
    - `update_chantier_hours()` - Updates hours and cost statistics when time entries change
  
  3. New Triggers
    - Automatically updates project statistics when time entries are added, modified, or deleted
*/

-- Add tracking columns to chantiers table
ALTER TABLE chantiers 
ADD COLUMN IF NOT EXISTS heures_ouvriers_total numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS heures_materiel_total numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cout_main_oeuvre numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cout_materiel numeric(12,2) DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chantiers_heures_ouvriers ON chantiers(heures_ouvriers_total);
CREATE INDEX IF NOT EXISTS idx_chantiers_heures_materiel ON chantiers(heures_materiel_total);

-- Function to update chantier hours and costs
CREATE OR REPLACE FUNCTION update_chantier_hours()
RETURNS TRIGGER AS $$
DECLARE
  chantier_id_val UUID;
  total_worker_hours NUMERIC;
  total_equipment_hours NUMERIC;
  total_labor_cost NUMERIC;
  total_equipment_cost NUMERIC;
BEGIN
  -- For INSERT or UPDATE, use NEW.chantier_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    chantier_id_val := NEW.chantier_id;
  -- For DELETE, use OLD.chantier_id
  ELSIF (TG_OP = 'DELETE') THEN
    chantier_id_val := OLD.chantier_id;
  END IF;

  -- If we have a chantier_id, update its statistics
  IF chantier_id_val IS NOT NULL THEN
    -- Calculate total worker hours for the chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_worker_hours
    FROM saisies_heures
    WHERE chantier_id = chantier_id_val;
    
    -- Calculate total equipment hours for the chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_equipment_hours
    FROM saisies_heures
    WHERE chantier_id = chantier_id_val AND materiel_id IS NOT NULL;
    
    -- Calculate total labor cost for the chantier
    SELECT COALESCE(SUM(sh.heures_total * o.taux_horaire), 0) INTO total_labor_cost
    FROM saisies_heures sh
    JOIN ouvriers o ON sh.ouvrier_id = o.id
    WHERE sh.chantier_id = chantier_id_val;
    
    -- Calculate total equipment cost for the chantier
    SELECT COALESCE(SUM(sh.heures_total * m.tarif_horaire), 0) INTO total_equipment_cost
    FROM saisies_heures sh
    JOIN materiel m ON sh.materiel_id = m.id
    WHERE sh.chantier_id = chantier_id_val AND sh.materiel_id IS NOT NULL;
    
    -- Update the chantier statistics
    UPDATE chantiers
    SET 
      heures_ouvriers_total = total_worker_hours,
      heures_materiel_total = total_equipment_hours,
      cout_main_oeuvre = total_labor_cost,
      cout_materiel = total_equipment_cost,
      updated_at = NOW()
    WHERE id = chantier_id_val;
  END IF;

  -- For UPDATE, also update the old chantier if it changed
  IF (TG_OP = 'UPDATE' AND OLD.chantier_id IS NOT NULL AND OLD.chantier_id != NEW.chantier_id) THEN
    -- Calculate total worker hours for the old chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_worker_hours
    FROM saisies_heures
    WHERE chantier_id = OLD.chantier_id;
    
    -- Calculate total equipment hours for the old chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_equipment_hours
    FROM saisies_heures
    WHERE chantier_id = OLD.chantier_id AND materiel_id IS NOT NULL;
    
    -- Calculate total labor cost for the old chantier
    SELECT COALESCE(SUM(sh.heures_total * o.taux_horaire), 0) INTO total_labor_cost
    FROM saisies_heures sh
    JOIN ouvriers o ON sh.ouvrier_id = o.id
    WHERE sh.chantier_id = OLD.chantier_id;
    
    -- Calculate total equipment cost for the old chantier
    SELECT COALESCE(SUM(sh.heures_total * m.tarif_horaire), 0) INTO total_equipment_cost
    FROM saisies_heures sh
    JOIN materiel m ON sh.materiel_id = m.id
    WHERE sh.chantier_id = OLD.chantier_id AND sh.materiel_id IS NOT NULL;
    
    -- Update the old chantier statistics
    UPDATE chantiers
    SET 
      heures_ouvriers_total = total_worker_hours,
      heures_materiel_total = total_equipment_hours,
      cout_main_oeuvre = total_labor_cost,
      cout_materiel = total_equipment_cost,
      updated_at = NOW()
    WHERE id = OLD.chantier_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update chantier hours
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chantier_hours_trigger') THEN
    CREATE TRIGGER update_chantier_hours_trigger
    AFTER INSERT OR UPDATE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_chantier_hours();
  END IF;

  -- Check if the delete trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chantier_hours_delete_trigger') THEN
    CREATE TRIGGER update_chantier_hours_delete_trigger
    AFTER DELETE ON saisies_heures
    FOR EACH ROW
    EXECUTE FUNCTION update_chantier_hours();
  END IF;
END $$;

-- Update existing chantiers with current hours and costs
DO $$
DECLARE
  c_record RECORD;
  total_worker_hours NUMERIC;
  total_equipment_hours NUMERIC;
  total_labor_cost NUMERIC;
  total_equipment_cost NUMERIC;
BEGIN
  FOR c_record IN SELECT id FROM chantiers LOOP
    -- Calculate total worker hours for the chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_worker_hours
    FROM saisies_heures
    WHERE chantier_id = c_record.id;
    
    -- Calculate total equipment hours for the chantier
    SELECT COALESCE(SUM(heures_total), 0) INTO total_equipment_hours
    FROM saisies_heures
    WHERE chantier_id = c_record.id AND materiel_id IS NOT NULL;
    
    -- Calculate total labor cost for the chantier
    SELECT COALESCE(SUM(sh.heures_total * o.taux_horaire), 0) INTO total_labor_cost
    FROM saisies_heures sh
    JOIN ouvriers o ON sh.ouvrier_id = o.id
    WHERE sh.chantier_id = c_record.id;
    
    -- Calculate total equipment cost for the chantier
    SELECT COALESCE(SUM(sh.heures_total * m.tarif_horaire), 0) INTO total_equipment_cost
    FROM saisies_heures sh
    JOIN materiel m ON sh.materiel_id = m.id
    WHERE sh.chantier_id = c_record.id AND sh.materiel_id IS NOT NULL;
    
    -- Update the chantier statistics
    UPDATE chantiers
    SET 
      heures_ouvriers_total = total_worker_hours,
      heures_materiel_total = total_equipment_hours,
      cout_main_oeuvre = total_labor_cost,
      cout_materiel = total_equipment_cost
    WHERE id = c_record.id;
  END LOOP;
END $$;

-- Add comments to explain the columns
COMMENT ON COLUMN chantiers.heures_ouvriers_total IS 'Total hours worked by all workers on this project';
COMMENT ON COLUMN chantiers.heures_materiel_total IS 'Total hours of equipment usage on this project';
COMMENT ON COLUMN chantiers.cout_main_oeuvre IS 'Total labor cost for this project';
COMMENT ON COLUMN chantiers.cout_materiel IS 'Total equipment cost for this project';