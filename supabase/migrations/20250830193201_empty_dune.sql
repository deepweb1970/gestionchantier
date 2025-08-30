/*
  # Configuration de l'authentification avec les utilisateurs

  1. Fonction pour synchroniser les utilisateurs Supabase Auth avec la table utilisateurs
  2. Trigger pour créer automatiquement un utilisateur lors de l'inscription
  3. Politiques RLS pour sécuriser l'accès aux données utilisateur
  4. Fonction pour vérifier les permissions utilisateur
*/

-- Fonction pour créer un utilisateur dans la table utilisateurs lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.utilisateurs (id, email, nom, prenom, role, actif, permissions)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(new.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE(new.raw_user_meta_data->>'role', 'employe'),
    true,
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'employe') = 'admin' THEN 
        ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'employe') = 'manager' THEN 
        ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports']
      ELSE 
        ARRAY['read', 'view_reports']
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un utilisateur lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id uuid, permission_name text)
RETURNS boolean AS $$
DECLARE
  user_permissions text[];
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.utilisateurs
  WHERE id = user_id AND actif = true;
  
  RETURN permission_name = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.utilisateurs
  WHERE id = user_id AND actif = true;
  
  RETURN user_role = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour la table utilisateurs
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur propre profil" ON public.utilisateurs;
CREATE POLICY "Utilisateurs peuvent voir leur propre profil"
  ON public.utilisateurs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    public.user_has_permission(auth.uid(), 'manage_users')
  );

DROP POLICY IF EXISTS "Seuls les admins peuvent modifier les utilisateurs" ON public.utilisateurs;
CREATE POLICY "Seuls les admins peuvent modifier les utilisateurs"
  ON public.utilisateurs
  FOR UPDATE
  TO authenticated
  USING (public.user_has_permission(auth.uid(), 'manage_users'))
  WITH CHECK (public.user_has_permission(auth.uid(), 'manage_users'));

DROP POLICY IF EXISTS "Seuls les admins peuvent créer des utilisateurs" ON public.utilisateurs;
CREATE POLICY "Seuls les admins peuvent créer des utilisateurs"
  ON public.utilisateurs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_permission(auth.uid(), 'manage_users'));

DROP POLICY IF EXISTS "Seuls les admins peuvent supprimer des utilisateurs" ON public.utilisateurs;
CREATE POLICY "Seuls les admins peuvent supprimer des utilisateurs"
  ON public.utilisateurs
  FOR DELETE
  TO authenticated
  USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Insérer un utilisateur admin par défaut si aucun n'existe
DO $$
BEGIN
  -- Vérifier s'il existe déjà un admin
  IF NOT EXISTS (SELECT 1 FROM public.utilisateurs WHERE role = 'admin') THEN
    INSERT INTO public.utilisateurs (
      nom, 
      prenom, 
      email, 
      role, 
      actif, 
      permissions
    ) VALUES (
      'Admin',
      'Super',
      'admin@chantier.com',
      'admin',
      true,
      ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
    );
  END IF;
END $$;