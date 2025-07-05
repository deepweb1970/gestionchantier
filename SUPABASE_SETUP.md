# Configuration de Supabase pour l'Application de Gestion de Chantier

## 1. Création d'un compte et projet Supabase

1. **Créer un compte Supabase**
   - Rendez-vous sur [supabase.com](https://supabase.com)
   - Cliquez sur "Start your project" ou "Sign up"
   - Créez un compte avec votre email ou GitHub

2. **Créer un nouveau projet**
   - Dans le dashboard, cliquez sur "New Project"
   - Donnez un nom à votre projet (ex: "gestion-chantier")
   - Choisissez une région proche de vos utilisateurs
   - Définissez un mot de passe pour la base de données
   - Cliquez sur "Create new project"

3. **Attendre l'initialisation**
   - La création du projet peut prendre 1-2 minutes
   - Une fois terminée, vous serez redirigé vers le dashboard du projet

## 2. Exécution des migrations SQL

1. **Accéder à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New Query" pour créer une nouvelle requête

2. **Exécuter les migrations dans l'ordre**
   - Copiez le contenu de chaque fichier de migration et exécutez-les dans l'ordre:
     1. `20250702152250_fragrant_beacon.sql`
     2. `20250702152333_withered_shrine.sql`
     3. `20250702155442_yellow_shrine.sql`
     4. `20250702163057_shrill_unit.sql`

   > **Note**: Exécutez chaque migration séparément et attendez que chacune soit terminée avant de passer à la suivante.

3. **Vérifier la structure de la base de données**
   - Dans le menu de gauche, cliquez sur "Table Editor"
   - Vous devriez voir toutes les tables créées (clients, chantiers, ouvriers, etc.)

## 3. Configuration de l'authentification

1. **Configurer l'authentification par email**
   - Dans le menu de gauche, cliquez sur "Authentication" puis "Providers"
   - Assurez-vous que "Email" est activé
   - Désactivez "Confirm email" si vous ne souhaitez pas de confirmation par email

2. **Configurer les redirections (optionnel)**
   - Toujours dans "Authentication", allez dans "URL Configuration"
   - Configurez les URL de redirection selon votre domaine

## 4. Récupérer les informations de connexion

1. **Obtenir l'URL et la clé API**
   - Dans le menu de gauche, cliquez sur "Project Settings" puis "API"
   - Copiez les valeurs suivantes:
     - **URL**: `https://votre-projet.supabase.co`
     - **anon/public key**: votre clé publique

2. **Configurer le fichier .env**
   - Créez ou modifiez le fichier `.env` à la racine de votre projet
   - Ajoutez les variables suivantes:

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
```

## 5. Vérification et tests

1. **Vérifier les tables**
   - Exécutez la requête SQL suivante pour vérifier que toutes les tables sont créées:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Vérifier les données initiales**
   - Exécutez les requêtes suivantes pour vérifier les données:
   ```sql
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM chantiers;
   SELECT COUNT(*) FROM ouvriers;
   ```

3. **Tester l'authentification**
   - Dans "Authentication" > "Users", créez un utilisateur de test
   - Essayez de vous connecter avec cet utilisateur dans votre application

## 6. Configuration du stockage (pour les photos)

1. **Configurer le bucket de stockage**
   - Dans le menu de gauche, cliquez sur "Storage"
   - Créez un nouveau bucket nommé "photos"
   - Dans "Policies", ajoutez une politique pour permettre l'accès aux utilisateurs authentifiés

2. **Politique d'accès aux photos**
   - Créez une politique pour permettre aux utilisateurs authentifiés de:
     - Lire toutes les photos
     - Télécharger des photos
     - Supprimer leurs propres photos

## 7. Sécurité et RLS (Row Level Security)

1. **Vérifier les politiques RLS**
   - Les migrations ont déjà configuré les politiques RLS de base
   - Vous pouvez les vérifier et les ajuster dans "Authentication" > "Policies"

2. **Ajuster les politiques selon vos besoins**
   - Pour chaque table, vous pouvez définir des politiques plus précises
   - Par exemple, limiter l'accès aux chantiers selon le rôle de l'utilisateur

## 8. Mise en production

1. **Configurer les restrictions d'accès**
   - Dans "Project Settings" > "API", configurez les restrictions d'accès par domaine

2. **Surveiller l'utilisation**
   - Dans "Project Settings" > "Usage", surveillez l'utilisation de votre base de données

3. **Sauvegardes**
   - Activez les sauvegardes automatiques dans "Project Settings" > "Database"

## 9. Dépannage courant

- **Erreur de connexion**: Vérifiez que les variables d'environnement sont correctes
- **Erreur RLS**: Vérifiez les politiques d'accès pour chaque table
- **Problèmes d'authentification**: Vérifiez les paramètres dans "Authentication" > "Settings"

---

## Commandes SQL utiles

### Vérifier la structure d'une table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nom_de_la_table';
```

### Réinitialiser une table
```sql
TRUNCATE TABLE nom_de_la_table RESTART IDENTITY CASCADE;
```

### Ajouter un utilisateur administrateur
```sql
INSERT INTO utilisateurs (
  nom, prenom, email, role, permissions, actif
) VALUES (
  'Admin', 'Principal', 'admin@votre-domaine.com', 
  'admin', 
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings'],
  true
);
```