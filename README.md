# Application de Gestion de Chantier

Une application complète de gestion de chantiers de construction avec base de données Supabase. Développée avec React, TypeScript et Tailwind CSS.

## 🏗️ Fonctionnalités

### 📊 **Gestion Complète**
- **Chantiers** : Suivi des projets avec photos et géolocalisation
- **Ouvriers** : Gestion du personnel et des qualifications
- **Matériel** : Inventaire et maintenance des équipements
- **Clients** : Base de données clients (particuliers/entreprises)
- **Facturation** : Création et suivi des factures
- **Planning** : Calendrier des événements et ressources
- **Saisie d'heures** : Pointage et validation des heures
- **Rapports** : Analyses et statistiques

### 🔐 **Sécurité et Utilisateurs**
- **Authentification** : Système de connexion sécurisé
- **Rôles** : Admin, Manager, Employé
- **Permissions** : Contrôle d'accès granulaire
- **Historique** : Traçabilité des connexions

### 📱 **Interface Moderne**
- **Responsive** : Compatible mobile/tablette/desktop
- **Recherche globale** : Recherche dans toute l'application
- **Notifications** : Centre de notifications en temps réel
- **Export** : PDF, CSV, Excel
- **Sauvegarde** : Système de backup automatique

## 🗄️ Base de Données

### **Architecture Supabase**
```sql
-- Tables principales
├── clients (particuliers/entreprises)
├── chantiers (projets avec géolocalisation)
├── ouvriers (personnel avec certifications)
├── materiel (équipements avec tarifs)
├── utilisateurs (comptes avec permissions)
├── factures (facturation avec lignes)
├── saisies_heures (pointage avec validation)
├── planning_events (événements calendrier)
├── photos (images des chantiers)
├── documents (fichiers attachés)
├── rapports (analyses générées)
└── historique_connexions (audit trail)
```

### **Relations Clés**
- **Clients** ↔ **Chantiers** (1:N)
- **Chantiers** ↔ **Photos** (1:N)
- **Ouvriers** ↔ **Saisies Heures** (1:N)
- **Matériel** ↔ **Planning** (1:N)
- **Factures** ↔ **Lignes Facturation** (1:N)

### **Sécurité RLS**
- **Row Level Security** activé sur toutes les tables
- **Politiques d'accès** basées sur l'authentification
- **Audit trail** complet des modifications

## 🚀 Installation

### **1. Prérequis**
```bash
Node.js 18+ et npm
Compte Supabase (gratuit)
Git (optionnel)
```

### **2. Configuration Supabase**
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations SQL dans l'éditeur SQL de Supabase
   - `supabase/migrations/create_schema.sql`
   - `supabase/migrations/insert_initial_data.sql`
   - `supabase/migrations/create_rls_policies.sql`
3. Récupérer l'URL et la clé anonyme du projet

### **3. Installation des dépendances**
```bash
npm install
```

### **4. Configuration environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env.local
```

Remplir le fichier `.env.local` avec vos informations Supabase :
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **5. Lancement**
```bash
npm run dev
```

## 📋 Migrations Base de Données

### **1. Schéma Principal**
```bash
# Exécuter dans l'ordre dans l'éditeur SQL Supabase
supabase/migrations/create_schema.sql
```

### **2. Données Initiales**
```bash
# Insérer les données de test
supabase/migrations/insert_initial_data.sql  
```

### **3. Politiques de sécurité**
```bash
# Configurer les politiques RLS
supabase/migrations/create_rls_policies.sql
```

### **4. Vérification**
```sql
-- Vérifier les tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier les données
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM chantiers;
SELECT COUNT(*) FROM ouvriers;
```

## 🔧 Services API

### **Client Supabase**
```typescript
import { supabase } from './services/supabaseClient';

