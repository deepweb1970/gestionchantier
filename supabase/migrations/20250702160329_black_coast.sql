/*
  # Fix RLS policies for parametres_heures_sup table

  1. Security Updates
    - Drop existing incomplete policies
    - Add comprehensive RLS policies for all CRUD operations
    - Ensure authenticated users can perform all operations on parametres_heures_sup table

  2. Policy Details
    - SELECT: Allow authenticated users to read all records
    - INSERT: Allow authenticated users to create new records
    - UPDATE: Allow authenticated users to update existing records
    - DELETE: Allow authenticated users to delete records
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can delete parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can insert parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can update parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can view parametres_heures_sup" ON parametres_heures_sup;

-- Create comprehensive RLS policies for authenticated users
CREATE POLICY "Authenticated users can view parametres_heures_sup"
  ON parametres_heures_sup
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert parametres_heures_sup"
  ON parametres_heures_sup
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parametres_heures_sup"
  ON parametres_heures_sup
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parametres_heures_sup"
  ON parametres_heures_sup
  FOR DELETE
  TO authenticated
  USING (true);