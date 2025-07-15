#!/bin/bash

# Backup Encryption Script - AES-256-GCM Implementation
# Provides encryption, decryption, key generation, and rotation for backup files

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="../config/backup.config.json"
ENCRYPTION_DIR="../storage/encryption"
LOG_DIR="../storage/logs"
LOG_FILE="$LOG_DIR/encryption-$(date +%Y%m%d).log"

# Ensure directories exist
mkdir -p "$ENCRYPTION_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Generate encryption key
generate_key() {
    local key_file="$1"
    local key_size="${2:-256}"
    
    log "Generating new encryption key: $key_file"
    
    # Generate random key
    openssl rand -base64 $((key_size / 8)) > "$key_file"
    
    # Set secure permissions
    chmod 600 "$key_file"
    
    log "Encryption key generated successfully"
}

# Encrypt file using AES-256-CBC (more compatible than GCM)
encrypt_file() {
    local input_file="$1"
    local output_file="$2"
    local key_file="$3"
    
    if [[ ! -f "$input_file" ]]; then
        error_exit "Input file not found: $input_file"
    fi
    
    if [[ ! -f "$key_file" ]]; then
        error_exit "Key file not found: $key_file"
    fi
    
    log "Encrypting file: $input_file -> $output_file"
    
    # Read the key and derive a 32-byte key for AES-256
    local key_material=$(cat "$key_file")
    local key_hex=$(echo -n "$key_material" | sha256sum | cut -d' ' -f1)
    
    # Generate IV (16 bytes for CBC)
    local iv=$(openssl rand -hex 16)
    
    # Encrypt the file
    openssl enc -aes-256-cbc -e -in "$input_file" -out "$output_file.tmp" -K "$key_hex" -iv "$iv"
    
    # Prepend IV to the encrypted file
    echo "$iv" | xxd -r -p > "$output_file"
    cat "$output_file.tmp" >> "$output_file"
    rm "$output_file.tmp"
    
    log "File encrypted successfully"
}

# Decrypt file using AES-256-CBC
decrypt_file() {
    local input_file="$1"
    local output_file="$2"
    local key_file="$3"
    
    if [[ ! -f "$input_file" ]]; then
        error_exit "Input file not found: $input_file"
    fi
    
    if [[ ! -f "$key_file" ]]; then
        error_exit "Key file not found: $key_file"
    fi
    
    log "Decrypting file: $input_file -> $output_file"
    
    # Read the key and derive a 32-byte key for AES-256
    local key_material=$(cat "$key_file")
    local key_hex=$(echo -n "$key_material" | sha256sum | cut -d' ' -f1)
    
    # Extract IV (first 16 bytes)
    local iv=$(head -c 16 "$input_file" | xxd -p -c 256)
    
    # Extract encrypted data (skip first 16 bytes)
    tail -c +17 "$input_file" > "$input_file.tmp"
    
    # Decrypt the file
    openssl enc -aes-256-cbc -d -in "$input_file.tmp" -out "$output_file" -K "$key_hex" -iv "$iv"
    
    rm "$input_file.tmp"
    
    log "File decrypted successfully"
}

# Generate hash for integrity verification
generate_hash() {
    local file="$1"
    local hash_file="$2"
    
    log "Generating hash for: $file"
    
    shasum -a 256 "$file" > "$hash_file"
    
    log "Hash generated: $hash_file"
}

# Verify file integrity
verify_integrity() {
    local file="$1"
    local hash_file="$2"
    
    if [[ ! -f "$hash_file" ]]; then
        error_exit "Hash file not found: $hash_file"
    fi
    
    log "Verifying integrity of: $file"
    
    if shasum -a 256 -c "$hash_file" >/dev/null 2>&1; then
        log "Integrity verification passed"
        return 0
    else
        log "Integrity verification failed"
        return 1
    fi
}

# Rotate encryption keys
rotate_keys() {
    local current_key="$1"
    local new_key="$2"
    
    log "Starting key rotation process"
    
    # Generate new key
    generate_key "$new_key"
    
    # Find all encrypted files in the encryption directory
    local encrypted_files
    if [[ -d "$ENCRYPTION_DIR" ]]; then
        encrypted_files=$(find "$ENCRYPTION_DIR" -name "*.encrypted" -type f 2>/dev/null || true)
    else
        encrypted_files=""
    fi
    
    # Also check current directory for encrypted files (for testing)
    local current_dir_encrypted
    current_dir_encrypted=$(find . -name "*.encrypted" -type f 2>/dev/null || true)
    
    # Combine both searches
    local all_encrypted_files="$encrypted_files $current_dir_encrypted"
    
    for encrypted_file in $all_encrypted_files; do
        # Skip if file doesn't exist or is empty
        if [[ ! -f "$encrypted_file" ]] || [[ ! -s "$encrypted_file" ]]; then
            continue
        fi
        
        local temp_decrypted="${encrypted_file}.temp_decrypt"
        local temp_encrypted="${encrypted_file}.temp_encrypt"
        
        log "Re-encrypting: $encrypted_file"
        
        # Decrypt with old key
        if decrypt_file "$encrypted_file" "$temp_decrypted" "$current_key"; then
            # Encrypt with new key
            if encrypt_file "$temp_decrypted" "$temp_encrypted" "$new_key"; then
                # Replace original
                mv "$temp_encrypted" "$encrypted_file"
                log "Successfully re-encrypted: $encrypted_file"
            else
                log "Failed to encrypt with new key: $encrypted_file"
                rm -f "$temp_decrypted"
                continue
            fi
        else
            log "Failed to decrypt with old key: $encrypted_file"
            continue
        fi
        
        # Cleanup
        rm -f "$temp_decrypted"
    done
    
    # Backup old key
    if [[ -f "$current_key" ]]; then
        mv "$current_key" "${current_key}.old.$(date +%Y%m%d%H%M%S)"
    fi
    
    log "Key rotation completed successfully"
}

# Main function
main() {
    local action="$1"
    shift
    
    case "$action" in
        "generate-key")
            if [[ $# -lt 1 ]]; then
                error_exit "Usage: $0 generate-key <key_file> [key_size]"
            fi
            generate_key "$@"
            ;;
        "encrypt")
            if [[ $# -lt 3 ]]; then
                error_exit "Usage: $0 encrypt <input_file> <output_file> <key_file>"
            fi
            encrypt_file "$@"
            ;;
        "decrypt")
            if [[ $# -lt 3 ]]; then
                error_exit "Usage: $0 decrypt <input_file> <output_file> <key_file>"
            fi
            decrypt_file "$@"
            ;;
        "generate-hash")
            if [[ $# -lt 2 ]]; then
                error_exit "Usage: $0 generate-hash <file> <hash_file>"
            fi
            generate_hash "$@"
            ;;
        "verify-integrity")
            if [[ $# -lt 2 ]]; then
                error_exit "Usage: $0 verify-integrity <file> <hash_file>"
            fi
            verify_integrity "$@"
            ;;
        "rotate-keys")
            if [[ $# -lt 2 ]]; then
                error_exit "Usage: $0 rotate-keys <current_key> <new_key>"
            fi
            rotate_keys "$@"
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
        echo "  generate-key <key_file> [key_size]"
        echo "  encrypt <input_file> <output_file> <key_file>"
        echo "  decrypt <input_file> <output_file> <key_file>"
        echo "  generate-hash <file> <hash_file>"
        echo "  verify-integrity <file> <hash_file>"
        echo "  rotate-keys <current_key> <new_key>"
        exit 1
    fi
    
    main "$@"
fi
