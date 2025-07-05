#!/bin/bash

# Script de monitoring de l'application
# Usage: ./monitoring.sh [check|status|logs|restart]

set -e

APP_NAME="gestion-chantier"
APP_DIR="/var/www/gestion-chantier"
LOG_DIR="/var/log/nginx"

# Fonction de logging avec couleurs
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "\033[0;32m[$timestamp] INFO: $message\033[0m" ;;
        "WARN")  echo -e "\033[0;33m[$timestamp] WARN: $message\033[0m" ;;
        "ERROR") echo -e "\033[0;31m[$timestamp] ERROR: $message\033[0m" ;;
        *)       echo "[$timestamp] $level: $message" ;;
    esac
}

# Fonction de vérification de l'état des services
check_services() {
    log "INFO" "🔍 Vérification de l'état des services..."
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        log "INFO" "✅ Nginx: Actif"
    else
        log "ERROR" "❌ Nginx: Inactif"
        return 1
    fi
    
    # PM2 (si utilisé)
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "$APP_NAME"; then
            local status=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
            if [ "$status" = "online" ]; then
                log "INFO" "✅ PM2 ($APP_NAME): En ligne"
            else
                log "ERROR" "❌ PM2 ($APP_NAME): $status"
                return 1
            fi
        else
            log "WARN" "⚠️ PM2: Application $APP_NAME non trouvée"
        fi
    fi
    
    # Vérification HTTP
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        log "INFO" "✅ HTTP: Réponse OK"
    else
        log "ERROR" "❌ HTTP: Pas de réponse"
        return 1
    fi
    
    return 0
}

# Fonction de vérification des ressources système
check_resources() {
    log "INFO" "📊 Vérification des ressources système..."
    
    # Utilisation CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log "WARN" "⚠️ CPU: ${cpu_usage}% (élevé)"
    else
        log "INFO" "✅ CPU: ${cpu_usage}%"
    fi
    
    # Utilisation mémoire
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        log "WARN" "⚠️ Mémoire: ${mem_usage}% (élevée)"
    else
        log "INFO" "✅ Mémoire: ${mem_usage}%"
    fi
    
    # Espace disque
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        log "WARN" "⚠️ Disque: ${disk_usage}% (élevé)"
    else
        log "INFO" "✅ Disque: ${disk_usage}%"
    fi
    
    # Charge système
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    if (( $(echo "$load_avg > $cpu_cores" | bc -l) )); then
        log "WARN" "⚠️ Charge: $load_avg (élevée pour $cpu_cores cores)"
    else
        log "INFO" "✅ Charge: $load_avg"
    fi
}

# Fonction de vérification des logs d'erreur
check_logs() {
    log "INFO" "📋 Vérification des logs d'erreur récents..."
    
    # Logs Nginx
    if [ -f "$LOG_DIR/error.log" ]; then
        local nginx_errors=$(tail -n 100 $LOG_DIR/error.log | grep "$(date '+%Y/%m/%d')" | wc -l)
        if [ "$nginx_errors" -gt 10 ]; then
            log "WARN" "⚠️ Nginx: $nginx_errors erreurs aujourd'hui"
        else
            log "INFO" "✅ Nginx: $nginx_errors erreurs aujourd'hui"
        fi
    fi
    
    # Logs système
    local system_errors=$(journalctl --since "1 hour ago" --priority=err | wc -l)
    if [ "$system_errors" -gt 5 ]; then
        log "WARN" "⚠️ Système: $system_errors erreurs dans la dernière heure"
    else
        log "INFO" "✅ Système: $system_errors erreurs dans la dernière heure"
    fi
}

