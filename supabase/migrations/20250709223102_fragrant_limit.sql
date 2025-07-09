/*
  # Photo refresh notification system
  
  1. New Functions
    - `notify_photo_refresh` - Sends notifications when photos are modified
  
  2. Triggers
    - Adds trigger on photos table to call the notification function
    
  This migration enables real-time updates for the photos management interface
  by broadcasting changes to subscribed clients.
*/

-- Create function to notify clients about photo changes
CREATE OR REPLACE FUNCTION notify_photo_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Use notify_form_refresh which already exists in the database
  PERFORM notify_form_refresh();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on photos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'refresh_photos_after_change'
    AND tgrelid = 'public.photos'::regclass
  ) THEN
    CREATE TRIGGER refresh_photos_after_change
    AFTER INSERT OR UPDATE OR DELETE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION notify_photo_refresh();
  END IF;
END $$;