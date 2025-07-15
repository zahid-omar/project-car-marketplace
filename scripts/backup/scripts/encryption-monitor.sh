#!/bin/bash

# Encryption Monitoring Script
# Monitors encryption key expiry and backup integrity for the Project Car Marketplace

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$BACKUP_DIR/config/backup.config.json"
ENCRYPTION_DIR="$BACKUP_DIR/storage/encryption"
LOCAL_STORAGE="$BACKUP_DIR/storage/local"
LOG_DIR="$BACKUP_DIR/storage/logs"
LOG_FILE="$LOG_DIR/encryption-monitor-$(date +%Y%m%d).log"

# Alert settings
ALERT_EMAIL=""
ALERT_WEBHOOK=""
KEY_EXPIRY_DAYS=7  # Alert when key is older than this many days
BACKUP_MAX_AGE_HOURS=25  # Alert if no backup in this many hours

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert functions
send_alert() {
    local severity="$1"
    local subject="$2"
    local message="$3"
    
    log "[$severity] $subject: $message"
    
    # Send email alert if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$severity] ProjectCars Backup: $subject" "$ALERT_EMAIL"
    fi
    
    # Send webhook alert if configured
    if [[ -n "$ALERT_WEBHOOK" ]] && command -v curl >/dev/null 2>&1; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"severity\":\"$severity\",\"subject\":\"$subject\",\"message\":\"$message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            >/dev/null 2>&1 || true
    fi
}

# Check encryption key age
check_key_age() {
    local key_file="$ENCRYPTION_DIR/backup-key.key"
    
    if [[ ! -f "$key_file" ]]; then
        send_alert "CRITICAL" "Missing Encryption Key" "Primary encryption key not found: $key_file"
        return 1
    fi
    
    # Check key age
    local key_age_days
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        key_age_days=$(( ($(date +%s) - $(stat -f%m "$key_file")) / 86400 ))
    else
        # Linux
        key_age_days=$(( ($(date +%s) - $(stat -c%Y "$key_file")) / 86400 ))
    fi
    
    log "Encryption key age: $key_age_days days"
    
    if [[ $key_age_days -gt 90 ]]; then
        send_alert "CRITICAL" "Key Rotation Required" "Encryption key is $key_age_days days old. Rotation recommended every 90 days."
    elif [[ $key_age_days -gt 80 ]]; then
        send_alert "WARNING" "Key Rotation Due Soon" "Encryption key is $key_age_days days old. Consider rotation soon."
    fi
    
    # Check key file permissions
    local key_perms
    if [[ "$OSTYPE" == "darwin"* ]]; then
        key_perms=$(stat -f%A "$key_file")
    else
        key_perms=$(stat -c%a "$key_file")
    fi
    
    if [[ "$key_perms" != "600" ]]; then
        send_alert "CRITICAL" "Insecure Key Permissions" "Encryption key has insecure permissions: $key_perms (should be 600)"
    fi
}

# Check backup integrity
check_backup_integrity() {
    local backup_count=0
    local failed_count=0
    
    # Find recent encrypted backups
    local recent_backups
    recent_backups=$(find "$LOCAL_STORAGE" -name "*.encrypted" -type f -mtime -1 2>/dev/null || true)
    
    if [[ -z "$recent_backups" ]]; then
        send_alert "CRITICAL" "No Recent Backups" "No encrypted backups found in the last 24 hours"
        return 1
    fi
    
    log "Checking integrity of recent backups..."
    
    while IFS= read -r backup_file; do
        if [[ -z "$backup_file" ]]; then
            continue
        fi
        
        ((backup_count++))
        
        local hash_file="${backup_file%.encrypted}.hash"
        local metadata_file="${backup_file%.encrypted}.metadata.json"
        
        # Check if associated files exist
        if [[ ! -f "$hash_file" ]]; then
            send_alert "ERROR" "Missing Hash File" "Hash file missing for backup: $(basename "$backup_file")"
            ((failed_count++))
            continue
        fi
        
        if [[ ! -f "$metadata_file" ]]; then
            send_alert "WARNING" "Missing Metadata File" "Metadata file missing for backup: $(basename "$backup_file")"
        fi
        
        # Verify backup integrity
        if ! bash "$BACKUP_DIR/scripts/backup-encryption.sh" verify-integrity "$backup_file" "$hash_file" >/dev/null 2>&1; then
            send_alert "CRITICAL" "Backup Integrity Failed" "Integrity check failed for backup: $(basename "$backup_file")"
            ((failed_count++))
        else
            log "Integrity check passed for: $(basename "$backup_file")"
        fi
        
        # Test decryption
        local temp_decrypt="/tmp/monitor_test_$(date +%s)"
        if ! bash "$BACKUP_DIR/scripts/backup-encryption.sh" decrypt "$backup_file" "$temp_decrypt" "$ENCRYPTION_DIR/backup-key.key" >/dev/null 2>&1; then
            send_alert "CRITICAL" "Backup Decryption Failed" "Decryption test failed for backup: $(basename "$backup_file")"
            ((failed_count++))
        else
            log "Decryption test passed for: $(basename "$backup_file")"
        fi
        
        # Cleanup test file
        rm -f "$temp_decrypt"
        
    done <<< "$recent_backups"
    
    log "Backup integrity check complete: $backup_count backups checked, $failed_count failures"
    
    if [[ $failed_count -gt 0 ]]; then
        send_alert "CRITICAL" "Backup Integrity Issues" "$failed_count out of $backup_count backups failed integrity checks"
    fi
}

