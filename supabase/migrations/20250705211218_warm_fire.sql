/*
  # Add trigger to update chantier avancement based on saisies_heures

  1. New Features
    - Automatic update of chantier avancement based on hours worked
    - Trigger on saisies_heures table to update chantier avancement
    - Function to calculate avancement based on hours and budget

  2. Benefits
    - Real-time progress tracking
    - Automatic synchronization between hours worked and project progress
    - More accurate project status reporting
*/

-- Create function to update chantier avancement based on hours worked
CREATE OR REPLACE FUNCTION update_chantier_avancement()
RETURNS TRIGGER AS $$
DECLARE
  chantier_record RECORD;
  total_hours NUMERIC;
  labor_cost NUMERIC;
  estimated_total_labor_cost NUMERIC;
  progress_by_labor INTEGER;
BEGIN
  -- Only proceed if the chantier_id is not null
  IF NEW.chantier_id IS NOT NULL THEN
    -- Get the chantier information
    SELECT * INTO chantier_record FROM chantiers WHERE id = NEW.chantier_id;
    
    -- Only update if the chantier is active or planned (not completed or paused)
    IF chantier_record.statut IN ('actif', 'planifie') THEN
      -- Calculate total hours for this chantier
      SELECT COALESCE(SUM(heures_total), 0) INTO total_hours 
      FROM saisies_heures 
      WHERE chantier_id = NEW.chantier_id;
      
      -- Calculate labor cost for this chantier
      SELECT COALESCE(SUM(sh.heures_total * o.taux_horaire), 0) INTO labor_cost
      FROM saisies_heures sh
      JOIN ouvriers o ON sh.ouvrier_id = o.id
      WHERE sh.chantier_id = NEW.chantier_id;
      
      -- Estimate total labor cost (assuming labor is about 40% of total budget)
      estimated_total_labor_cost := chantier_record.budget * 0.4;
      
      -- Calculate progress based on labor cost
      IF estimated_total_labor_cost > 0 THEN
        progress_by_labor := LEAST(100, ROUND((labor_cost / estimated_total_labor_cost) * 100));
        
        -- Update the chantier avancement
        UPDATE chantiers 
        SET avancement = progress_by_labor,
            updated_at = NOW()
        WHERE id = NEW.chantier_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on saisies_heures table
DROP TRIGGER IF EXISTS update_chantier_avancement_trigger ON saisies_heures;

CREATE TRIGGER update_chantier_avancement_trigger
AFTER INSERT OR UPDATE ON saisies_heures
FOR EACH ROW
EXECUTE FUNCTION update_chantier_avancement();

-- Create trigger for when saisies_heures are deleted
CREATE OR REPLACE FUNCTION update_chantier_avancement_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the same function but with OLD record
  PERFORM update_chantier_avancement(OLD);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chantier_avancement_delete_trigger ON saisies_heures;

CREATE TRIGGER update_chantier_avancement_delete_trigger
AFTER DELETE ON saisies_heures
FOR EACH ROW
EXECUTE FUNCTION update_chantier_avancement_on_delete();