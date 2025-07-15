#!/bin/bash

# ============================================================================
# Backup Verification Script
# ============================================================================
# Description: Verifies backup integrity and performs validation tests
# Author: ProjectCars Backup System
# Version: 1.0.0
# ============================================================================

set -euo pipefail

# Script directory and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$BACKUP_DIR/config/backup.config.json"
ENV_FILE="$BACKUP_DIR/.env"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
fi

# Default configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/storage/logs/verify-backup-$TIMESTAMP.log"
VERIFICATION_LEVEL="basic"  # basic, full, restore-test
TEST_DB_NAME="backup_verification_test"

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
    cleanup_test_resources
    exit 1
}

cleanup_test_resources() {
    if [[ "${CLEANUP_TEST_DB:-true}" == "true" && -n "${TEST_DB_NAME:-}" ]]; then
        log_info "Cleaning up test database: $TEST_DB_NAME"
        if [[ -n "${PGPASSWORD:-}" && -n "${DB_HOST:-}" ]]; then
            PGPASSWORD="$PGPASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME" 2>/dev/null || true
        fi
    fi
}

# Trap for cleanup
trap cleanup_test_resources EXIT

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --file FILE         Verify specific backup file
    --latest            Verify latest backup file
    --all               Verify all backup files
    --level LEVEL       Verification level: basic, full, restore-test (default: basic)
    --test-db NAME      Test database name for restore testing (default: $TEST_DB_NAME)
    --config FILE       Use custom config file
    --help              Show this help message

VERIFICATION LEVELS:
    basic              File integrity checks (checksums, compression, encryption)
    full               Basic + SQL syntax validation + metadata verification
    restore-test       Full + actual restore to test database

EXAMPLES:
    $0 --latest                           # Verify latest backup (basic)
    $0 --file backup.sql.gz.enc          # Verify specific file
    $0 --latest --level restore-test      # Full restore test
    $0 --all --level full                 # Comprehensive verification

EOF
}

# Parse command line arguments
parse_args() {
    local backup_file=""
    local verify_latest=false
    local verify_all=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --file)
                backup_file="$2"
                shift 2
                ;;
            --latest)
                verify_latest=true
                shift
                ;;
            --all)
                verify_all=true
                shift
                ;;
            --level)
                VERIFICATION_LEVEL="$2"
                case "$VERIFICATION_LEVEL" in
                    basic|full|restore-test) ;;
                    *) error_exit "Invalid verification level: $VERIFICATION_LEVEL" ;;
                esac
                shift 2
                ;;
            --test-db)
                TEST_DB_NAME="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
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
    
    # Determine which files to verify
    if [[ -n "$backup_file" ]]; then
        BACKUP_FILES=("$backup_file")
    elif [[ "$verify_latest" == "true" ]]; then
        BACKUP_FILES=($(find_latest_backup))
    elif [[ "$verify_all" == "true" ]]; then
        mapfile -t BACKUP_FILES < <(find_all_backups)
    else
        log_error "Must specify --file, --latest, or --all"
        usage
        exit 1
    fi
}

# Load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error_exit "Configuration file not found: $CONFIG_FILE"
    fi

    if ! command -v jq &> /dev/null; then
        error_exit "jq is required but not installed"
    fi

    # Parse configuration
    DB_HOST=$(jq -r '.database.connection.host' "$CONFIG_FILE")
    DB_PORT=$(jq -r '.database.connection.port' "$CONFIG_FILE")
    DB_USER=$(jq -r '.database.connection.user' "$CONFIG_FILE")
    SSL_MODE=$(jq -r '.database.connection.ssl_mode' "$CONFIG_FILE")
    
    STORAGE_PATH=$(jq -r '.storage.local.path' "$CONFIG_FILE")
    ENCRYPTION_ENABLED=$(jq -r '.storage.encryption.enabled' "$CONFIG_FILE")
    ENCRYPTION_KEY_FILE=$(jq -r '.storage.encryption.key_file' "$CONFIG_FILE")
    
    # Resolve relative paths
    STORAGE_PATH="$BACKUP_DIR/$STORAGE_PATH"
    ENCRYPTION_KEY_FILE="$BACKUP_DIR/$ENCRYPTION_KEY_FILE"
    
    log_info "Configuration loaded"
}

