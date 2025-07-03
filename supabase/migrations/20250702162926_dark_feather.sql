/*
  # Fix RLS policies for parametres_heures_sup table

  1. Security Updates
    - Drop existing restrictive policies
    - Create comprehensive policies for authenticated users
    - Ensure all CRUD operations work properly for authenticated users

  2. Changes
    - Allow authenticated users to SELECT, INSERT, UPDATE, and DELETE
    - Maintain security while enabling proper functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can insert parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can update parametres_heures_sup" ON parametres_heures_sup;
DROP POLICY IF EXISTS "Authenticated users can delete parametres_heures_sup" ON parametres_heures_sup;

-- Create new comprehensive policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users"
  ON parametres_heures_sup
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);