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
    -- Check if trigger already exists
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'refresh_form_after_change' AND tgrelid::regclass::text = t) THEN
      -- Create new trigger
      EXECUTE format('
        CREATE TRIGGER refresh_form_after_change
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION notify_form_refresh()
      ', t);
    END IF;
  END LOOP;
END
$$;

-- Update the RealtimeSupabase hook to listen for form_refresh events
COMMENT ON FUNCTION notify_form_refresh() IS 'Broadcasts a notification when data changes to refresh forms';