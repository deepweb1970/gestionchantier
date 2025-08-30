/*
  # Create test users for authentication

  1. New Users
    - Create admin, manager, and employee test accounts
    - Set up proper permissions for each role
    - Enable accounts by default

  2. Security
    - Users can read their own data
    - Admins can manage all users
*/

-- Insert test users in the utilisateurs table
INSERT INTO utilisateurs (nom, prenom, email, role, actif, permissions) VALUES
(
  'Admin',
  'Super',
  'admin@chantier.com',
  'admin',
  true,
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings']
),
(
  'Manager',
  'Chef',
  'manager@chantier.com',
  'manager',
  true,
  ARRAY['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports']
),
(
  'Employe',
  'Test',
  'employe@chantier.com',
  'employe',
  true,
  ARRAY['read', 'view_reports']
)
ON CONFLICT (email) DO NOTHING;