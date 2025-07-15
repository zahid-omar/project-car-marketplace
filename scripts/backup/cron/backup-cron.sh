#!/bin/bash

# ============================================================================
# Backup Cron Job Management Script
# ============================================================================
# Description: Manages cron jobs for automated backup system
# Author: ProjectCars Backup System
# Version: 1.0.0
# ============================================================================

set -euo pipefail

# Script directory and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$BACKUP_DIR/config/backup.config.json"
CRON_TAG="ProjectCars-Backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $*"; }

# Usage information
usage() {
    cat << EOF
Usage: $0 COMMAND [OPTIONS]

COMMANDS:
    install     Install all backup cron jobs
    uninstall   Remove all backup cron jobs
    status      Show current cron job status
    list        List all scheduled backup jobs
    test        Test cron job syntax
    enable      Enable specific cron job
    disable     Disable specific cron job

OPTIONS:
    --config FILE   Use custom config file (default: $CONFIG_FILE)
    --user USER     Install cron jobs for specific user (default: current user)
    --help          Show this help message

EXAMPLES:
    $0 install                    # Install all cron jobs
    $0 status                     # Show current status
    $0 uninstall                  # Remove all cron jobs
    $0 enable full_backup         # Enable full backup job
    $0 disable incremental_backup # Disable incremental backup job

EOF
}

# Load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi

    log_info "Loading configuration from: $CONFIG_FILE"
}

# Get cron schedule from config
get_cron_schedule() {
    local job_type="$1"
    jq -r ".schedules.${job_type}.cron" "$CONFIG_FILE"
}

# Check if cron schedule is enabled
is_cron_enabled() {
    local job_type="$1"
    local enabled
    enabled=$(jq -r ".schedules.${job_type}.enabled" "$CONFIG_FILE")
    [[ "$enabled" == "true" ]]
}

# Generate cron job entries
generate_cron_jobs() {
    local cron_jobs=()
    
    # Full backup job (encrypted)
    if is_cron_enabled "full_backup"; then
        local full_schedule
        full_schedule=$(get_cron_schedule "full_backup")
        cron_jobs+=("$full_schedule $BACKUP_DIR/scripts/encrypted-backup.sh create # $CRON_TAG-encrypted-full")
    fi
    
    # Incremental backup job (if implemented)
    if is_cron_enabled "incremental_backup"; then
        local incremental_schedule
        incremental_schedule=$(get_cron_schedule "incremental_backup")
        cron_jobs+=("$incremental_schedule $BACKUP_DIR/scripts/incremental-backup.sh # $CRON_TAG-incremental")
    fi
    
    # Cleanup job
    if is_cron_enabled "cleanup"; then
        local cleanup_schedule
        cleanup_schedule=$(get_cron_schedule "cleanup")
        cron_jobs+=("$cleanup_schedule $BACKUP_DIR/scripts/cleanup.sh # $CRON_TAG-cleanup")
    fi
    
    # Health check monitoring
    local monitoring_enabled
    monitoring_enabled=$(jq -r '.monitoring.health_check.enabled' "$CONFIG_FILE")
    if [[ "$monitoring_enabled" == "true" ]]; then
        local interval_minutes
        interval_minutes=$(jq -r '.monitoring.health_check.interval_minutes' "$CONFIG_FILE")
        local cron_interval="*/$interval_minutes * * * *"
        cron_jobs+=("$cron_interval $BACKUP_DIR/monitoring/health-check.sh # $CRON_TAG-monitoring")
    fi
    
    # Encryption monitoring
    local encryption_monitoring_enabled
    encryption_monitoring_enabled=$(jq -r '.monitoring.encryption_monitoring.enabled' "$CONFIG_FILE")
    if [[ "$encryption_monitoring_enabled" == "true" ]]; then
        local encryption_interval_hours
        encryption_interval_hours=$(jq -r '.monitoring.encryption_monitoring.integrity_check_interval_hours' "$CONFIG_FILE")
        local encryption_cron_interval="0 */$encryption_interval_hours * * *"
        cron_jobs+=("$encryption_cron_interval $BACKUP_DIR/scripts/encryption-monitor.sh monitor # $CRON_TAG-encryption")
    fi
    
    printf '%s\n' "${cron_jobs[@]}"
}

