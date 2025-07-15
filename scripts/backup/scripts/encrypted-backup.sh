#!/bin/bash

# Encrypted Backup Script - Complete backup workflow with encryption
# Integrates with the backup system to provide encrypted, compressed, and verified backups

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="../config/backup.config.json"
ENCRYPTION_SCRIPT="$SCRIPT_DIR/backup-encryption.sh"
LOCAL_STORAGE="../storage/local"
LOG_DIR="../storage/logs"
ENCRYPTION_DIR="../storage/encryption"
LOG_FILE="$LOG_DIR/backup-$(date +%Y%m%d).log"

# Ensure directories exist
mkdir -p "$LOCAL_STORAGE" "$LOG_DIR" "$ENCRYPTION_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Read configuration
read_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error_exit "Configuration file not found: $CONFIG_FILE"
    fi
    
    # Parse JSON configuration using jq or python
    if command -v jq >/dev/null 2>&1; then
        echo "$1" | jq -r "$2"
    else
        python3 -c "import json, sys; config=json.load(open('$CONFIG_FILE')); print(config$2)" 2>/dev/null || echo ""
    fi
}

# Create backup metadata
create_metadata() {
    local backup_file="$1"
    local metadata_file="$2"
    local start_time="$3"
    local end_time="$4"
    
    log "Creating backup metadata: $metadata_file"
    
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
    local file_hash=$(shasum -a 256 "$backup_file" | cut -d' ' -f1)
    
    cat > "$metadata_file" << EOF
{
    "backup_file": "$(basename "$backup_file")",
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "start_time": "$start_time",
    "end_time": "$end_time",
    "size_bytes": $file_size,
    "sha256_hash": "$file_hash",
    "encrypted": true,
    "compression": "gzip",
    "encryption_algorithm": "AES-256-CBC",
    "version": "1.0"
}
EOF
    
    log "Metadata created successfully"
}

# Perform database backup (mock implementation)
perform_database_backup() {
    local output_file="$1"
    
    log "Starting database backup to: $output_file"
    
    # Mock database backup - in production, this would use pg_dump or similar
    # For testing purposes, create a sample SQL dump
    cat > "$output_file" << 'EOF'
-- Project Car Marketplace Database Backup
-- Generated at: $(date)

-- Sample table structure
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO users (email, name) VALUES 
('user1@example.com', 'John Doe'),
('user2@example.com', 'Jane Smith');

INSERT INTO listings (user_id, title, description, price) VALUES
(1, '2020 Honda Civic', 'Great condition, low mileage', 15000.00),
(2, '2018 Toyota Camry', 'Well maintained, excellent car', 18000.00);

-- End of backup
EOF
    
    log "Database backup completed"
}

# Compress backup file
compress_backup() {
    local input_file="$1"
    local output_file="$2"
    
    log "Compressing backup: $input_file -> $output_file"
    
    gzip -c "$input_file" > "$output_file"
    
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null || echo "0")
    local compressed_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
    
    log "Compression completed. Original: ${original_size} bytes, Compressed: ${compressed_size} bytes"
}

# Main backup function
create_encrypted_backup() {
    local backup_name="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
    local key_file="$ENCRYPTION_DIR/backup-key.key"
    
    log "Starting encrypted backup process: $backup_name"
    
    local start_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Generate encryption key if it doesn't exist
    if [[ ! -f "$key_file" ]]; then
        log "Generating new encryption key"
        bash "$ENCRYPTION_SCRIPT" generate-key "$key_file" 256
    fi
    
    # Create temporary files
    local temp_sql="$LOCAL_STORAGE/${backup_name}.sql"
    local temp_compressed="$LOCAL_STORAGE/${backup_name}.sql.gz"
    local encrypted_file="$LOCAL_STORAGE/${backup_name}.encrypted"
    local hash_file="$LOCAL_STORAGE/${backup_name}.hash"
    local metadata_file="$LOCAL_STORAGE/${backup_name}.metadata.json"
    
    # Perform database backup
    perform_database_backup "$temp_sql"
    
    # Compress the backup
    compress_backup "$temp_sql" "$temp_compressed"
    
    # Encrypt the compressed backup
    log "Encrypting compressed backup"
    bash "$ENCRYPTION_SCRIPT" encrypt "$temp_compressed" "$encrypted_file" "$key_file"
    
    # Generate integrity hash
    bash "$ENCRYPTION_SCRIPT" generate-hash "$encrypted_file" "$hash_file"
    
    # Create metadata
    local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    create_metadata "$encrypted_file" "$metadata_file" "$start_time" "$end_time"
    
    # Cleanup temporary files
    rm -f "$temp_sql" "$temp_compressed"
    
    log "Encrypted backup completed successfully: $encrypted_file"
    log "Hash file: $hash_file"
    log "Metadata file: $metadata_file"
    
    # Return the backup file path
    echo "$encrypted_file"
}

# Verify encrypted backup
verify_encrypted_backup() {
    local backup_file="$1"
    local key_file="$ENCRYPTION_DIR/backup-key.key"
    
    log "Verifying encrypted backup: $backup_file"
    
    # Check if files exist
    if [[ ! -f "$backup_file" ]]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    local hash_file="${backup_file%.encrypted}.hash"
    if [[ ! -f "$hash_file" ]]; then
        error_exit "Hash file not found: $hash_file"
    fi
    
    # Verify integrity
    if ! bash "$ENCRYPTION_SCRIPT" verify-integrity "$backup_file" "$hash_file"; then
        error_exit "Backup integrity verification failed"
    fi
    
    # Test decryption
    local temp_decrypted="/tmp/test_decrypt_$(date +%s)"
    if bash "$ENCRYPTION_SCRIPT" decrypt "$backup_file" "$temp_decrypted" "$key_file"; then
        log "Decryption test passed"
        rm -f "$temp_decrypted"
    else
        error_exit "Decryption test failed"
    fi
    
    log "Backup verification completed successfully"
}

# Restore from encrypted backup
restore_encrypted_backup() {
    local backup_file="$1"
    local output_file="$2"
    local key_file="$ENCRYPTION_DIR/backup-key.key"
    
    log "Restoring from encrypted backup: $backup_file -> $output_file"
    
    # Verify backup first
    verify_encrypted_backup "$backup_file"
    
    # Create temporary file for decompression
    local temp_compressed="/tmp/restore_compressed_$(date +%s)"
    
    # Decrypt the backup
    bash "$ENCRYPTION_SCRIPT" decrypt "$backup_file" "$temp_compressed" "$key_file"
    
    # Decompress the backup
    gunzip -c "$temp_compressed" > "$output_file"
    
    # Cleanup
    rm -f "$temp_compressed"
    
    log "Restore completed successfully: $output_file"
}

# Main function
main() {
    local action="${1:-create}"
    shift
    
    case "$action" in
        "create")
            create_encrypted_backup "$@"
            ;;
        "verify")
            if [[ $# -lt 1 ]]; then
                error_exit "Usage: $0 verify <backup_file>"
            fi
            verify_encrypted_backup "$@"
            ;;
        "restore")
            if [[ $# -lt 2 ]]; then
                error_exit "Usage: $0 restore <backup_file> <output_file>"
            fi
            restore_encrypted_backup "$@"
            ;;
        *)
            error_exit "Unknown action: $action"
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <action> [arguments...]"
        echo "Actions:"
        echo "  create [backup_name]     - Create encrypted backup"
        echo "  verify <backup_file>     - Verify encrypted backup"
        echo "  restore <backup_file> <output_file> - Restore from encrypted backup"
        exit 1
    fi
    
    main "$@"
fi
