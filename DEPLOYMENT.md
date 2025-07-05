# Guide d'hébergement - Application de Gestion de Chantier

## 📋 Prérequis

### Serveur requis
- **OS** : Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM** : Minimum 2GB (4GB recommandé)
- **CPU** : 2 cores minimum
- **Stockage** : 20GB minimum
- **Réseau** : Connexion internet stable

### Logiciels nécessaires
- Node.js 18+ et npm
- Nginx ou Apache
- SSL/TLS (Let's Encrypt recommandé)
- PM2 (pour la gestion des processus)

## 🚀 Option 1 : Hébergement avec Build Statique (Recommandé)

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de Nginx
sudo apt install nginx -y

# Installation de Certbot pour SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuration de l'application

```bash
# Cloner ou copier votre application
cd /var/www/
sudo mkdir gestion-chantier
sudo chown $USER:$USER gestion-chantier
cd gestion-chantier

# Copier les fichiers de votre application
# (via git, scp, ou autre méthode)

# Installation des dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env
nano .env
```

### 3. Configuration du fichier .env

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_supabase

# Configuration de production
NODE_ENV=production
```

### 4. Build de l'application

```bash
# Build de production
npm run build

# Le dossier 'dist' contient maintenant votre application
ls -la dist/
```

### 5. Configuration Nginx

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/gestion-chantier
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    root /var/www/gestion-chantier/dist;
    index index.html;
    
    # Gestion des routes SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 6. Activation de la configuration

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/gestion-chantier /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Configuration SSL avec Let's Encrypt

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

## 🔧 Option 2 : Hébergement avec serveur Node.js

### 1. Configuration du serveur de développement

```bash
# Installation de PM2
sudo npm install -g pm2

# Créer un fichier de configuration PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'gestion-chantier',
    script: 'npm',
    args: 'run dev',
    cwd: '/var/www/gestion-chantier',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

### 2. Démarrage avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

### 3. Configuration Nginx en reverse proxy

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐳 Option 3 : Hébergement avec Docker

### 1. Créer un Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Configuration Nginx pour Docker

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optionnel : Nginx Proxy Manager
  nginx-proxy:
    image: nginxproxymanager/nginx-proxy-manager:latest
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    restart: unless-stopped
```

### 4. Déploiement Docker

```bash
# Build et démarrage
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

## 🗄️ Configuration de la base de données Supabase

### 1. Création du projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter l'URL et la clé anonyme

### 2. Exécution des migrations

1. Aller dans l'éditeur SQL de Supabase
2. Exécuter les fichiers de migration dans l'ordre :
   - `20250702152250_fragrant_beacon.sql`
   - `20250702152333_withered_shrine.sql`
   - `20250702155442_yellow_shrine.sql`
   - `20250702163057_shrill_unit.sql`

### 3. Configuration des variables d'environnement

```env
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔒 Sécurité et maintenance

### 1. Firewall

```bash
# Configuration UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Monitoring

```bash
# Installation de htop pour monitoring
sudo apt install htop

# Monitoring PM2
pm2 monit

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Sauvegardes automatiques

```bash
# Script de sauvegarde
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/gestion-chantier"

# Créer le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder l'application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/gestion-chantier

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée : app_$DATE.tar.gz"
```

```bash
# Rendre le script exécutable
chmod +x backup.sh

# Ajouter au crontab pour exécution quotidienne
crontab -e
# Ajouter : 0 2 * * * /path/to/backup.sh
```

## 📊 Monitoring et logs

### 1. Logs de l'application

```bash
# Logs PM2
pm2 logs gestion-chantier

# Logs Nginx
sudo journalctl -u nginx -f
```

### 2. Monitoring des performances

```bash
# Utilisation des ressources
htop
df -h
free -h

# Statut des services
sudo systemctl status nginx
pm2 status
```

## 🚀 Mise à jour de l'application

### 1. Script de déploiement

```bash
# deploy.sh
#!/bin/bash

echo "🚀 Déploiement de l'application..."

# Aller dans le dossier de l'application
cd /var/www/gestion-chantier

# Sauvegarder la version actuelle
cp -r dist dist_backup_$(date +%Y%m%d_%H%M%S)

# Mettre à jour le code (git pull ou copie des nouveaux fichiers)
# git pull origin main

# Installer les nouvelles dépendances
npm install

# Build de la nouvelle version
npm run build

# Redémarrer les services si nécessaire
sudo systemctl reload nginx

echo "✅ Déploiement terminé !"
```

## 🔧 Dépannage

### Problèmes courants

1. **Erreur 502 Bad Gateway**
   ```bash
   # Vérifier que l'application fonctionne
   pm2 status
   # Vérifier les logs
   pm2 logs
   ```

2. **Problème de permissions**
   ```bash
   # Corriger les permissions
   sudo chown -R www-data:www-data /var/www/gestion-chantier
   sudo chmod -R 755 /var/www/gestion-chantier
   ```

3. **Erreur SSL**
   ```bash
   # Renouveler le certificat
   sudo certbot renew
   sudo systemctl reload nginx
   ```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs d'erreur
2. Consulter la documentation Supabase
3. Tester les requêtes dans l'éditeur SQL

---

**Application prête pour la production ! 🎉**