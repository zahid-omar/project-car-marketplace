# Disaster Recovery Procedures - Encrypted Backup System

## Overview

This document outlines the disaster recovery procedures for the Project Car Marketplace's encrypted backup system. All backups are encrypted using AES-256-CBC encryption and require proper key management for successful recovery.

## Emergency Contacts

- **Primary DBA**: [Contact Information]
- **Backup Administrator**: [Contact Information]
- **System Administrator**: [Contact Information]
- **Security Team**: [Contact Information]

## Backup System Architecture

### Encryption Details
- **Algorithm**: AES-256-CBC
- **Key Management**: Secure key storage in `storage/encryption/`
- **Integrity Verification**: SHA-256 hashes for each backup
- **Compression**: Gzip compression before encryption

### File Structure
```
storage/
├── local/
│   ├── backup-YYYYMMDD-HHMMSS.encrypted    # Encrypted backup files
│   ├── backup-YYYYMMDD-HHMMSS.hash         # Integrity hash files
│   └── backup-YYYYMMDD-HHMMSS.metadata.json # Backup metadata
├── encryption/
│   ├── backup-key.key                      # Current encryption key
│   └── backup-key.key.old.*                # Rotated keys
└── logs/
    ├── backup-YYYYMMDD.log                 # Backup operation logs
    └── encryption-monitor-YYYYMMDD.log     # Monitoring logs
```

## Recovery Procedures

### 1. Immediate Assessment

#### Step 1: Assess the Situation
- Determine the scope of the disaster
- Identify what data needs to be recovered
- Confirm backup system integrity

#### Step 2: Verify Backup Availability
```bash
# Check latest backups
ls -la storage/local/*.encrypted | head -10

# Verify backup integrity
./scripts/encryption-monitor.sh integrity
```

#### Step 3: Confirm Key Access
```bash
# Verify encryption key exists and is accessible
ls -la storage/encryption/backup-key.key
```

### 2. Full System Recovery

#### Step 1: Prepare Recovery Environment
```bash
# Ensure recovery environment has necessary tools
which openssl jq shasum

# Create recovery workspace
mkdir -p /tmp/recovery
cd /tmp/recovery
```

#### Step 2: Select Recovery Point
```bash
# List available backups with metadata
for backup in ../storage/local/*.encrypted; do
    metadata="${backup%.encrypted}.metadata.json"
    if [[ -f "$metadata" ]]; then
        echo "Backup: $(basename "$backup")"
        jq -r '.created_at, .size_bytes' "$metadata"
        echo "---"
    fi
done
```

#### Step 3: Restore from Encrypted Backup
```bash
# Restore specific backup
BACKUP_FILE="storage/local/backup-YYYYMMDD-HHMMSS.encrypted"
RESTORE_FILE="recovery-$(date +%Y%m%d-%H%M%S).sql"

# Verify and restore
./scripts/encrypted-backup.sh verify "$BACKUP_FILE"
./scripts/encrypted-backup.sh restore "$BACKUP_FILE" "$RESTORE_FILE"
```

#### Step 4: Validate Restored Data
```bash
# Check SQL file integrity
head -20 "$RESTORE_FILE"
tail -20 "$RESTORE_FILE"

# Verify expected tables and data
grep -c "CREATE TABLE" "$RESTORE_FILE"
grep -c "INSERT INTO" "$RESTORE_FILE"
```

### 3. Partial Recovery

#### Step 1: Extract Specific Tables
```bash
# For specific table recovery, extract relevant sections
grep -A 100 "CREATE TABLE tablename" "$RESTORE_FILE" > table_recovery.sql
grep "INSERT INTO tablename" "$RESTORE_FILE" >> table_recovery.sql
```

#### Step 2: Point-in-Time Recovery
```bash
# If multiple backups are available, choose appropriate time point
# Apply the restore file to the database
psql -h hostname -U username -d database -f "$RESTORE_FILE"
```

### 4. Emergency Key Recovery

