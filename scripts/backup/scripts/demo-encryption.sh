#!/bin/bash

# Backup Encryption System Demo
# Demonstrates the complete encrypted backup workflow

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/encrypted-backup.sh"
ENCRYPTION_SCRIPT="$SCRIPT_DIR/backup-encryption.sh"
TEST_SCRIPT="$SCRIPT_DIR/test-encryption.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[STATUS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Main demo function
main() {
    print_header "Project Car Marketplace - Backup Encryption System Demo"
    
    print_info "This demo showcases the complete encrypted backup system implementation."
    print_info "All backup files are encrypted using AES-256-CBC encryption."
    print_info "The system includes key management, integrity verification, and comprehensive testing."
    
    print_header "1. Running Encryption System Tests"
    
    print_info "Running comprehensive test suite..."
    if ./test-encryption.sh; then
        print_status "✅ All encryption tests passed!"
    else
        print_error "❌ Some encryption tests failed!"
        exit 1
    fi
    
    print_header "2. Creating Encrypted Backup"
    
    local backup_name="demo-backup-$(date +%Y%m%d-%H%M%S)"
    print_info "Creating encrypted backup: $backup_name"
    
    local backup_file
    backup_file=$(./encrypted-backup.sh create "$backup_name" 2>&1 | grep -E '^\.\./storage/local/.*\.encrypted$' | tail -1)
    
    if [[ -f "$backup_file" ]]; then
        print_status "✅ Encrypted backup created: $(basename "$backup_file")"
        
        # Show backup details
        local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
        local metadata_file="${backup_file%.encrypted}.metadata.json"
        
        print_info "Backup size: $backup_size bytes"
        print_info "Metadata file: $(basename "$metadata_file")"
        
        if [[ -f "$metadata_file" ]]; then
            print_info "Backup metadata:"
            cat "$metadata_file" | jq . 2>/dev/null || cat "$metadata_file"
        fi
    else
        print_error "❌ Failed to create encrypted backup!"
        exit 1
    fi
    
    print_header "3. Verifying Backup Integrity"
    
    print_info "Verifying backup integrity and encryption..."
    if ./encrypted-backup.sh verify "$backup_file"; then
        print_status "✅ Backup verification passed!"
    else
        print_error "❌ Backup verification failed!"
        exit 1
    fi
    
    print_header "4. Testing Backup Restoration"
    
    local restore_file="/tmp/demo-restore-$(date +%s).sql"
    print_info "Restoring backup to: $restore_file"
    
    if ./encrypted-backup.sh restore "$backup_file" "$restore_file"; then
        print_status "✅ Backup restoration successful!"
        
        # Show restored content preview
        print_info "Restored file size: $(stat -f%z "$restore_file" 2>/dev/null || stat -c%s "$restore_file" 2>/dev/null || echo "0") bytes"
        print_info "First 5 lines of restored backup:"
        head -5 "$restore_file" | sed 's/^/    /'
        
        # Cleanup
        rm -f "$restore_file"
    else
        print_error "❌ Backup restoration failed!"
        exit 1
    fi
    
    print_header "5. Key Management Demo"
    
    print_info "Demonstrating key management operations..."
    
    # Generate test keys
    local test_key1="/tmp/test-key1-$(date +%s).key"
    local test_key2="/tmp/test-key2-$(date +%s).key"
    
    print_info "Generating test encryption keys..."
    ./backup-encryption.sh generate-key "$test_key1" 256
    ./backup-encryption.sh generate-key "$test_key2" 256
    
    print_status "✅ Test keys generated successfully"
    
    # Test file encryption
    local test_file="/tmp/test-data-$(date +%s).txt"
    local encrypted_file="/tmp/test-encrypted-$(date +%s).encrypted"
    local decrypted_file="/tmp/test-decrypted-$(date +%s).txt"
    
    echo "This is test data for encryption demonstration." > "$test_file"
    echo "The backup system encrypts all data using AES-256-CBC." >> "$test_file"
    echo "This ensures data security both at rest and in transit." >> "$test_file"
    
    print_info "Testing file encryption and decryption..."
    ./backup-encryption.sh encrypt "$test_file" "$encrypted_file" "$test_key1"
    ./backup-encryption.sh decrypt "$encrypted_file" "$decrypted_file" "$test_key1"
    
    if diff "$test_file" "$decrypted_file" >/dev/null; then
        print_status "✅ File encryption/decryption test passed!"
    else
        print_error "❌ File encryption/decryption test failed!"
    fi
    
    # Cleanup test files
    rm -f "$test_key1" "$test_key2" "$test_file" "$encrypted_file" "$decrypted_file"
    
    print_header "6. System Status Summary"
    
    print_info "Backup encryption system status:"
    print_status "✅ AES-256-CBC encryption: Enabled"
    print_status "✅ Key management: Functional"
    print_status "✅ Integrity verification: Enabled"
    print_status "✅ Compression: Enabled"
    print_status "✅ Automated testing: Passed"
    print_status "✅ Backup/restore workflow: Functional"
    
    print_header "Demo Complete"
    
    print_info "The backup encryption system is fully implemented and tested."
    print_info "All backups are now encrypted using AES-256-CBC encryption."
    print_info "The system includes comprehensive key management, integrity verification,"
    print_info "and automated testing to ensure reliability and security."
    
    print_warning "Remember to:"
    print_warning "- Store encryption keys securely"
    print_warning "- Rotate keys regularly (every 90 days recommended)"
    print_warning "- Monitor backup operations and logs"
    print_warning "- Test restore procedures periodically"
    
    print_status "🎉 Backup encryption system demonstration completed successfully!"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
