# Encrypted Backup System - Setup and Usage Guide

## Quick Start

### Prerequisites
- macOS or Linux system
- OpenSSL installed
- jq (JSON processor) installed
- Sufficient disk space for backups
- Supabase project access

### Installation

1. **Clone or copy the backup system to your server**:
   ```bash
   # Navigate to the backup directory
   cd /path/to/project-car-marketplace/scripts/backup
   ```

2. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   chmod +x cron/*.sh
   ```

3. **Configure backup settings**:
   ```bash
   # Edit the main configuration file
   nano config/backup.config.json
   
   # Update the following settings:
   # - Supabase project details
   # - Encryption settings
   # - Alert email/webhook
   # - Schedule preferences
   ```

4. **Initialize encryption system**:
   ```bash
   # Test the encryption system
   ./scripts/test-encryption.sh
   
   # This will create necessary directories and test all functionality
   ```

## Configuration

### Main Configuration File: `config/backup.config.json`

Key sections to configure:

#### Project Settings
```json
{
  "project": {
    "name": "ProjectCars Database Backup",
    "supabase_project_id": "your-project-id-here"
  }
}
```

#### Encryption Settings
```json
{
  "encryption": {
    "enabled": true,
    "algorithm": "AES-256-CBC",
    "key_file": "storage/encryption/backup-key.key",
    "rotate_key_days": 90
  }
}
```

#### Monitoring and Alerts
```json
{
  "monitoring": {
    "encryption_monitoring": {
      "enabled": true,
      "key_expiry_days": 7,
      "backup_max_age_hours": 25,
      "integrity_check_interval_hours": 12
    },
    "alerts": {
      "email": {
        "enabled": true,
        "to_addresses": ["admin@yourcompany.com"]
      },
      "webhook": {
        "enabled": true,
        "url": "https://your-webhook-url.com/alerts"
      }
    }
  }
}
```

## Usage

### Manual Backup Operations

#### Create an Encrypted Backup
```bash
# Create backup with automatic name
./scripts/encrypted-backup.sh create

# Create backup with custom name
./scripts/encrypted-backup.sh create my-backup-$(date +%Y%m%d)
```

#### Verify Backup Integrity
```bash
# Verify a specific backup
./scripts/encrypted-backup.sh verify storage/local/backup-20250715-120000.encrypted

# Verify all recent backups
./scripts/encryption-monitor.sh integrity
```

#### Restore from Backup
```bash
# Restore to a file
./scripts/encrypted-backup.sh restore storage/local/backup-20250715-120000.encrypted restored-data.sql

# Restore directly to database (if configured)
./scripts/encrypted-backup.sh restore storage/local/backup-20250715-120000.encrypted | psql -h host -U user -d database
```

### Key Management

#### Generate New Encryption Key
```bash
# Generate a new key
./scripts/backup-encryption.sh generate-key storage/encryption/new-key.key

# Generate with specific key size
./scripts/backup-encryption.sh generate-key storage/encryption/new-key.key 256
```

#### Rotate Encryption Keys
```bash
# Rotate keys (re-encrypts all existing backups)
./scripts/backup-encryption.sh rotate-keys storage/encryption/backup-key.key storage/encryption/backup-key-new.key
```

#### Manual File Encryption/Decryption
```bash
# Encrypt a file
./scripts/backup-encryption.sh encrypt input.txt output.encrypted storage/encryption/backup-key.key

# Decrypt a file
./scripts/backup-encryption.sh decrypt input.encrypted output.txt storage/encryption/backup-key.key
```

### Monitoring and Maintenance

#### Check System Health
```bash
# Full monitoring check
./scripts/encryption-monitor.sh monitor

# Specific checks
./scripts/encryption-monitor.sh key-age
./scripts/encryption-monitor.sh integrity
./scripts/encryption-monitor.sh freshness
./scripts/encryption-monitor.sh storage
```

#### View Monitoring Reports
```bash
# Latest monitoring report
cat storage/logs/encryption-monitor-report-$(date +%Y%m%d).json

# Backup operation logs
tail -f storage/logs/backup-$(date +%Y%m%d).log

# Encryption monitoring logs
tail -f storage/logs/encryption-monitor-$(date +%Y%m%d).log
```

### Automated Scheduling

#### Install Cron Jobs
```bash
# Install all scheduled backup jobs
./cron/backup-cron.sh install

# Check installed jobs
./cron/backup-cron.sh status

# View scheduled jobs
./cron/backup-cron.sh list
```

#### Disable/Enable Scheduling
```bash
# Disable all backup jobs
./cron/backup-cron.sh disable

# Enable specific job
./cron/backup-cron.sh enable full-backup

# Uninstall all jobs
./cron/backup-cron.sh uninstall
```

## Testing

### Comprehensive System Test
```bash
# Run all encryption tests
./scripts/test-encryption.sh

# Run complete system demonstration
./scripts/demo-encryption.sh
```

### Individual Test Categories
```bash
# Test key generation
./scripts/test-encryption.sh key-generation

# Test file encryption
./scripts/test-encryption.sh file-encryption

# Test backup creation
./scripts/test-encryption.sh backup-creation

# Test key rotation
./scripts/test-encryption.sh key-rotation

# Test performance
./scripts/test-encryption.sh performance
```

## Troubleshooting

### Common Issues

#### 1. "Key file not found" Error
```bash
# Check if key file exists
ls -la storage/encryption/backup-key.key

# Generate new key if missing
./scripts/backup-encryption.sh generate-key storage/encryption/backup-key.key
```

#### 2. "Bad decrypt" Error
```bash
# Check if correct key is being used
./scripts/encryption-monitor.sh key-age

# Try with backup keys
ls -la storage/encryption/backup-key.key.old.*
```

#### 3. Backup Integrity Failures
```bash
# Check backup integrity
./scripts/encryption-monitor.sh integrity

# Verify specific backup
./scripts/encrypted-backup.sh verify storage/local/backup-file.encrypted
```

#### 4. Storage Space Issues
```bash
# Check storage usage
df -h storage/local/

# Clean up old backups (manual)
find storage/local/ -name "*.encrypted" -mtime +30 -exec rm -f {} \;
```

### Log Analysis

#### Backup Operation Logs
```bash
# Check for errors in backup logs
grep -i error storage/logs/backup-*.log

# Check for warnings
grep -i warning storage/logs/backup-*.log
```

#### Encryption Monitor Logs
```bash
# Check monitoring alerts
grep -i alert storage/logs/encryption-monitor-*.log

# Check for critical issues
grep -i critical storage/logs/encryption-monitor-*.log
```

## Security Best Practices

### Key Management
- Store encryption keys in a secure location separate from backups
- Implement key rotation every 90 days
- Maintain backup copies of encryption keys
- Use hardware security modules (HSMs) for production environments

### Access Control
- Limit access to backup directories to authorized personnel only
- Use file permissions (600) for key files
- Implement audit logging for all key access
- Regular review of access permissions

### Monitoring
- Set up alerts for key expiry
- Monitor backup integrity regularly
- Alert on backup failures or missing backups
- Regular security audits

### Network Security
- Use encrypted connections for all remote operations
- Implement VPN for backup network traffic
- Regular security updates for backup system
- Firewall rules to restrict backup system access

## Maintenance Schedule

### Daily
- Automated backup creation
- Basic integrity checks
- Storage space monitoring

### Weekly
- Full system health check
- Review monitoring reports
- Check for failed backups

### Monthly
- Test backup restoration
- Review security logs
- Update documentation

### Quarterly
- Key rotation (if older than 90 days)
- Disaster recovery drill
- System security audit
- Update procedures

### Annually
- Full system review
- Security compliance audit
- Update encryption algorithms
- Staff training updates

## Support and Documentation

### Additional Resources
- [Disaster Recovery Procedures](disaster-recovery-procedures.md)
- [Off-site Backup Procedures](offsite-backup-procedures.md)
- [System Architecture Documentation](../README.md)

### Getting Help
- Check logs first: `storage/logs/`
- Run diagnostics: `./scripts/encryption-monitor.sh monitor`
- Review this guide for common solutions
- Contact system administrator if issues persist

### Reporting Issues
When reporting issues, include:
- Exact error messages
- Recent log entries
- Steps to reproduce
- System information
- Backup configuration details

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: $(date -d "+3 months")  
**Owner**: Database Administration Team
