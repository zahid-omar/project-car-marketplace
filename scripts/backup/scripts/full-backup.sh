#!/bin/bash

# ============================================================================
# Full Database Backup Script
# ============================================================================
# Description: Creates a complete backup of the Supabase PostgreSQL database
# Author: ProjectCars Backup System
# Version: 1.0.0
# ============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Script directory and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$BACKUP_DIR/config/backup.config.json"
ENV_FILE="$BACKUP_DIR/.env"

# Load environment variables if .env file exists
if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
fi

# Default configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/storage/logs/full-backup-$TIMESTAMP.log"
BACKUP_NAME="full-backup-$TIMESTAMP"
TEST_MODE=false

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { log "DEBUG" "$@"; }

# Error handling
error_exit() {
    log_error "FATAL: $1"
    cleanup_on_error
    exit 1
}

cleanup_on_error() {
    log_warn "Cleaning up due to error..."
    if [[ -n "${BACKUP_FILE:-}" && -f "$BACKUP_FILE" ]]; then
        rm -f "$BACKUP_FILE"
        log_info "Removed incomplete backup file: $BACKUP_FILE"
    fi
}

# Trap for cleanup on exit/error
trap cleanup_on_error ERR INT TERM

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --test          Run in test mode (smaller backup, different location)
    --config FILE   Use custom config file (default: $CONFIG_FILE)
    --help          Show this help message

EXAMPLES:
    $0                    # Run full backup with default settings
    $0 --test            # Run test backup
    $0 --config /path/to/custom.json

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --test)
                TEST_MODE=true
                BACKUP_NAME="test-backup-$TIMESTAMP"
                log_info "Running in TEST MODE"
                shift
                ;;
            --config)
                CONFIG_FILE="$2"
                if [[ ! -f "$CONFIG_FILE" ]]; then
                    error_exit "Config file not found: $CONFIG_FILE"
                fi
                shift 2
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Load configuration from JSON file
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error_exit "Configuration file not found: $CONFIG_FILE"
    fi

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        error_exit "jq is required but not installed. Please install jq to parse JSON config."
    fi

    # Parse configuration
    DB_HOST=$(jq -r '.database.connection.host' "$CONFIG_FILE")
    DB_PORT=$(jq -r '.database.connection.port' "$CONFIG_FILE")
    DB_NAME=$(jq -r '.database.connection.database' "$CONFIG_FILE")
    DB_USER=$(jq -r '.database.connection.user' "$CONFIG_FILE")
    SSL_MODE=$(jq -r '.database.connection.ssl_mode' "$CONFIG_FILE")
    
    STORAGE_PATH=$(jq -r '.storage.local.path' "$CONFIG_FILE")
    COMPRESSION=$(jq -r '.storage.local.compression' "$CONFIG_FILE")
    COMPRESSION_LEVEL=$(jq -r '.storage.local.compression_level' "$CONFIG_FILE")
    
    ENCRYPTION_ENABLED=$(jq -r '.storage.encryption.enabled' "$CONFIG_FILE")
    ENCRYPTION_KEY_FILE=$(jq -r '.storage.encryption.key_file' "$CONFIG_FILE")
    
    PARALLEL_JOBS=$(jq -r '.database.backup_options.parallel_jobs' "$CONFIG_FILE")
    
    # Resolve relative paths
    STORAGE_PATH="$BACKUP_DIR/$STORAGE_PATH"
    ENCRYPTION_KEY_FILE="$BACKUP_DIR/$ENCRYPTION_KEY_FILE"
    
    log_info "Configuration loaded from: $CONFIG_FILE"
}