# Check backup freshness
check_backup_freshness() {
    local latest_backup
    latest_backup=$(find "$LOCAL_STORAGE" -name "*.encrypted" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2- || true)
    
    if [[ -z "$latest_backup" ]]; then
        send_alert "CRITICAL" "No Backups Found" "No encrypted backup files found in storage"
        return 1
    fi
    
    local backup_age_hours
    if [[ "$OSTYPE" == "darwin"* ]]; then
        backup_age_hours=$(( ($(date +%s) - $(stat -f%m "$latest_backup")) / 3600 ))
    else
        backup_age_hours=$(( ($(date +%s) - $(stat -c%Y "$latest_backup")) / 3600 ))
    fi
    
    log "Latest backup age: $backup_age_hours hours ($(basename "$latest_backup"))"
    
    if [[ $backup_age_hours -gt $BACKUP_MAX_AGE_HOURS ]]; then
        send_alert "CRITICAL" "Stale Backup" "Latest backup is $backup_age_hours hours old. Expected backup every 24 hours."
    fi
}

# Check storage space
check_storage_space() {
    local storage_usage
    storage_usage=$(df -h "$LOCAL_STORAGE" 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ -n "$storage_usage" ]]; then
        log "Storage usage: ${storage_usage}%"
        
        if [[ $storage_usage -gt 90 ]]; then
            send_alert "CRITICAL" "Storage Nearly Full" "Backup storage is ${storage_usage}% full"
        elif [[ $storage_usage -gt 80 ]]; then
            send_alert "WARNING" "Storage High Usage" "Backup storage is ${storage_usage}% full"
        fi
    fi
}

# Check configuration
check_configuration() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        send_alert "CRITICAL" "Missing Configuration" "Backup configuration file not found: $CONFIG_FILE"
        return 1
    fi
    
    # Verify encryption is enabled
    local encryption_enabled
    encryption_enabled=$(jq -r '.encryption.enabled' "$CONFIG_FILE" 2>/dev/null || echo "false")
    
    if [[ "$encryption_enabled" != "true" ]]; then
        send_alert "CRITICAL" "Encryption Disabled" "Backup encryption is disabled in configuration"
    fi
    
    # Check key file path
    local key_file_path
    key_file_path=$(jq -r '.encryption.key_file' "$CONFIG_FILE" 2>/dev/null || echo "")
    
    if [[ -z "$key_file_path" ]]; then
        send_alert "ERROR" "Missing Key File Path" "Encryption key file path not configured"
    fi
}

# Generate monitoring report
generate_report() {
    local report_file="$LOG_DIR/encryption-monitor-report-$(date +%Y%m%d).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "system": "ProjectCars Backup Encryption Monitor",
    "checks": {
        "key_age": "$(check_key_age 2>&1 | tail -1)",
        "backup_integrity": "$(check_backup_integrity 2>&1 | tail -1)",
        "backup_freshness": "$(check_backup_freshness 2>&1 | tail -1)",
        "storage_space": "$(check_storage_space 2>&1 | tail -1)",
        "configuration": "$(check_configuration 2>&1 | tail -1)"
    },
    "backup_count": $(find "$LOCAL_STORAGE" -name "*.encrypted" -type f | wc -l),
    "log_file": "$LOG_FILE"
}
EOF
    
    log "Monitoring report generated: $report_file"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        # Load alert settings from config if available
        ALERT_EMAIL=$(jq -r '.monitoring.alerts.email // ""' "$CONFIG_FILE" 2>/dev/null || echo "")
        ALERT_WEBHOOK=$(jq -r '.monitoring.alerts.webhook // ""' "$CONFIG_FILE" 2>/dev/null || echo "")
        KEY_EXPIRY_DAYS=$(jq -r '.monitoring.key_expiry_days // 7' "$CONFIG_FILE" 2>/dev/null || echo "7")
        BACKUP_MAX_AGE_HOURS=$(jq -r '.monitoring.backup_max_age_hours // 25' "$CONFIG_FILE" 2>/dev/null || echo "25")
    fi
}

# Main function
main() {
    local action="${1:-monitor}"
    
    log "Starting encryption monitoring: $action"
    
    # Load configuration
    load_config
    
    case "$action" in
        "monitor")
            check_configuration
            check_key_age
            check_backup_integrity
            check_backup_freshness
            check_storage_space
            generate_report
            ;;
        "key-age")
            check_key_age
            ;;
        "integrity")
            check_backup_integrity
            ;;
        "freshness")
            check_backup_freshness
            ;;
        "storage")
            check_storage_space
            ;;
        "config")
            check_configuration
            ;;
        "report")
            generate_report
            ;;
        *)
            echo "Usage: $0 [monitor|key-age|integrity|freshness|storage|config|report]"
            echo "  monitor   - Run all checks (default)"
            echo "  key-age   - Check encryption key age"
            echo "  integrity - Check backup integrity"
            echo "  freshness - Check backup freshness"
            echo "  storage   - Check storage space"
            echo "  config    - Check configuration"
            echo "  report    - Generate monitoring report"
            exit 1
            ;;
    esac
    
    log "Encryption monitoring completed: $action"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
