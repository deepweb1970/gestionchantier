#!/bin/bash

# Script d'installation automatique du serveur
# Usage: sudo ./setup-server.sh

set -e

DOMAIN=${1:-"votre-domaine.com"}
APP_USER=${2:-"appuser"}
APP_DIR="/var/www/gestion-chantier"

echo "🚀 Configuration du serveur pour l'application de gestion de chantier"
echo "Domaine: $DOMAIN"
echo "Utilisateur: $APP_USER"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root"
    exit 1
fi

log "📦 Mise à jour du système..."
apt update && apt upgrade -y

log "📦 Installation des dépendances système..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

log "📦 Installation de Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

log "📦 Installation de Nginx..."
apt install -y nginx

log "📦 Installation de Certbot pour SSL..."
apt install -y certbot python3-certbot-nginx

log "📦 Installation de PM2..."
npm install -g pm2

log "👤 Création de l'utilisateur de l'application..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    usermod -aG sudo $APP_USER
    log "✅ Utilisateur $APP_USER créé"
else
    log "ℹ️ Utilisateur $APP_USER existe déjà"
fi

log "📁 Création des dossiers de l'application..."
mkdir -p $APP_DIR
mkdir -p /backup/gestion-chantier
chown -R $APP_USER:$APP_USER $APP_DIR
chown -R $APP_USER:$APP_USER /backup/gestion-chantier

log "🔧 Configuration de Nginx..."
cat > /etc/nginx/sites-available/gestion-chantier << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Gestion des routes SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Compression gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' *.supabase.co *.pexels.com" always;
    
    # Logs
    access_log /var/log/nginx/gestion-chantier.access.log;
    error_log /var/log/nginx/gestion-chantier.error.log;
}
EOF

log "🔗 Activation du site Nginx..."
ln -sf /etc/nginx/sites-available/gestion-chantier /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

log "🧪 Test de la configuration Nginx..."
nginx -t

log "🔄 Redémarrage de Nginx..."
systemctl restart nginx
systemctl enable nginx

log "🔥 Configuration du firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

log "📊 Configuration de la rotation des logs..."
cat > /etc/logrotate.d/gestion-chantier << EOF
/var/log/nginx/gestion-chantier.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

log "⏰ Configuration des tâches cron..."
cat > /etc/cron.d/gestion-chantier << EOF
# Sauvegarde quotidienne à 2h du matin
0 2 * * * $APP_USER /var/www/gestion-chantier/scripts/backup.sh

# Nettoyage des logs toutes les semaines
0 3 * * 0 root find /var/log/nginx -name "*.log.*.gz" -mtime +30 -delete

# Renouvellement SSL automatique
0 12 * * * root certbot renew --quiet && systemctl reload nginx
EOF

log "📝 Création du script de sauvegarde..."
cat > $APP_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/gestion-chantier"
APP_DIR="/var/www/gestion-chantier"

mkdir -p $BACKUP_DIR

# Sauvegarde de l'application
if [ -d "$APP_DIR/dist" ]; then
    tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR dist
fi

# Sauvegarde de la configuration Nginx
cp /etc/nginx/sites-available/gestion-chantier $BACKUP_DIR/nginx_$DATE.conf

# Nettoyage des anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "nginx_*.conf" -mtime +7 -delete

echo "Sauvegarde terminée : $DATE"
EOF

mkdir -p $APP_DIR/scripts
chown -R $APP_USER:$APP_USER $APP_DIR/scripts
chmod +x $APP_DIR/scripts/backup.sh

log "📋 Création du fichier d'environnement..."
cat > $APP_DIR/.env.example << EOF
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_supabase

# Configuration de production
NODE_ENV=production
EOF

chown $APP_USER:$APP_USER $APP_DIR/.env.example

log "📊 Installation d'outils de monitoring..."
apt install -y htop iotop nethogs

log "✅ Configuration du serveur terminée !"
echo ""
echo "🎉 Prochaines étapes :"
echo "1. Connectez-vous en tant que $APP_USER : sudo su - $APP_USER"
echo "2. Copiez votre application dans $APP_DIR"
echo "3. Configurez le fichier .env avec vos clés Supabase"
echo "4. Exécutez : npm install && npm run build"
echo "5. Configurez SSL : sudo certbot --nginx -d $DOMAIN"
echo ""
echo "📁 Dossiers créés :"
echo "  - Application : $APP_DIR"
echo "  - Sauvegardes : /backup/gestion-chantier"
echo "  - Scripts : $APP_DIR/scripts"
echo ""
echo "🔧 Services configurés :"
echo "  - Nginx (port 80/443)"
echo "  - Firewall UFW"
echo "  - Rotation des logs"
echo "  - Sauvegardes automatiques"
echo ""
echo "📊 Monitoring disponible :"
echo "  - htop (utilisation CPU/RAM)"
echo "  - iotop (utilisation disque)"
echo "  - nethogs (utilisation réseau)"
echo ""