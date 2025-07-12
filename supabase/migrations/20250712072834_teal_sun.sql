/*
  # Add hour-based maintenance tracking

  1. New Fields
    - Add `next_maintenance_hours` to `materiel` table
    - Update maintenance types to focus on hour intervals
  
  2. Changes
    - Modify maintenance planning to be based on machine hours
    - Add triggers to update next maintenance hours
*/

-- Add next_maintenance_hours to materiel table
ALTER TABLE materiel 
ADD COLUMN IF NOT EXISTS next_maintenance_hours numeric(10,2) DEFAULT NULL;

-- Make sure machine_hours exists (in case previous migration didn't run)
ALTER TABLE materiel 
ADD COLUMN IF NOT EXISTS machine_hours numeric(10,2) DEFAULT 0;

-- Create or replace function to calculate next maintenance hours
CREATE OR REPLACE FUNCTION calculate_next_maintenance_hours(
  p_materiel_id uuid,
  p_maintenance_type_id uuid
) RETURNS numeric AS $$
DECLARE
  current_hours numeric;
  interval_hours numeric;
  next_hours numeric;
BEGIN
  -- Get current machine hours
  SELECT machine_hours INTO current_hours
  FROM materiel
  WHERE id = p_materiel_id;
  
  -- Get maintenance interval in hours
  SELECT intervalle_heures INTO interval_hours
  FROM maintenance_types
  WHERE id = p_maintenance_type_id;
  
  -- If either is null, return null
  IF current_hours IS NULL OR interval_hours IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next maintenance hours
  next_hours := current_hours + interval_hours;
  
  RETURN next_hours;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update next maintenance hours after maintenance
CREATE OR REPLACE FUNCTION update_materiel_after_maintenance() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'terminee'
  IF NEW.statut = 'terminee' AND (OLD.statut IS NULL OR OLD.statut <> 'terminee') THEN
    -- Update machine hours if provided
    IF NEW.heures_machine_fin IS NOT NULL THEN
      UPDATE materiel
      SET 
        machine_hours = NEW.heures_machine_fin,
        statut = 'disponible',
        next_maintenance_hours = (
          SELECT calculate_next_maintenance_hours(NEW.materiel_id, NEW.type_id)
        )
      WHERE id = NEW.materiel_id;
    ELSE
      -- Just update status if no machine hours provided
      UPDATE materiel
      SET 
        statut = 'disponible',
        next_maintenance_hours = (
          SELECT calculate_next_maintenance_hours(NEW.materiel_id, NEW.type_id)
        )
      WHERE id = NEW.materiel_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_materiel_after_maintenance_trigger'
  ) THEN
    CREATE TRIGGER update_materiel_after_maintenance_trigger
    AFTER UPDATE OF statut ON maintenances
    FOR EACH ROW
    EXECUTE FUNCTION update_materiel_after_maintenance();
  END IF;
END $$;

-- Create function to check if maintenance is needed based on hours
CREATE OR REPLACE FUNCTION is_maintenance_needed(
  p_materiel_id uuid
) RETURNS boolean AS $$
DECLARE
  current_hours numeric;
  next_maintenance_hours numeric;
BEGIN
  -- Get current and next maintenance hours
  SELECT 
    machine_hours, 
    next_maintenance_hours 
  INTO 
    current_hours, 
    next_maintenance_hours
  FROM materiel
  WHERE id = p_materiel_id;
  
  -- If next_maintenance_hours is null, return false
  IF next_maintenance_hours IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if current hours exceed next maintenance hours
  RETURN current_hours >= next_maintenance_hours;
END;
$$ LANGUAGE plpgsql;