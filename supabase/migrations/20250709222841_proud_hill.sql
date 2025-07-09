/*
  # Add photo refresh trigger

  1. New Trigger
    - Creates a trigger to notify clients when photos are modified
    - Enables real-time updates for the photo management module
  
  2. Function
    - Creates a notify_photo_refresh function that broadcasts changes
*/

-- Create function to notify clients about photo changes
CREATE OR REPLACE FUNCTION notify_photo_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to the photos channel
  PERFORM pg_notify('photos_changes', json_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
  )::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on photos table
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'refresh_photos_after_change') THEN
    CREATE TRIGGER refresh_photos_after_change
    AFTER INSERT OR UPDATE OR DELETE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION notify_photo_refresh();
  END IF;
END $$;