/*
  # Add Machine Hours and Maintenance Module

  1. New Fields
    - Add `machine_hours` to `materiel` table
  
  2. New Table
    - Create `maintenances` table for tracking equipment maintenance
    - Create `maintenance_types` table for categorizing maintenance operations
  
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add machine_hours to materiel table
ALTER TABLE materiel ADD COLUMN IF NOT EXISTS machine_hours numeric(10,2) DEFAULT 0;
COMMENT ON COLUMN materiel.machine_hours IS 'Total machine hours (from manufacturer)';

-- Create maintenance_types table
CREATE TABLE IF NOT EXISTS maintenance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  intervalle_heures numeric(10,2),
  intervalle_jours integer,
  priorite text CHECK (priorite = ANY (ARRAY['basse', 'moyenne', 'haute', 'critique'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updated_at on maintenance_types
CREATE TRIGGER update_maintenance_types_updated_at
BEFORE UPDATE ON maintenance_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create maintenances table
CREATE TABLE IF NOT EXISTS maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id uuid REFERENCES materiel(id) ON DELETE CASCADE,
  type_id uuid REFERENCES maintenance_types(id) ON DELETE SET NULL,
  date_planifiee date,
  date_execution date,
  heures_machine_debut numeric(10,2),
  heures_machine_fin numeric(10,2),
  duree_heures numeric(5,2),
  cout numeric(10,2) DEFAULT 0,
  statut text CHECK (statut = ANY (ARRAY['planifiee', 'en_cours', 'terminee', 'annulee'])) DEFAULT 'planifiee',
  description text,
  notes text,
  executant_id uuid REFERENCES ouvriers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updated_at on maintenances
CREATE TRIGGER update_maintenances_updated_at
BEFORE UPDATE ON maintenances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate next maintenance date based on machine hours
CREATE OR REPLACE FUNCTION calculate_next_maintenance_date(
  materiel_id uuid,
  type_id uuid
) RETURNS date AS $$
DECLARE
  current_hours numeric;
  maintenance_interval numeric;
  avg_daily_usage numeric;
  last_maintenance_date date;
  interval_days integer;
BEGIN
  -- Get current machine hours
  SELECT machine_hours INTO current_hours FROM materiel WHERE id = materiel_id;
  
  -- Get maintenance interval
  SELECT intervalle_heures, intervalle_jours INTO maintenance_interval, interval_days 
  FROM maintenance_types 
  WHERE id = type_id;
  
  -- Get last maintenance date
  SELECT date_execution INTO last_maintenance_date 
  FROM maintenances 
  WHERE materiel_id = materiel_id AND type_id = type_id AND statut = 'terminee'
  ORDER BY date_execution DESC
  LIMIT 1;
  
  -- If no last maintenance, use today
  IF last_maintenance_date IS NULL THEN
    last_maintenance_date := CURRENT_DATE;
  END IF;
  
  -- Calculate average daily usage (hours per day)
  SELECT COALESCE(AVG(heures_total), 0.5) INTO avg_daily_usage
  FROM saisies_heures
  WHERE materiel_id = materiel_id
  AND date > CURRENT_DATE - INTERVAL '30 days';
  
  -- If no usage data, assume 0.5 hours per day
  IF avg_daily_usage IS NULL OR avg_daily_usage = 0 THEN
    avg_daily_usage := 0.5;
  END IF;
  
  -- Calculate days until next maintenance based on hours
  IF maintenance_interval IS NOT NULL AND maintenance_interval > 0 AND avg_daily_usage > 0 THEN
    RETURN last_maintenance_date + GREATEST(
      CEIL(maintenance_interval / avg_daily_usage)::integer,
      COALESCE(interval_days, 30)
    )::integer;
  ELSE
    -- If no hour-based interval, use day-based interval or default to 30 days
    RETURN last_maintenance_date + COALESCE(interval_days, 30);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update material machine hours after maintenance
CREATE OR REPLACE FUNCTION update_materiel_after_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if maintenance is marked as completed
  IF NEW.statut = 'terminee' AND NEW.heures_machine_fin IS NOT NULL THEN
    -- Update machine_hours in materiel table
    UPDATE materiel
    SET 
      machine_hours = NEW.heures_machine_fin,
      prochaine_maintenance = calculate_next_maintenance_date(NEW.materiel_id, NEW.type_id)
    WHERE id = NEW.materiel_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update material after maintenance
CREATE TRIGGER update_materiel_after_maintenance_trigger
AFTER UPDATE OF statut ON maintenances
FOR EACH ROW
EXECUTE FUNCTION update_materiel_after_maintenance();

-- Enable RLS on new tables
ALTER TABLE maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_types
CREATE POLICY "Authenticated users can view all maintenance_types"
  ON maintenance_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance_types"
  ON maintenance_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_types"
  ON maintenance_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maintenance_types"
  ON maintenance_types
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for maintenances
CREATE POLICY "Authenticated users can view all maintenances"
  ON maintenances
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenances"
  ON maintenances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenances"
  ON maintenances
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maintenances"
  ON maintenances
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert some default maintenance types
INSERT INTO maintenance_types (nom, description, intervalle_heures, intervalle_jours, priorite)
VALUES
  ('Vidange moteur', 'Changement huile et filtres', 250, 180, 'haute'),
  ('Graissage', 'Graissage des points de lubrification', 100, 30, 'moyenne'),
  ('Révision complète', 'Inspection complète et maintenance préventive', 500, 365, 'haute'),
  ('Contrôle hydraulique', 'Vérification du système hydraulique', 200, 90, 'moyenne'),
  ('Remplacement filtres', 'Remplacement des filtres à air et carburant', 300, 180, 'moyenne'),
  ('Contrôle sécurité', 'Vérification des systèmes de sécurité', 150, 60, 'critique'),
  ('Nettoyage', 'Nettoyage complet de la machine', NULL, 30, 'basse');