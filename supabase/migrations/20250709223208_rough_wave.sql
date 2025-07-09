/*
  # Add photo refresh trigger
  
  1. New Triggers
    - Adds a trigger to the photos table to refresh forms when photos change
  
  2. Changes
    - Creates a trigger that will execute after INSERT, UPDATE, or DELETE operations
    - Uses the existing notify_form_refresh function
*/

-- Create trigger on photos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'refresh_form_after_change'
    AND tgrelid = 'public.photos'::regclass
  ) THEN
    CREATE TRIGGER refresh_form_after_change
    AFTER INSERT OR UPDATE OR DELETE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION notify_form_refresh();
  END IF;
END $$;