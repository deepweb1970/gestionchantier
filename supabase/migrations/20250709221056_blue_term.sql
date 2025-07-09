/*
  # Add lunch break to saisies_heures table

  1. New Columns
    - `pause_dejeuner` (time without time zone) - Stores the lunch break duration
  
  2. Changes
    - Adds a new column to track lunch break time
    - Default value is 30 minutes (00:30:00)
    - Updates the calculate_total_hours function to account for lunch breaks
*/

-- Add lunch break column to saisies_heures table
ALTER TABLE saisies_heures 
ADD COLUMN IF NOT EXISTS pause_dejeuner TIME WITHOUT TIME ZONE DEFAULT '00:30:00';

-- Update the calculate_total_hours function to account for lunch breaks
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  debut_minutes INTEGER;
  fin_minutes INTEGER;
  pause_minutes INTEGER;
  total_minutes INTEGER;
  total_hours NUMERIC(5,2);
BEGIN
  -- Calculate minutes from start time
  debut_minutes := EXTRACT(HOUR FROM NEW.heure_debut) * 60 + EXTRACT(MINUTE FROM NEW.heure_debut);
  
  -- Calculate minutes from end time
  fin_minutes := EXTRACT(HOUR FROM NEW.heure_fin) * 60 + EXTRACT(MINUTE FROM NEW.heure_fin);
  
  -- Calculate minutes from lunch break
  pause_minutes := EXTRACT(HOUR FROM NEW.pause_dejeuner) * 60 + EXTRACT(MINUTE FROM NEW.pause_dejeuner);
  
  -- Calculate total minutes (end - start - lunch break)
  total_minutes := fin_minutes - debut_minutes - pause_minutes;
  
  -- Convert to hours
  total_hours := total_minutes / 60.0;
  
  -- Set the total hours
  NEW.heures_total := total_hours;
  
  -- For backward compatibility, also set the old fields
  -- This will be removed in a future update
  IF total_hours <= 8 THEN
    NEW.heures_normales := total_hours;
    NEW.heures_supplementaires := 0;
    NEW.heures_exceptionnelles := 0;
  ELSIF total_hours <= 10 THEN
    NEW.heures_normales := 8;
    NEW.heures_supplementaires := total_hours - 8;
    NEW.heures_exceptionnelles := 0;
  ELSE
    NEW.heures_normales := 8;
    NEW.heures_supplementaires := 2;
    NEW.heures_exceptionnelles := total_hours - 10;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing records to set default lunch break
UPDATE saisies_heures
SET pause_dejeuner = '00:30:00'
WHERE pause_dejeuner IS NULL;

-- Recalculate hours for all existing records
UPDATE saisies_heures
SET heures_total = (
  (EXTRACT(HOUR FROM heure_fin) * 60 + EXTRACT(MINUTE FROM heure_fin)) - 
  (EXTRACT(HOUR FROM heure_debut) * 60 + EXTRACT(MINUTE FROM heure_debut)) - 
  (EXTRACT(HOUR FROM pause_dejeuner) * 60 + EXTRACT(MINUTE FROM pause_dejeuner))
) / 60.0;