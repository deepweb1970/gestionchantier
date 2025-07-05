#!/bin/bash

# Script de configuration SSL avec Let's Encrypt
# Usage: sudo ./ssl-setup.sh votre-domaine.com

set -e

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

if [ -z "$DOMAIN" ]; then
    echo "❌ Usage: $0 <domaine> [email]"
    echo "Exemple: $0 monsite.com admin@monsite.com"
    exit 1
fi

echo "🔒 Configuration SSL pour $DOMAIN"
echo "📧 Email: $EMAIL"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root"
    exit 1
fi

log "🔍 Vérification de la configuration Nginx..."
if ! nginx -t; then
    log "❌ Configuration Nginx invalide"
    exit 1
fi

log "🌐 Vérification de la résolution DNS..."
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    log "⚠️ Attention: Le domaine $DOMAIN ne semble pas résolu"
    read -p "Continuer quand même ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log "📦 Installation/Mise à jour de Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

log "🔒 Obtention du certificat SSL..."
if certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN,www.$DOMAIN \
    --redirect; then
    log "✅ Certificat SSL obtenu avec succès"
else
    log "❌ Échec de l'obtention du certificat SSL"
    exit 1
fi

log "🔄 Test du renouvellement automatique..."
if certbot renew --dry-run; then
    log "✅ Renouvellement automatique configuré"
else
    log "⚠️ Problème avec le renouvellement automatique"
fi

log "⏰ Configuration du cron pour le renouvellement..."
cat > /etc/cron.d/certbot-renew << EOF
# Renouvellement automatique des certificats SSL
0 12 * * * root certbot renew --quiet && systemctl reload nginx
EOF

log "🧪 Test de la configuration finale..."
nginx -t && systemctl reload nginx

log "🔒 Vérification du certificat..."
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates

echo ""
log "✅ Configuration SSL terminée !"
echo ""
echo "🎉 Votre site est maintenant accessible en HTTPS :"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔄 Le certificat sera renouvelé automatiquement"
echo "📅 Prochaine vérification : $(date -d '+60 days' '+%Y-%m-%d')"
echo ""
echo "🔍 Pour vérifier le statut SSL :"
echo "   certbot certificates"
echo ""
echo "🔄 Pour forcer un renouvellement :"
echo "   certbot renew --force-renewal"