# Fonction de vérification de la connectivité
check_connectivity() {
    log "INFO" "🌐 Vérification de la connectivité..."
    
    # Test de connectivité internet
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log "INFO" "✅ Internet: Connecté"
    else
        log "ERROR" "❌ Internet: Déconnecté"
        return 1
    fi
    
    # Test Supabase (si configuré)
    if [ -f "$APP_DIR/.env" ]; then
        local supabase_url=$(grep VITE_SUPABASE_URL $APP_DIR/.env | cut -d'=' -f2)
        if [ -n "$supabase_url" ]; then
            if curl -s --max-time 10 "$supabase_url/rest/v1/" &> /dev/null; then
                log "INFO" "✅ Supabase: Accessible"
            else
                log "WARN" "⚠️ Supabase: Inaccessible"
            fi
        fi
    fi
}

# Fonction d'affichage du statut complet
show_status() {
    echo "🚀 === STATUT DE L'APPLICATION $APP_NAME ==="
    echo ""
    
    check_services
    echo ""
    check_resources
    echo ""
    check_connectivity
    echo ""
    check_logs
    echo ""
    
    # Informations supplémentaires
    log "INFO" "📈 Uptime: $(uptime -p)"
    log "INFO" "🕒 Dernière sauvegarde: $(ls -t /backup/gestion-chantier/app_*.tar.gz 2>/dev/null | head -n1 | xargs ls -l 2>/dev/null | awk '{print $6, $7, $8}' || echo 'Aucune')"
    
    if [ -f "$APP_DIR/.env" ]; then
        log "INFO" "⚙️ Configuration: Présente"
    else
        log "WARN" "⚠️ Configuration: Fichier .env manquant"
    fi
}

# Fonction d'affichage des logs en temps réel
show_logs() {
    echo "📋 === LOGS EN TEMPS RÉEL ==="
    echo "Appuyez sur Ctrl+C pour arrêter"
    echo ""
    
    # Logs multiples en parallèle
    tail -f $LOG_DIR/access.log $LOG_DIR/error.log 2>/dev/null | while read line; do
        echo "[$(date '+%H:%M:%S')] $line"
    done
}

# Fonction de redémarrage des services
restart_services() {
    log "INFO" "🔄 Redémarrage des services..."
    
    # Test de la configuration avant redémarrage
    if ! nginx -t; then
        log "ERROR" "❌ Configuration Nginx invalide, annulation du redémarrage"
        return 1
    fi
    
    # Redémarrage Nginx
    if systemctl restart nginx; then
        log "INFO" "✅ Nginx redémarré"
    else
        log "ERROR" "❌ Échec du redémarrage de Nginx"
        return 1
    fi
    
    # Redémarrage PM2 (si utilisé)
    if command -v pm2 &> /dev/null && pm2 list | grep -q "$APP_NAME"; then
        if pm2 restart $APP_NAME; then
            log "INFO" "✅ PM2 ($APP_NAME) redémarré"
        else
            log "ERROR" "❌ Échec du redémarrage de PM2"
            return 1
        fi
    fi
    
    # Attendre et vérifier
    sleep 5
    if check_services; then
        log "INFO" "✅ Tous les services sont opérationnels"
    else
        log "ERROR" "❌ Problème détecté après redémarrage"
        return 1
    fi
}

# Fonction de vérification complète
full_check() {
    echo "🔍 === VÉRIFICATION COMPLÈTE ==="
    echo ""
    
    local errors=0
    
    if ! check_services; then
        ((errors++))
    fi
    
    check_resources
    check_connectivity
    check_logs
    
    echo ""
    if [ $errors -eq 0 ]; then
        log "INFO" "✅ Système opérationnel"
        exit 0
    else
        log "ERROR" "❌ $errors problème(s) détecté(s)"
        exit 1
    fi
}

# Menu principal
case ${1:-status} in
    "check")
        full_check
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        restart_services
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [check|status|logs|restart]"
        echo ""
        echo "Commandes:"
        echo "  check   - Vérification complète avec code de sortie"
        echo "  status  - Affichage du statut détaillé (défaut)"
        echo "  logs    - Affichage des logs en temps réel"
        echo "  restart - Redémarrage des services"
        echo "  help    - Affichage de cette aide"
        ;;
    *)
        echo "❌ Commande inconnue: $1"
        echo "Utilisez '$0 help' pour voir les commandes disponibles"
        exit 1
        ;;
esac