# Find latest backup file
find_latest_backup() {
    local latest_file
    latest_file=$(find "$STORAGE_PATH" -name "full-backup-*.sql.gz*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -z "$latest_file" ]]; then
        error_exit "No backup files found in $STORAGE_PATH"
    fi
    
    echo "$latest_file"
}

# Find all backup files
find_all_backups() {
    find "$STORAGE_PATH" -name "full-backup-*.sql.gz*" -type f | sort
}

# Basic file integrity verification
verify_file_integrity() {
    local backup_file="$1"
    local backup_basename
    backup_basename=$(basename "$backup_file")
    
    log_info "Verifying file integrity: $backup_basename"
    
    # Check if file exists and is readable
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    if [[ ! -r "$backup_file" ]]; then
        log_error "Backup file not readable: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size
    file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    if [[ "$file_size" -eq 0 ]]; then
        log_error "Backup file is empty: $backup_file"
        return 1
    fi
    
    log_info "File size: $(numfmt --to=iec "$file_size")"
    
    # Verify checksums if metadata file exists
    local metadata_file="${backup_file%.*.*}.metadata.json"
    if [[ -f "$metadata_file" ]]; then
        log_info "Verifying checksums against metadata..."
        
        local expected_md5
        local expected_sha256
        expected_md5=$(jq -r '.checksums.md5' "$metadata_file")
        expected_sha256=$(jq -r '.checksums.sha256' "$metadata_file")
        
        local actual_md5
        local actual_sha256
        actual_md5=$(md5sum "$backup_file" | cut -d' ' -f1)
        actual_sha256=$(sha256sum "$backup_file" | cut -d' ' -f1)
        
        if [[ "$expected_md5" != "$actual_md5" ]]; then
            log_error "MD5 checksum mismatch!"
            log_error "Expected: $expected_md5"
            log_error "Actual:   $actual_md5"
            return 1
        fi
        
        if [[ "$expected_sha256" != "$actual_sha256" ]]; then
            log_error "SHA256 checksum mismatch!"
            log_error "Expected: $expected_sha256"
            log_error "Actual:   $actual_sha256"
            return 1
        fi
        
        log_info "Checksums verified successfully"
    else
        log_warn "Metadata file not found, skipping checksum verification"
    fi
    
    return 0
}

# Verify compression and encryption
verify_compression_encryption() {
    local backup_file="$1"
    local backup_basename
    backup_basename=$(basename "$backup_file")
    
    log_info "Verifying compression/encryption: $backup_basename"
    
    # Test decompression and decryption
    if [[ "$backup_file" == *.enc ]]; then
        log_info "Testing decryption and compression..."
        
        if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
            log_error "Encryption key file not found: $ENCRYPTION_KEY_FILE"
            return 1
        fi
        
        # Test decryption and decompression pipeline
        if ! openssl enc -aes-256-gcm -d -in "$backup_file" -pass file:"$ENCRYPTION_KEY_FILE" | gzip -t; then
            log_error "Decryption or decompression test failed"
            return 1
        fi
        
        log_info "Decryption and compression test passed"
    else
        log_info "Testing compression..."
        
        if ! gzip -t "$backup_file"; then
            log_error "Compression test failed"
            return 1
        fi
        
        log_info "Compression test passed"
    fi
    
    return 0
}

# Verify SQL syntax (requires decompressing backup)
verify_sql_syntax() {
    local backup_file="$1"
    local backup_basename
    backup_basename=$(basename "$backup_file")
    
    log_info "Verifying SQL syntax: $backup_basename"
    
    # Create temporary file for SQL content
    local temp_sql_file
    temp_sql_file=$(mktemp)
    
    # Extract SQL content
    if [[ "$backup_file" == *.enc ]]; then
        if ! openssl enc -aes-256-gcm -d -in "$backup_file" -pass file:"$ENCRYPTION_KEY_FILE" | gunzip > "$temp_sql_file"; then
            log_error "Failed to extract SQL content for syntax check"
            rm -f "$temp_sql_file"
            return 1
        fi
    else
        if ! gunzip -c "$backup_file" > "$temp_sql_file"; then
            log_error "Failed to extract SQL content for syntax check"
            rm -f "$temp_sql_file"
            return 1
        fi
    fi
    
    # Basic SQL syntax validation
    log_info "Performing basic SQL syntax validation..."
    
    # Check for SQL keywords and structure
    local sql_keywords=("CREATE" "INSERT" "ALTER" "DROP")
    local found_keywords=0
    
    for keyword in "${sql_keywords[@]}"; do
        if grep -q "^$keyword" "$temp_sql_file"; then
            ((found_keywords++))
        fi
    done
    
    if [[ $found_keywords -lt 2 ]]; then
        log_warn "SQL file may not contain valid database dump (few SQL keywords found)"
    else
        log_info "SQL syntax appears valid ($found_keywords SQL keywords found)"
    fi
    
    # Check file size
    local sql_size
    sql_size=$(stat -f%z "$temp_sql_file" 2>/dev/null || stat -c%s "$temp_sql_file" 2>/dev/null)
    log_info "Uncompressed SQL size: $(numfmt --to=iec "$sql_size")"
    
    rm -f "$temp_sql_file"
    return 0
}

# Perform restore test to temporary database
perform_restore_test() {
    local backup_file="$1"
    local backup_basename
    backup_basename=$(basename "$backup_file")
    
    log_info "Performing restore test: $backup_basename"
    
    # Check required environment variables
    if [[ -z "${PGPASSWORD:-}" ]]; then
        log_error "PGPASSWORD environment variable required for restore test"
        return 1
    fi
    
    # Create test database
    log_info "Creating test database: $TEST_DB_NAME"
    if ! PGPASSWORD="$PGPASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME" 2>/dev/null; then
        log_warn "Test database may already exist, attempting to drop and recreate..."
        PGPASSWORD="$PGPASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME" 2>/dev/null || true
        if ! PGPASSWORD="$PGPASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME"; then
            log_error "Failed to create test database"
            return 1
        fi
    fi
    
    # Restore backup to test database
    log_info "Restoring backup to test database..."
    
    local restore_start_time
    restore_start_time=$(date +%s)
    
    if [[ "$backup_file" == *.enc ]]; then
        # Decrypt and restore
        if ! openssl enc -aes-256-gcm -d -in "$backup_file" -pass file:"$ENCRYPTION_KEY_FILE" | gunzip | PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -q; then
            log_error "Restore test failed"
            return 1
        fi
    else
        # Decompress and restore
        if ! gunzip -c "$backup_file" | PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -q; then
            log_error "Restore test failed"
            return 1
        fi
    fi
    
    local restore_end_time
    restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log_info "Restore completed in ${restore_duration} seconds"
    
    # Verify restored database
    log_info "Verifying restored database..."
    
    # Check table count
    local table_count
    table_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [[ "$table_count" -gt 0 ]]; then
        log_info "Restored database contains $table_count tables"
    else
        log_error "Restored database contains no tables"
        return 1
    fi
    
    # Test a simple query on critical tables
    local critical_tables=("profiles" "listings" "messages")
    for table in "${critical_tables[@]}"; do
        if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" &>/dev/null; then
            local row_count
            row_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
            log_info "Table '$table': $row_count rows"
        else
            log_warn "Could not query table '$table' (may not exist in backup)"
        fi
    done
    
    log_info "Restore test completed successfully"
    return 0
}

# Verify backup metadata
verify_metadata() {
    local backup_file="$1"
    local metadata_file="${backup_file%.*.*}.metadata.json"
    
    if [[ ! -f "$metadata_file" ]]; then
        log_warn "Metadata file not found: $metadata_file"
        return 0
    fi
    
    log_info "Verifying backup metadata..."
    
    # Validate JSON structure
    if ! jq empty "$metadata_file" 2>/dev/null; then
        log_error "Invalid JSON in metadata file"
        return 1
    fi
    
    # Extract and display key metadata
    local backup_name
    local backup_timestamp
    local backup_type
    local backup_size
    
    backup_name=$(jq -r '.backup_info.name' "$metadata_file")
    backup_timestamp=$(jq -r '.backup_info.timestamp' "$metadata_file")
    backup_type=$(jq -r '.backup_info.type' "$metadata_file")
    backup_size=$(jq -r '.backup_info.size' "$metadata_file")
    
    log_info "Backup name: $backup_name"
    log_info "Timestamp: $backup_timestamp"
    log_info "Type: $backup_type"
    log_info "Size: $backup_size"
    
    return 0
}

# Verify single backup file
verify_backup_file() {
    local backup_file="$1"
    local backup_basename
    backup_basename=$(basename "$backup_file")
    
    log_info "Starting verification of: $backup_basename"
    log_info "Verification level: $VERIFICATION_LEVEL"
    
    local verification_start_time
    verification_start_time=$(date +%s)
    
    # Basic verification (always performed)
    if ! verify_file_integrity "$backup_file"; then
        log_error "File integrity verification failed for: $backup_basename"
        return 1
    fi
    
    if ! verify_compression_encryption "$backup_file"; then
        log_error "Compression/encryption verification failed for: $backup_basename"
        return 1
    fi
    
    verify_metadata "$backup_file"
    
    # Full verification
    if [[ "$VERIFICATION_LEVEL" == "full" || "$VERIFICATION_LEVEL" == "restore-test" ]]; then
        if ! verify_sql_syntax "$backup_file"; then
            log_error "SQL syntax verification failed for: $backup_basename"
            return 1
        fi
    fi
    
    # Restore test
    if [[ "$VERIFICATION_LEVEL" == "restore-test" ]]; then
        if ! perform_restore_test "$backup_file"; then
            log_error "Restore test failed for: $backup_basename"
            return 1
        fi
    fi
    
    local verification_end_time
    verification_end_time=$(date +%s)
    local verification_duration=$((verification_end_time - verification_start_time))
    
    log_info "Verification completed successfully in ${verification_duration} seconds: $backup_basename"
    return 0
}

# Main execution function
main() {
    log_info "Starting ProjectCars Database Backup Verification"
    log_info "Script: $0"
    log_info "PID: $$"
    log_info "Verification level: $VERIFICATION_LEVEL"
    
    # Parse arguments and load configuration
    parse_args "$@"
    load_config
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Verify each backup file
    local total_files=${#BACKUP_FILES[@]}
    local successful_verifications=0
    local failed_verifications=0
    
    log_info "Found $total_files backup file(s) to verify"
    
    for backup_file in "${BACKUP_FILES[@]}"; do
        if verify_backup_file "$backup_file"; then
            ((successful_verifications++))
        else
            ((failed_verifications++))
        fi
    done
    
    # Summary
    log_info "Verification Summary:"
    log_info "  Total files: $total_files"
    log_info "  Successful: $successful_verifications"
    log_info "  Failed: $failed_verifications"
    
    if [[ $failed_verifications -eq 0 ]]; then
        log_info "All backup verifications completed successfully"
        exit 0
    else
        log_error "Some backup verifications failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 