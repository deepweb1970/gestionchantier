/*
  # Fix RLS policies - Check before creating

  1. Changes
    - Check if policies exist before creating them
    - Ensure RLS is enabled on all tables
    - Maintain all security policies from original migration
*/

-- Activer RLS sur toutes les tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients' AND rowsecurity = true) THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chantiers' AND rowsecurity = true) THEN
    ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ouvriers' AND rowsecurity = true) THEN
    ALTER TABLE ouvriers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'materiel' AND rowsecurity = true) THEN
    ALTER TABLE materiel ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'utilisateurs' AND rowsecurity = true) THEN
    ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'factures' AND rowsecurity = true) THEN
    ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'facture_items' AND rowsecurity = true) THEN
    ALTER TABLE facture_items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saisies_heures' AND rowsecurity = true) THEN
    ALTER TABLE saisies_heures ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planning_events' AND rowsecurity = true) THEN
    ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'photos' AND rowsecurity = true) THEN
    ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'documents' AND rowsecurity = true) THEN
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rapports' AND rowsecurity = true) THEN
    ALTER TABLE rapports ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'historique_connexions' AND rowsecurity = true) THEN
    ALTER TABLE historique_connexions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'parametres_heures_sup' AND rowsecurity = true) THEN
    ALTER TABLE parametres_heures_sup ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Politiques RLS pour les utilisateurs authentifiés (avec vérification d'existence)
DO $$
BEGIN
  -- clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON clients FOR ALL TO authenticated USING (true);
  END IF;
  
  -- chantiers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chantiers' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON chantiers FOR ALL TO authenticated USING (true);
  END IF;
  
  -- ouvriers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ouvriers' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON ouvriers FOR ALL TO authenticated USING (true);
  END IF;
  
  -- materiel
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materiel' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON materiel FOR ALL TO authenticated USING (true);
  END IF;
  
  -- utilisateurs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'utilisateurs' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON utilisateurs FOR ALL TO authenticated USING (true);
  END IF;
  
  -- factures
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factures' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON factures FOR ALL TO authenticated USING (true);
  END IF;
  
  -- facture_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facture_items' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON facture_items FOR ALL TO authenticated USING (true);
  END IF;
  
  -- saisies_heures
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saisies_heures' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON saisies_heures FOR ALL TO authenticated USING (true);
  END IF;
  
  -- planning_events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planning_events' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON planning_events FOR ALL TO authenticated USING (true);
  END IF;
  
  -- photos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'photos' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON photos FOR ALL TO authenticated USING (true);
  END IF;
  
  -- documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON documents FOR ALL TO authenticated USING (true);
  END IF;
  
  -- rapports
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapports' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON rapports FOR ALL TO authenticated USING (true);
  END IF;
  
  -- historique_connexions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historique_connexions' AND policyname = 'Utilisateurs authentifiés peuvent tout voir') THEN
    CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON historique_connexions FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Politiques RLS spécifiques pour parametres_heures_sup
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_heures_sup' AND policyname = 'Authenticated users can view all parametres_heures_sup') THEN
    CREATE POLICY "Authenticated users can view all parametres_heures_sup"
      ON parametres_heures_sup
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  -- INSERT policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_heures_sup' AND policyname = 'Authenticated users can insert parametres_heures_sup') THEN
    CREATE POLICY "Authenticated users can insert parametres_heures_sup"
      ON parametres_heures_sup
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  -- UPDATE policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_heures_sup' AND policyname = 'Authenticated users can update parametres_heures_sup') THEN
    CREATE POLICY "Authenticated users can update parametres_heures_sup"
      ON parametres_heures_sup
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- DELETE policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_heures_sup' AND policyname = 'Authenticated users can delete parametres_heures_sup') THEN
    CREATE POLICY "Authenticated users can delete parametres_heures_sup"
      ON parametres_heures_sup
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;