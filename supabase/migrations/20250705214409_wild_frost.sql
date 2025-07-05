/*
  # Auto-refresh functionality for forms

  1. New Features
    - Add trigger to automatically refresh forms after data changes
    - Ensure all forms are refreshed after creation, modification, or deletion
    - Improve user experience with immediate feedback

  2. Implementation
    - Create function to handle form refresh events
    - Add trigger to relevant tables
    - Ensure proper data synchronization
*/

-- Create a function to notify clients about data changes
CREATE OR REPLACE FUNCTION notify_form_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all clients that data has changed
  PERFORM pg_notify('form_refresh', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END
  )::text);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all relevant tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['clients', 'chantiers', 'ouvriers', 'materiel', 
                         'factures', 'facture_items', 'saisies_heures', 
                         'planning_events', 'photos', 'documents', 
                         'parametres_heures_sup'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Drop existing trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS refresh_form_after_change ON %I', t);
    
    -- Create new trigger
    EXECUTE format('
      CREATE TRIGGER refresh_form_after_change
      AFTER INSERT OR UPDATE OR DELETE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION notify_form_refresh()
    ', t);
  END LOOP;
END
$$;

-- Ensure the chantier avancement is updated correctly
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

-- Ensure the delete trigger for chantier avancement works correctly
CREATE OR REPLACE FUNCTION update_chantier_avancement_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  chantier_record RECORD;
  total_hours NUMERIC;
  labor_cost NUMERIC;
  estimated_total_labor_cost NUMERIC;
  progress_by_labor INTEGER;
BEGIN
  -- Only proceed if the chantier_id is not null
  IF OLD.chantier_id IS NOT NULL THEN
    -- Get the chantier information
    SELECT * INTO chantier_record FROM chantiers WHERE id = OLD.chantier_id;
    
    -- Only update if the chantier is active or planned (not completed or paused)
    IF chantier_record.statut IN ('actif', 'planifie') THEN
      -- Calculate total hours for this chantier (after deletion)
      SELECT COALESCE(SUM(heures_total), 0) INTO total_hours 
      FROM saisies_heures 
      WHERE chantier_id = OLD.chantier_id;
      
      -- Calculate labor cost for this chantier (after deletion)
      SELECT COALESCE(SUM(sh.heures_total * o.taux_horaire), 0) INTO labor_cost
      FROM saisies_heures sh
      JOIN ouvriers o ON sh.ouvrier_id = o.id
      WHERE sh.chantier_id = OLD.chantier_id;
      
      -- Estimate total labor cost (assuming labor is about 40% of total budget)
      estimated_total_labor_cost := chantier_record.budget * 0.4;
      
      -- Calculate progress based on labor cost
      IF estimated_total_labor_cost > 0 THEN
        progress_by_labor := LEAST(100, ROUND((labor_cost / estimated_total_labor_cost) * 100));
        
        -- Update the chantier avancement
        UPDATE chantiers 
        SET avancement = progress_by_labor,
            updated_at = NOW()
        WHERE id = OLD.chantier_id;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;