# Validate environment and dependencies
validate_environment() {
    log_info "Validating environment..."

    # Check required environment variables
    if [[ -z "${PGPASSWORD:-}" ]]; then
        error_exit "PGPASSWORD environment variable is required"
    fi

    # Check required tools
    local required_tools=("pg_dump" "gzip" "openssl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool not found: $tool"
        fi
    done

    # Create necessary directories
    mkdir -p "$STORAGE_PATH" "$(dirname "$LOG_FILE")"
    
    # Validate encryption setup if enabled
    if [[ "$ENCRYPTION_ENABLED" == "true" ]]; then
        if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
            log_warn "Encryption key file not found. Generating new key..."
            generate_encryption_key
        fi
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    if ! PGPASSWORD="$PGPASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error_exit "Cannot connect to database: $DB_HOST:$DB_PORT/$DB_NAME"
    fi
    
    log_info "Environment validation successful"
}

# Generate encryption key if needed
generate_encryption_key() {
    local key_dir
    key_dir="$(dirname "$ENCRYPTION_KEY_FILE")"
    mkdir -p "$key_dir"
    
    # Generate 256-bit random key
    openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
    chmod 600 "$ENCRYPTION_KEY_FILE"
    
    log_info "Generated new encryption key: $ENCRYPTION_KEY_FILE"
}

# Create database backup
create_backup() {
    log_info "Starting full database backup..."
    
    local backup_sql_file="$STORAGE_PATH/${BACKUP_NAME}.sql"
    local backup_compressed_file="$STORAGE_PATH/${BACKUP_NAME}.sql.gz"
    
    # Set backup file based on encryption
    if [[ "$ENCRYPTION_ENABLED" == "true" ]]; then
        BACKUP_FILE="$STORAGE_PATH/${BACKUP_NAME}.sql.gz.enc"
    else
        BACKUP_FILE="$backup_compressed_file"
    fi
    
    # pg_dump options
    local pg_dump_opts=(
        "--host=$DB_HOST"
        "--port=$DB_PORT"
        "--username=$DB_USER"
        "--dbname=$DB_NAME"
        "--no-password"
        "--verbose"
        "--format=custom"
        "--compress=$COMPRESSION_LEVEL"
        "--jobs=$PARALLEL_JOBS"
        "--file=$backup_sql_file.custom"
    )
    
    # Add SSL mode if specified
    if [[ "$SSL_MODE" != "null" && -n "$SSL_MODE" ]]; then
        export PGSSLMODE="$SSL_MODE"
    fi
    
    # Create the backup
    log_info "Executing pg_dump with $PARALLEL_JOBS parallel jobs..."
    if ! PGPASSWORD="$PGPASSWORD" pg_dump "${pg_dump_opts[@]}" 2>> "$LOG_FILE"; then
        error_exit "pg_dump failed. Check log file: $LOG_FILE"
    fi
    
    # Convert custom format to SQL for better portability
    log_info "Converting backup to SQL format..."
    if ! PGPASSWORD="$PGPASSWORD" pg_restore --file="$backup_sql_file" --verbose "$backup_sql_file.custom" 2>> "$LOG_FILE"; then
        error_exit "pg_restore conversion failed"
    fi
    
    # Remove custom format file
    rm -f "$backup_sql_file.custom"
    
    # Compress the backup
    log_info "Compressing backup..."
    if ! gzip -"$COMPRESSION_LEVEL" "$backup_sql_file"; then
        error_exit "Compression failed"
    fi
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == "true" ]]; then
        log_info "Encrypting backup..."
        if ! openssl enc -aes-256-gcm -salt -in "$backup_compressed_file" -out "$BACKUP_FILE" -pass file:"$ENCRYPTION_KEY_FILE"; then
            error_exit "Encryption failed"
        fi
        # Remove unencrypted file
        rm -f "$backup_compressed_file"
    fi
    
    # Get backup file size
    local backup_size
    backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    
    log_info "Backup completed successfully"
    log_info "Backup file: $BACKUP_FILE"
    log_info "Backup size: $backup_size"
    
    # Create metadata file
    create_backup_metadata "$backup_size"
}

# Create backup metadata file
create_backup_metadata() {
    local backup_size="$1"
    local metadata_file="$STORAGE_PATH/${BACKUP_NAME}.metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "backup_info": {
    "name": "$BACKUP_NAME",
    "timestamp": "$TIMESTAMP",
    "type": "full",
    "size": "$backup_size",
    "file": "$(basename "$BACKUP_FILE")",
    "compressed": true,
    "encrypted": $ENCRYPTION_ENABLED,
    "test_mode": $TEST_MODE
  },
  "database": {
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "database": "$DB_NAME",
    "user": "$DB_USER"
  },
  "backup_options": {
    "parallel_jobs": $PARALLEL_JOBS,
    "compression": "$COMPRESSION",
    "compression_level": $COMPRESSION_LEVEL
  },
  "checksums": {
    "md5": "$(md5sum "$BACKUP_FILE" | cut -d' ' -f1)",
    "sha256": "$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)"
  },
  "created_by": {
    "script": "$0",
    "user": "$(whoami)",
    "hostname": "$(hostname)",
    "pid": $$
  }
}
EOF
    
    log_info "Metadata created: $metadata_file"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [[ ! -f "$BACKUP_FILE" || ! -s "$BACKUP_FILE" ]]; then
        error_exit "Backup file is missing or empty: $BACKUP_FILE"
    fi
    
    # Test decompression and decryption without extracting
    if [[ "$ENCRYPTION_ENABLED" == "true" ]]; then
        log_info "Testing decryption..."
        if ! openssl enc -aes-256-gcm -d -in "$BACKUP_FILE" -pass file:"$ENCRYPTION_KEY_FILE" | gzip -t; then
            error_exit "Backup verification failed: encryption/compression test failed"
        fi
    else
        log_info "Testing compression..."
        if ! gzip -t "$BACKUP_FILE"; then
            error_exit "Backup verification failed: compression test failed"
        fi
    fi
    
    log_info "Backup verification successful"
}

# Send notifications
send_notifications() {
    local status="$1"
    local message="$2"
    
    # Log to system
    log_info "Backup $status: $message"
    
    # TODO: Implement email/webhook notifications based on config
    # This would read the monitoring.alerts section from config and send notifications
}

# Main execution function
main() {
    log_info "Starting ProjectCars Database Full Backup"
    log_info "Script: $0"
    log_info "PID: $$"
    log_info "User: $(whoami)"
    log_info "Hostname: $(hostname)"
    
    # Parse arguments and load configuration
    parse_args "$@"
    load_config
    validate_environment
    
    # Create backup
    local start_time
    start_time=$(date +%s)
    
    create_backup
    verify_backup
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Backup completed in ${duration} seconds"
    
    # Send success notification
    send_notifications "SUCCESS" "Full backup completed successfully in ${duration}s"
    
    log_info "Full backup process completed successfully"
}

# Run main function with all arguments
main "$@" 