// Exemple d'utilisation
const clients = await ClientService.getAll();
const chantier = await ChantierService.create(newChantier);
```

### **Services Disponibles**
- `ClientService` - Gestion clients
- `ChantierService` - Gestion chantiers
- `OuvrierService` - Gestion ouvriers
- `MaterielService` - Gestion matériel
- `SaisieHeureService` - Gestion heures
- `FactureService` - Gestion facturation
- `PlanningService` - Gestion planning
- `PhotoService` - Gestion photos

## 📊 Données de Test

### **Clients** (6)
- 4 Particuliers + 2 Entreprises
- Coordonnées complètes
- Notes et historique

### **Chantiers** (5)
- Villa moderne (350k€, 75% avancé)
- Appartement haussmannien (120k€, 45% avancé)
- Extension contemporaine (180k€, terminé)
- Immeuble bureaux (850k€, 25% avancé)
- Rénovation énergétique (65k€, planifié)

### **Équipe** (6 ouvriers)
- Chef d'équipe maçon (28€/h)
- Électricien qualifié (26€/h)
- Plombier-chauffagiste (25€/h)
- Charpentier (24€/h)
- Peintre (22€/h)
- Carreleur (23€/h)

### **Matériel** (6 équipements)
- Pelleteuse CAT320D (85€/h)
- Grue mobile Liebherr (120€/h)
- Compacteur Bomag (45€/h)
- Nacelle Haulotte (35€/h)
- Bétonnière Altrad (15€/h)
- Marteau-piqueur Hilti (8€/h)

## 🎯 Fonctionnalités Avancées

### **Calculs Automatiques**
- Heures supplémentaires (>8h = +25%)
- Coûts de main d'œuvre par chantier
- Rentabilité et marges
- Taux d'utilisation matériel

### **Gestion Photos**
- Catégorisation (avancement, problèmes, sécurité...)
- Métadonnées (date, taille, description)
- Galerie par chantier
- Visualiseur intégré

### **Planning Intelligent**
- Détection de conflits automatique
- Assignation ressources
- Vue mois/semaine/jour
- Synchronisation calendriers externes

### **Rapports Dynamiques**
- Filtrage par période/ressource
- Export multi-formats
- Graphiques et statistiques
- Tableau de bord personnalisable

## 🔒 Sécurité

### **Authentification**
- Connexion sécurisée Supabase Auth
- Gestion des sessions
- Réinitialisation mot de passe

### **Autorisations**
- 3 niveaux : Admin, Manager, Employé
- 12 permissions granulaires
- Contrôle d'accès par fonctionnalité

### **Audit**
- Historique des connexions
- Traçabilité des modifications
- Logs de sécurité

## 📱 Responsive Design

### **Breakpoints**
- Mobile : < 768px
- Tablette : 768px - 1024px
- Desktop : > 1024px

### **Composants Adaptatifs**
- Navigation mobile avec menu hamburger
- Tableaux avec scroll horizontal
- Modales redimensionnables
- Grilles flexibles

## 🚀 Déploiement

### **1. Build Production**
```bash
npm run build
```

### **2. Hébergement Recommandé**
- **Frontend** : Vercel, Netlify
- **Base de données** : Supabase (inclus)
- **Stockage fichiers** : Supabase Storage

### **3. Variables d'Environnement**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Performance

### **Optimisations**
- Lazy loading des composants
- Pagination des listes
- Cache des requêtes
- Images optimisées

### **Monitoring**
- Métriques Supabase intégrées
- Logs d'erreurs
- Performance des requêtes

## 🛠️ Technologies

### **Frontend (Client)**
- **React 18** + TypeScript
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Vite** comme bundler

### **Backend (Serveur)**
- **Supabase** (PostgreSQL + API REST)
- **Row Level Security** (RLS)
- **Triggers** et fonctions automatiques

### **Outils de développement**
- **ESLint** pour la qualité du code
- **PostCSS** + Autoprefixer
- **Git** pour le versioning

---

## 📞 Support

Pour toute question ou problème, vous pouvez :
1. Vérifier la documentation Supabase
2. Consulter les logs d'erreur
3. Tester les requêtes dans l'éditeur SQL
4. Ouvrir une issue sur le dépôt GitHub

**Application complète et prête pour la production ! 🎉**