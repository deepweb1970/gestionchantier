/*
  # Photo refresh notification function and trigger
  
  1. New Functions
    - `notify_photo_refresh` - Function to notify clients when photos change
  
  2. New Triggers
    - `refresh_photos_after_change` - Trigger on photos table to call the notification function
*/

-- Check if the function already exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_photo_refresh') THEN
    DROP FUNCTION notify_photo_refresh;
  END IF;
END $$;

-- Create function to notify clients about photo changes
CREATE FUNCTION notify_photo_refresh()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('form_refresh', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'refresh_photos_after_change'
  ) THEN
    DROP TRIGGER IF EXISTS refresh_photos_after_change ON photos;
  END IF;
END $$;

-- Create trigger on photos table
CREATE TRIGGER refresh_photos_after_change
AFTER INSERT OR UPDATE OR DELETE ON photos
FOR EACH ROW
EXECUTE FUNCTION notify_photo_refresh();