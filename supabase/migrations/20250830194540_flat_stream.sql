/*
  # Create authentication users and corresponding database entries

  1. Create test users in auth.users (via SQL)
  2. Create corresponding entries in utilisateurs table
  3. Set up proper permissions for each role

  Note: This migration creates the basic user accounts needed for testing.
  In production, users should be created through the application interface.
*/

-- Create test users in the utilisateurs table
-- These will be linked to Supabase Auth users

INSERT INTO utilisateurs (
  id,
  nom,
  prenom,
  email,
  role,
  actif,
  permissions,
  derniere_connexion
) VALUES 
(
  gen_random_uuid(),
  'Admin',
  'Super',
  'admin@chantier.com',
  'admin',
  true,
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings'],
  now()
),
(
  gen_random_uuid(),
  'Manager',
  'Chef',
  'manager@chantier.com',
  'manager',
  true,
  ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports'],
  now()
),
(
  gen_random_uuid(),
  'Employe',
  'Standard',
  'employe@chantier.com',
  'employe',
  true,
  ARRAY['read', 'view_reports'],
  now()
)
ON CONFLICT (email) DO NOTHING;