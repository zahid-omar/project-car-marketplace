#!/bin/bash

# Test Encryption Script - Comprehensive test suite for backup encryption system
# Tests key generation, encryption/decryption, backup creation, key rotation, and performance

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENCRYPTION_SCRIPT="$SCRIPT_DIR/backup-encryption.sh"
BACKUP_SCRIPT="$SCRIPT_DIR/encrypted-backup.sh"
TEST_DIR="../storage/test"
LOG_DIR="../storage/logs"
LOG_FILE="$LOG_DIR/encryption-test-$(date +%Y%m%d).log"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Ensure directories exist
mkdir -p "$TEST_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test result functions
test_pass() {
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
    log "✅ PASS: $1"
}

test_fail() {
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
    log "❌ FAIL: $1"
}

test_info() {
    log "ℹ️  INFO: $1"
}

# Cleanup function
cleanup() {
    log "Cleaning up test files..."
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
}

# Test key generation
test_key_generation() {
    log "Testing key generation..."
    
    local key_file="$TEST_DIR/test-key.key"
    
    # Test key generation
    if bash "$ENCRYPTION_SCRIPT" generate-key "$key_file" 256; then
        test_pass "Key generation completed"
    else
        test_fail "Key generation failed"
        return 1
    fi
    
    # Test key file exists
    if [[ -f "$key_file" ]]; then
        test_pass "Key file created"
    else
        test_fail "Key file not created"
        return 1
    fi
    
    # Test key file permissions
    local perms=$(stat -f%A "$key_file" 2>/dev/null || stat -c%a "$key_file" 2>/dev/null || echo "644")
    if [[ "$perms" == "600" ]]; then
        test_pass "Key file permissions are secure (600)"
    else
        test_fail "Key file permissions are not secure (expected 600, got $perms)"
    fi
    
    # Test key file content
    local key_size=$(wc -c < "$key_file")
    if [[ $key_size -gt 40 ]]; then  # Base64 encoded 256-bit key should be ~44 characters
        test_pass "Key file has appropriate size ($key_size bytes)"
    else
        test_fail "Key file size is too small ($key_size bytes)"
    fi
}

# Test file encryption and decryption
test_file_encryption() {
    log "Testing file encryption and decryption..."
    
    local test_file="$TEST_DIR/test-data.txt"
    local encrypted_file="$TEST_DIR/test-data.encrypted"
    local decrypted_file="$TEST_DIR/test-data.decrypted"
    local key_file="$TEST_DIR/test-key.key"
    
    # Create test data
    echo "This is test data for encryption testing." > "$test_file"
    echo "Line 2: Special characters !@#$%^&*()" >> "$test_file"
    echo "Line 3: Numbers 1234567890" >> "$test_file"
    
    # Generate key
    if ! bash "$ENCRYPTION_SCRIPT" generate-key "$key_file" 256; then
        test_fail "Failed to generate key for encryption test"
        return 1
    fi
    
    # Test encryption
    if bash "$ENCRYPTION_SCRIPT" encrypt "$test_file" "$encrypted_file" "$key_file"; then
        test_pass "File encryption completed"
    else
        test_fail "File encryption failed"
        return 1
    fi
    
    # Test encrypted file exists
    if [[ -f "$encrypted_file" ]]; then
        test_pass "Encrypted file created"
    else
        test_fail "Encrypted file not created"
        return 1
    fi
    
    # Test decryption
    if bash "$ENCRYPTION_SCRIPT" decrypt "$encrypted_file" "$decrypted_file" "$key_file"; then
        test_pass "File decryption completed"
    else
        test_fail "File decryption failed"
        return 1
    fi
    
    # Test decrypted content matches original
    if diff "$test_file" "$decrypted_file" >/dev/null; then
        test_pass "Decrypted content matches original"
    else
        test_fail "Decrypted content does not match original"
        return 1
    fi
    
    # Test that encrypted file is different from original
    if ! diff "$test_file" "$encrypted_file" >/dev/null 2>&1; then
        test_pass "Encrypted file is different from original"
    else
        test_fail "Encrypted file appears to be the same as original"
    fi
}

