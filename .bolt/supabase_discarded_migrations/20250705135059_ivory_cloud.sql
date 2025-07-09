/*
  # Politiques de sécurité RLS (Row Level Security)

  1. Politiques générales
    - Permettre aux utilisateurs authentifiés d'accéder à toutes les tables
    - Configurer des politiques spécifiques pour les tables sensibles

  2. Sécurité
    - Activer RLS sur toutes les tables
    - Définir des politiques d'accès basées sur l'authentification
*/

-- Activer RLS sur toutes les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ouvriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiel ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saisies_heures ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_connexions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_heures_sup ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON chantiers FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON ouvriers FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON materiel FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON utilisateurs FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON factures FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON facture_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON saisies_heures FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON planning_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON photos FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON rapports FOR ALL TO authenticated USING (true);
CREATE POLICY "Utilisateurs authentifiés peuvent tout voir" ON historique_connexions FOR ALL TO authenticated USING (true);

-- Politiques RLS spécifiques pour parametres_heures_sup
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