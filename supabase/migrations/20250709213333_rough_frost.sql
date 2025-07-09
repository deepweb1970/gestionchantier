/*
  # Add lunch break tracking to time entries
  
  1. New Columns
    - `heure_table` (time) - Stores the duration of lunch break
  
  2. Function Updates
    - Update `calculate_total_hours()` function to subtract lunch break time from total hours
*/

-- Add heure_table column to saisies_heures table
ALTER TABLE IF EXISTS saisies_heures 
ADD COLUMN IF NOT EXISTS heure_table time without time zone;

-- Update the calculate_total_hours function to subtract lunch break time
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  total_minutes INTEGER;
  lunch_minutes INTEGER := 0;
BEGIN
  -- Calculate total minutes between start and end time
  total_minutes := (EXTRACT(HOUR FROM NEW.heure_fin)::integer * 60 + EXTRACT(MINUTE FROM NEW.heure_fin)::integer) - 
                  (EXTRACT(HOUR FROM NEW.heure_debut)::integer * 60 + EXTRACT(MINUTE FROM NEW.heure_debut)::integer);
  
  -- If lunch break time is provided, subtract it from total
  IF NEW.heure_table IS NOT NULL THEN
    lunch_minutes := EXTRACT(HOUR FROM NEW.heure_table)::integer * 60 + EXTRACT(MINUTE FROM NEW.heure_table)::integer;
    total_minutes := total_minutes - lunch_minutes;
  END IF;
  
  -- Convert minutes back to hours
  NEW.heures_total := total_minutes::numeric / 60;
  
  -- For backward compatibility
  NEW.heures_normales := NEW.heures_total;
  NEW.heures_supplementaires := 0;
  NEW.heures_exceptionnelles := 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;