# Install cron jobs
install_cron_jobs() {
    log_info "Installing backup cron jobs..."
    
    # Generate current cron jobs
    local new_jobs
    new_jobs=$(generate_cron_jobs)
    
    if [[ -z "$new_jobs" ]]; then
        log_warn "No cron jobs to install (all jobs disabled in config)"
        return 0
    fi
    
    # Get current crontab (excluding our jobs)
    local current_cron
    current_cron=$(crontab -l 2>/dev/null | grep -v "$CRON_TAG" || true)
    
    # Combine current and new jobs
    local temp_cron_file
    temp_cron_file=$(mktemp)
    
    # Add existing non-backup jobs
    if [[ -n "$current_cron" ]]; then
        echo "$current_cron" > "$temp_cron_file"
    fi
    
    # Add header comment
    echo "" >> "$temp_cron_file"
    echo "# ProjectCars Database Backup System - Generated $(date)" >> "$temp_cron_file"
    echo "# Do not edit these lines manually - use backup-cron.sh instead" >> "$temp_cron_file"
    
    # Add new backup jobs
    echo "$new_jobs" >> "$temp_cron_file"
    
    # Install new crontab
    if crontab "$temp_cron_file"; then
        log_info "Cron jobs installed successfully"
        
        # Show installed jobs
        echo ""
        log_info "Installed backup cron jobs:"
        echo "$new_jobs" | while IFS= read -r line; do
            echo "  $line"
        done
    else
        log_error "Failed to install cron jobs"
        rm -f "$temp_cron_file"
        exit 1
    fi
    
    rm -f "$temp_cron_file"
}

# Uninstall cron jobs
uninstall_cron_jobs() {
    log_info "Uninstalling backup cron jobs..."
    
    # Get current crontab without our jobs
    local current_cron
    current_cron=$(crontab -l 2>/dev/null | grep -v "$CRON_TAG" || true)
    
    if [[ -z "$current_cron" ]]; then
        # No jobs left, remove crontab entirely
        if crontab -r 2>/dev/null; then
            log_info "All cron jobs removed (crontab cleared)"
        else
            log_info "No crontab to remove"
        fi
    else
        # Keep non-backup jobs
        local temp_cron_file
        temp_cron_file=$(mktemp)
        echo "$current_cron" > "$temp_cron_file"
        
        if crontab "$temp_cron_file"; then
            log_info "Backup cron jobs removed successfully"
        else
            log_error "Failed to update crontab"
            rm -f "$temp_cron_file"
            exit 1
        fi
        
        rm -f "$temp_cron_file"
    fi
}

# Show cron job status
show_status() {
    log_info "Backup cron job status:"
    echo ""
    
    # Check if cron service is running
    if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
        log_info "Cron service: ${GREEN}Running${NC}"
    else
        log_warn "Cron service: ${RED}Not running${NC}"
    fi
    
    # Show current backup-related cron jobs
    local backup_jobs
    backup_jobs=$(crontab -l 2>/dev/null | grep "$CRON_TAG" || true)
    
    if [[ -n "$backup_jobs" ]]; then
        log_info "Installed backup jobs:"
        echo "$backup_jobs" | while IFS= read -r line; do
            echo "  $line"
        done
    else
        log_warn "No backup cron jobs installed"
    fi
    
    echo ""
    
    # Show configuration status
    log_info "Configuration status:"
    
    local job_types=("full_backup" "incremental_backup" "cleanup")
    for job_type in "${job_types[@]}"; do
        local enabled
        enabled=$(jq -r ".schedules.${job_type}.enabled" "$CONFIG_FILE" 2>/dev/null || echo "false")
        local schedule
        schedule=$(jq -r ".schedules.${job_type}.cron" "$CONFIG_FILE" 2>/dev/null || echo "N/A")
        
        if [[ "$enabled" == "true" ]]; then
            echo "  ${job_type}: ${GREEN}Enabled${NC} ($schedule)"
        else
            echo "  ${job_type}: ${RED}Disabled${NC}"
        fi
    done
}

