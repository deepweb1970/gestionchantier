/*
  # Fix RLS policies for parametres_heures_sup table

  1. Security
    - Drop existing restrictive policy
    - Add comprehensive policies for authenticated users to perform all operations
    - Ensure authenticated users can INSERT, UPDATE, DELETE, and SELECT records

  This migration fixes the RLS policy violations that were preventing
  users from creating and updating overtime parameters configurations.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON parametres_heures_sup;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Authenticated users can view all parametres_heures_sup"
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