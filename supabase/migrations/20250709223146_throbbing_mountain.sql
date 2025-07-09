/*
  # Add photo refresh trigger

  1. New Functions
    - `notify_photo_refresh`: Triggers a notification when photos are modified
  
  2. New Triggers
    - `refresh_photos_after_change`: Executes on photos table after INSERT, UPDATE, DELETE
*/

-- Create function to notify clients about photo changes
CREATE OR REPLACE FUNCTION notify_form_refresh()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('form_refresh', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on photos table
CREATE TRIGGER refresh_form_after_change
AFTER INSERT OR UPDATE OR DELETE ON photos
FOR EACH ROW
EXECUTE FUNCTION notify_form_refresh();