# List scheduled jobs with next run times
list_jobs() {
    log_info "Scheduled backup jobs:"
    echo ""
    
    # Get backup jobs from crontab
    local backup_jobs
    backup_jobs=$(crontab -l 2>/dev/null | grep "$CRON_TAG" || true)
    
    if [[ -z "$backup_jobs" ]]; then
        log_warn "No backup jobs scheduled"
        return 0
    fi
    
    echo "$backup_jobs" | while IFS= read -r line; do
        # Extract cron schedule (first 5 fields)
        local cron_schedule
        cron_schedule=$(echo "$line" | awk '{print $1" "$2" "$3" "$4" "$5}')
        
        # Extract job description from comment
        local job_desc
        job_desc=$(echo "$line" | grep -o "$CRON_TAG-[^[:space:]]*" || echo "backup")
        
        echo "  Job: $job_desc"
        echo "  Schedule: $cron_schedule"
        
        # Try to calculate next run time if possible
        if command -v next-cron-run &> /dev/null; then
            local next_run
            next_run=$(next-cron-run "$cron_schedule" 2>/dev/null || echo "Unable to calculate")
            echo "  Next run: $next_run"
        fi
        
        echo ""
    done
}

# Test cron job syntax
test_cron_syntax() {
    log_info "Testing cron job syntax..."
    
    local jobs
    jobs=$(generate_cron_jobs)
    
    if [[ -z "$jobs" ]]; then
        log_warn "No jobs to test"
        return 0
    fi
    
    local temp_cron_file
    temp_cron_file=$(mktemp)
    echo "$jobs" > "$temp_cron_file"
    
    # Basic syntax validation
    local line_num=0
    local errors=0
    
    while IFS= read -r line; do
        ((line_num++))
        
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Check basic cron syntax (should have at least 6 fields)
        local field_count
        field_count=$(echo "$line" | wc -w)
        
        if [[ $field_count -lt 6 ]]; then
            log_error "Line $line_num: Invalid cron syntax (too few fields)"
            log_error "  $line"
            ((errors++))
        else
            log_info "Line $line_num: OK"
        fi
    done < "$temp_cron_file"
    
    rm -f "$temp_cron_file"
    
    if [[ $errors -eq 0 ]]; then
        log_info "All cron job syntax checks passed"
    else
        log_error "$errors syntax error(s) found"
        exit 1
    fi
}

# Enable/disable specific job
toggle_job() {
    local action="$1"
    local job_type="$2"
    
    if [[ ! "$job_type" =~ ^(full_backup|incremental_backup|cleanup)$ ]]; then
        log_error "Invalid job type: $job_type"
        log_error "Valid types: full_backup, incremental_backup, cleanup"
        exit 1
    fi
    
    local enabled_value
    if [[ "$action" == "enable" ]]; then
        enabled_value="true"
    else
        enabled_value="false"
    fi
    
    # Update config file
    local temp_config
    temp_config=$(mktemp)
    
    if jq ".schedules.${job_type}.enabled = $enabled_value" "$CONFIG_FILE" > "$temp_config"; then
        mv "$temp_config" "$CONFIG_FILE"
        log_info "Job $job_type ${action}d in configuration"
        log_info "Run 'install' command to apply changes to crontab"
    else
        log_error "Failed to update configuration"
        rm -f "$temp_config"
        exit 1
    fi
}

# Main execution
main() {
    if [[ $# -eq 0 ]]; then
        usage
        exit 1
    fi
    
    local command="$1"
    shift
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --user)
                log_warn "User-specific cron jobs not implemented yet"
                shift 2
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                if [[ "$command" =~ ^(enable|disable)$ && -z "${job_type:-}" ]]; then
                    job_type="$1"
                    shift
                else
                    log_error "Unknown option: $1"
                    usage
                    exit 1
                fi
                ;;
        esac
    done
    
    # Load configuration
    load_config
    
    # Execute command
    case "$command" in
        install)
            install_cron_jobs
            ;;
        uninstall)
            uninstall_cron_jobs
            ;;
        status)
            show_status
            ;;
        list)
            list_jobs
            ;;
        test)
            test_cron_syntax
            ;;
        enable)
            if [[ -z "${job_type:-}" ]]; then
                log_error "Job type required for enable command"
                usage
                exit 1
            fi
            toggle_job "enable" "$job_type"
            ;;
        disable)
            if [[ -z "${job_type:-}" ]]; then
                log_error "Job type required for disable command"
                usage
                exit 1
            fi
            toggle_job "disable" "$job_type"
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 