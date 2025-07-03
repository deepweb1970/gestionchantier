/*
  # Fix RLS policies for parametres_heures_sup table

  1. Changes
    - Drop existing policies that might be causing conflicts
    - Create comprehensive policies for all CRUD operations
    - Allow authenticated users to perform all operations on the table
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent tout voir" ON parametres_heures_sup;
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