# Test hash generation and verification
test_hash_verification() {
    log "Testing hash generation and verification..."
    
    local test_file="$TEST_DIR/test-hash.txt"
    local hash_file="$TEST_DIR/test-hash.hash"
    
    # Create test data
    echo "Test data for hash verification" > "$test_file"
    
    # Generate hash
    if bash "$ENCRYPTION_SCRIPT" generate-hash "$test_file" "$hash_file"; then
        test_pass "Hash generation completed"
    else
        test_fail "Hash generation failed"
        return 1
    fi
    
    # Test hash file exists
    if [[ -f "$hash_file" ]]; then
        test_pass "Hash file created"
    else
        test_fail "Hash file not created"
        return 1
    fi
    
    # Test hash verification
    if bash "$ENCRYPTION_SCRIPT" verify-integrity "$test_file" "$hash_file"; then
        test_pass "Hash verification passed"
    else
        test_fail "Hash verification failed"
        return 1
    fi
    
    # Test hash verification with modified file
    echo "Modified content" >> "$test_file"
    if ! bash "$ENCRYPTION_SCRIPT" verify-integrity "$test_file" "$hash_file"; then
        test_pass "Hash verification correctly failed for modified file"
    else
        test_fail "Hash verification should have failed for modified file"
    fi
}

# Test backup creation
test_backup_creation() {
    log "Testing encrypted backup creation..."
    
    local backup_name="test-backup-$(date +%s)"
    
    # Create encrypted backup
    local backup_output
    backup_output=$(bash "$BACKUP_SCRIPT" create "$backup_name" 2>&1)
    local backup_file=$(echo "$backup_output" | grep -E '^\.\./storage/local/.*\.encrypted$' | tail -1)
    
    if [[ -n "$backup_file" ]] && [[ -f "$backup_file" ]]; then
        test_pass "Encrypted backup creation completed"
    else
        test_fail "Encrypted backup creation failed"
        return 1
    fi
    
    # Test backup file exists
    if [[ -f "$backup_file" ]]; then
        test_pass "Backup file created: $(basename "$backup_file")"
    else
        test_fail "Backup file not created"
        return 1
    fi
    
    # Test associated files exist
    local hash_file="${backup_file%.encrypted}.hash"
    local metadata_file="${backup_file%.encrypted}.metadata.json"
    
    if [[ -f "$hash_file" ]]; then
        test_pass "Hash file created: $(basename "$hash_file")"
    else
        test_fail "Hash file not created"
    fi
    
    if [[ -f "$metadata_file" ]]; then
        test_pass "Metadata file created: $(basename "$metadata_file")"
    else
        test_fail "Metadata file not created"
    fi
    
    # Test backup verification
    if bash "$BACKUP_SCRIPT" verify "$backup_file"; then
        test_pass "Backup verification passed"
    else
        test_fail "Backup verification failed"
    fi
    
    # Test backup restoration
    local restore_file="$TEST_DIR/restored-backup.sql"
    if bash "$BACKUP_SCRIPT" restore "$backup_file" "$restore_file"; then
        test_pass "Backup restoration completed"
    else
        test_fail "Backup restoration failed"
    fi
    
    # Test restored file exists and has content
    if [[ -f "$restore_file" ]] && [[ -s "$restore_file" ]]; then
        test_pass "Restored file has content"
    else
        test_fail "Restored file is empty or doesn't exist"
    fi
}

# Test key rotation
test_key_rotation() {
    log "Testing key rotation..."
    
    local old_key="$TEST_DIR/old-key.key"
    local new_key="$TEST_DIR/new-key.key"
    local test_file="$TEST_DIR/rotation-test.txt"
    local encrypted_file="$TEST_DIR/rotation-test.encrypted"
    
    # Create test data and encrypt with old key
    echo "Data for key rotation test" > "$test_file"
    bash "$ENCRYPTION_SCRIPT" generate-key "$old_key" 256
    bash "$ENCRYPTION_SCRIPT" encrypt "$test_file" "$encrypted_file" "$old_key"
    
    # Manually re-encrypt the file with new key (simulating rotation)
    bash "$ENCRYPTION_SCRIPT" generate-key "$new_key" 256
    
    # Decrypt with old key and re-encrypt with new key
    local temp_decrypted="$TEST_DIR/temp_decrypt.txt"
    if bash "$ENCRYPTION_SCRIPT" decrypt "$encrypted_file" "$temp_decrypted" "$old_key"; then
        if bash "$ENCRYPTION_SCRIPT" encrypt "$temp_decrypted" "$encrypted_file" "$new_key"; then
            test_pass "Key rotation completed"
        else
            test_fail "Key rotation failed during re-encryption"
            return 1
        fi
    else
        test_fail "Key rotation failed during decryption"
        return 1
    fi
    
    # Clean up temp file
    rm -f "$temp_decrypted"
    
    # Test new key exists
    if [[ -f "$new_key" ]]; then
        test_pass "New key file created"
    else
        test_fail "New key file not created"
        return 1
    fi
    
    # Backup old key manually
    local backup_key="${old_key}.old.$(date +%Y%m%d%H%M%S)"
    mv "$old_key" "$backup_key"
    
    if [[ -f "$backup_key" ]]; then
        test_pass "Old key backed up: $(basename "$backup_key")"
    else
        test_fail "Old key not backed up"
    fi
    
    # Test encrypted file can be decrypted with new key
    local decrypted_file="$TEST_DIR/rotation-decrypted.txt"
    if bash "$ENCRYPTION_SCRIPT" decrypt "$encrypted_file" "$decrypted_file" "$new_key"; then
        test_pass "File decryption with new key succeeded"
    else
        test_fail "File decryption with new key failed"
    fi
    
    # Test decrypted content matches original
    if diff "$test_file" "$decrypted_file" >/dev/null; then
        test_pass "Decrypted content matches original after key rotation"
    else
        test_fail "Decrypted content does not match original after key rotation"
    fi
}

