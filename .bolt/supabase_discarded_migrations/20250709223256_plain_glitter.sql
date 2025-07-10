/*
  # Add refresh trigger for photos table
  
  1. New Triggers
    - Adds a trigger to the photos table that calls the notify_form_refresh function
    - This enables real-time updates when photos are modified
*/

-- Create trigger on photos table
CREATE TRIGGER refresh_form_after_change
AFTER INSERT OR DELETE OR UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION notify_form_refresh();