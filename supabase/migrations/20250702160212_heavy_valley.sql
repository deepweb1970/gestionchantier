/*
  # Fix RLS policies for parametres_heures_sup table

  1. Security Updates
    - Add specific INSERT policy for authenticated users
    - Add specific UPDATE policy for authenticated users  
    - Add specific DELETE policy for authenticated users
    - Keep existing SELECT policy for authenticated users

  The current generic "ALL" policy is not sufficient for Supabase RLS.
  We need explicit policies for each operation type (SELECT, INSERT, UPDATE, DELETE).
*/

-- Remove the existing generic policy if it exists
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent tout voir" ON parametres_heures_sup;

-- Add specific policies for each operation
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