# Test performance
test_performance() {
    log "Testing encryption performance..."
    
    local large_file="$TEST_DIR/large-test.txt"
    local encrypted_file="$TEST_DIR/large-test.encrypted"
    local decrypted_file="$TEST_DIR/large-test.decrypted"
    local key_file="$TEST_DIR/perf-key.key"
    
    # Create large test file (1MB)
    test_info "Creating 1MB test file..."
    dd if=/dev/zero of="$large_file" bs=1024 count=1024 2>/dev/null
    
    # Generate key
    bash "$ENCRYPTION_SCRIPT" generate-key "$key_file" 256
    
    # Test encryption performance
    test_info "Testing encryption performance..."
    local start_time=$(date +%s)
    if bash "$ENCRYPTION_SCRIPT" encrypt "$large_file" "$encrypted_file" "$key_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        test_pass "Large file encryption completed in ${duration}s"
    else
        test_fail "Large file encryption failed"
        return 1
    fi
    
    # Test decryption performance
    test_info "Testing decryption performance..."
    start_time=$(date +%s)
    if bash "$ENCRYPTION_SCRIPT" decrypt "$encrypted_file" "$decrypted_file" "$key_file"; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        test_pass "Large file decryption completed in ${duration}s"
    else
        test_fail "Large file decryption failed"
        return 1
    fi
    
    # Verify content integrity
    if diff "$large_file" "$decrypted_file" >/dev/null; then
        test_pass "Large file integrity verified after encryption/decryption"
    else
        test_fail "Large file integrity check failed"
    fi
}

# Test error handling
test_error_handling() {
    log "Testing error handling..."
    
    # Test encryption with non-existent input file
    if ! bash "$ENCRYPTION_SCRIPT" encrypt "non-existent-file" "output" "key" 2>/dev/null; then
        test_pass "Correctly handled non-existent input file"
    else
        test_fail "Should have failed with non-existent input file"
    fi
    
    # Test decryption with non-existent key file
    local test_file="$TEST_DIR/error-test.txt"
    local encrypted_file="$TEST_DIR/error-test.encrypted"
    echo "test" > "$test_file"
    
    if ! bash "$ENCRYPTION_SCRIPT" decrypt "$test_file" "$encrypted_file" "non-existent-key" 2>/dev/null; then
        test_pass "Correctly handled non-existent key file"
    else
        test_fail "Should have failed with non-existent key file"
    fi
}

# Main test runner
run_all_tests() {
    log "Starting comprehensive encryption system test suite..."
    log "=================================================="
    
    # Cleanup before starting
    cleanup
    
    # Run all tests
    test_key_generation
    test_file_encryption
    test_hash_verification
    test_backup_creation
    test_key_rotation
    test_performance
    test_error_handling
    
    # Final cleanup
    cleanup
    
    # Print summary
    log "=================================================="
    log "Test Summary:"
    log "Total Tests: $TOTAL_TESTS"
    log "Passed: $TESTS_PASSED"
    log "Failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        log "🎉 All tests passed! Encryption system is working correctly."
        return 0
    else
        log "⚠️  Some tests failed. Please review the log for details."
        return 1
    fi
}

# Main function
main() {
    local action="${1:-run-all}"
    
    case "$action" in
        "run-all")
            run_all_tests
            ;;
        "key-generation")
            test_key_generation
            ;;
        "file-encryption")
            test_file_encryption
            ;;
        "hash-verification")
            test_hash_verification
            ;;
        "backup-creation")
            test_backup_creation
            ;;
        "key-rotation")
            test_key_rotation
            ;;
        "performance")
            test_performance
            ;;
        "error-handling")
            test_error_handling
            ;;
        *)
            echo "Usage: $0 [test-type]"
            echo "Test types:"
            echo "  run-all (default)    - Run all tests"
            echo "  key-generation      - Test key generation"
            echo "  file-encryption     - Test file encryption/decryption"
            echo "  hash-verification   - Test hash generation/verification"
            echo "  backup-creation     - Test backup creation/restoration"
            echo "  key-rotation        - Test key rotation"
            echo "  performance         - Test performance with large files"
            echo "  error-handling      - Test error conditions"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