#### If Primary Key is Lost
```bash
# Check for backup keys
ls -la storage/encryption/backup-key.key.old.*

# Try each backup key until successful
for key in storage/encryption/backup-key.key.old.*; do
    echo "Trying key: $key"
    if ./scripts/backup-encryption.sh decrypt "$BACKUP_FILE" "test_decrypt" "$key"; then
        echo "Success with key: $key"
        break
    fi
done
```

#### If All Keys are Lost
⚠️ **CRITICAL**: If all encryption keys are lost, encrypted backups cannot be recovered.

**Prevention Measures**:
- Store encryption keys in a secure off-site location
- Implement key escrow with trusted third party
- Maintain key backups in secure hardware modules
- Document key recovery procedures for authorized personnel

### 5. System Rebuild

#### Step 1: Restore Database Schema
```bash
# Extract and apply schema only
grep -E "^(CREATE|ALTER|DROP)" "$RESTORE_FILE" > schema_recovery.sql
psql -h hostname -U username -d database -f schema_recovery.sql
```

#### Step 2: Restore Data
```bash
# Extract and apply data only
grep -E "^(INSERT|COPY)" "$RESTORE_FILE" > data_recovery.sql
psql -h hostname -U username -d database -f data_recovery.sql
```

#### Step 3: Verify System Integrity
```bash
# Run application-specific health checks
# Verify user authentication
# Check data consistency
# Validate business logic
```

## Security Considerations

### During Recovery
- **Access Control**: Limit recovery access to authorized personnel only
- **Environment Security**: Ensure recovery environment is secure
- **Key Handling**: Handle encryption keys with extreme care
- **Logging**: Log all recovery activities for audit trail

### After Recovery
- **Key Rotation**: Rotate encryption keys after recovery
- **Access Review**: Review and update access permissions
- **Security Audit**: Conduct security audit of recovered system
- **Monitoring**: Ensure monitoring systems are operational

## Testing Procedures

### Regular Recovery Testing
```bash
# Monthly recovery test
./scripts/demo-encryption.sh

# Quarterly full recovery test
BACKUP_FILE="storage/local/$(ls -t storage/local/*.encrypted | head -1)"
./scripts/encrypted-backup.sh verify "$BACKUP_FILE"
./scripts/encrypted-backup.sh restore "$BACKUP_FILE" "/tmp/recovery_test.sql"
```

### Annual Disaster Recovery Drill
1. Simulate complete system failure
2. Execute full recovery procedures
3. Verify data integrity and application functionality
4. Document lessons learned and update procedures

## Monitoring and Alerting

### Automated Monitoring
```bash
# Check encryption monitoring status
./scripts/encryption-monitor.sh monitor

# Review monitoring reports
cat storage/logs/encryption-monitor-report-$(date +%Y%m%d).json
```

### Alert Thresholds
- **Key Age**: Alert when >80 days old
- **Backup Age**: Alert when >25 hours old
- **Integrity Failures**: Alert immediately
- **Storage Usage**: Alert when >80% full

## Documentation Updates

### After Each Recovery
- Update recovery procedures based on lessons learned
- Document any new issues encountered
- Update emergency contact information
- Review and update security procedures

### Regular Maintenance
- Monthly review of procedures
- Quarterly testing of recovery processes
- Annual security audit
- Update encryption algorithms as needed

## Compliance and Auditing

### Record Keeping
- All recovery activities must be logged
- Document decision rationale
- Maintain audit trail of key access
- Record recovery success/failure metrics

### Compliance Requirements
- Follow data protection regulations
- Maintain encryption standards
- Document security controls
- Regular compliance reviews

## Contact Information

For questions about these procedures or assistance with recovery operations:

- **Emergency Hotline**: [Phone Number]
- **Email**: disaster-recovery@projectcars.com
- **Documentation**: [Internal Wiki Link]
- **Escalation**: [Management Contact]

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: $(date -d "+3 months")  
**Owner**: Database Administration Team
