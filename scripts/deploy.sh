#!/bin/bash

# Script de déploiement automatique
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_DIR="/var/www/gestion-chantier"
BACKUP_DIR="/backup/gestion-chantier"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Déploiement en cours pour l'environnement: $ENVIRONMENT"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction de sauvegarde
backup() {
    log "📦 Création de la sauvegarde..."
    mkdir -p $BACKUP_DIR
    
    if [ -d "$APP_DIR/dist" ]; then
        cp -r $APP_DIR/dist $BACKUP_DIR/dist_backup_$DATE
        log "✅ Sauvegarde créée: dist_backup_$DATE"
    fi
}

# Fonction de rollback
rollback() {
    log "🔄 Rollback en cours..."
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/dist_backup_* | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        rm -rf $APP_DIR/dist
        cp -r $LATEST_BACKUP $APP_DIR/dist
        log "✅ Rollback effectué vers: $(basename $LATEST_BACKUP)"
    else
        log "❌ Aucune sauvegarde trouvée pour le rollback"
        exit 1
    fi
}

# Fonction principale de déploiement
deploy() {
    log "📁 Navigation vers le dossier de l'application..."
    cd $APP_DIR

    log "🔄 Mise à jour du code source..."
    # Décommentez selon votre méthode de déploiement
    # git pull origin main
    # ou copiez vos nouveaux fichiers ici

    log "📦 Installation des dépendances..."
    npm ci --only=production

    log "🏗️ Build de l'application..."
    if npm run build; then
        log "✅ Build réussi"
    else
        log "❌ Échec du build, rollback..."
        rollback
        exit 1
    fi

    log "🔄 Redémarrage des services..."
    if command -v pm2 &> /dev/null; then
        pm2 reload gestion-chantier || true
    fi
    
    sudo systemctl reload nginx

    log "🧹 Nettoyage des anciennes sauvegardes..."
    find $BACKUP_DIR -name "dist_backup_*" -mtime +7 -exec rm -rf {} \;

    log "✅ Déploiement terminé avec succès !"
}

# Vérifications préalables
if [ ! -d "$APP_DIR" ]; then
    log "❌ Dossier de l'application non trouvé: $APP_DIR"
    exit 1
fi

if [ "$EUID" -eq 0 ]; then
    log "⚠️ Ne pas exécuter ce script en tant que root"
    exit 1
fi

# Gestion des arguments
case $1 in
    "rollback")
        rollback
        ;;
    "backup")
        backup
        ;;
    *)
        backup
        deploy
        ;;
esac

log "🎉 Opération terminée !"