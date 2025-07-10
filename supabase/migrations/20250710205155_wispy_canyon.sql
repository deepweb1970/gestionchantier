/*
  # Remove form refresh triggers

  1. Changes
    - Drop the refresh_form_after_change triggers from all tables
    - Drop the notify_form_refresh function
    - Remove automatic form refresh functionality
    
  2. Purpose
    - Eliminate unnecessary automatic refreshes
    - Improve performance by reducing database load
    - Give users more control over when data is refreshed
*/

-- Drop the refresh_form_after_change triggers from all tables
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
    -- Check if trigger exists before dropping
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'refresh_form_after_change' 
      AND tgrelid::regclass::text = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS refresh_form_after_change ON %I', t);
    END IF;
  END LOOP;
END
$$;

-- Drop the notify_form_refresh function if it exists
DROP FUNCTION IF EXISTS notify_form_refresh();