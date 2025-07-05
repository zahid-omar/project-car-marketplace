# Database Backup and Recovery System

## Overview

This backup system provides automated, secure, and reliable backup and recovery for the Supabase PostgreSQL database. It implements multiple backup strategies including full backups, incremental backups, and point-in-time recovery (PITR) capabilities.

## Architecture

```
scripts/backup/
├── README.md                    # This file
├── config/
│   ├── backup.config.json      # Backup configuration
│   └── retention.config.json   # Retention policies
├── scripts/
│   ├── full-backup.sh         # Full database backup
│   ├── incremental-backup.sh  # Incremental backup
│   ├── wal-archive.sh         # WAL archiving for PITR
│   ├── verify-backup.sh       # Backup verification
│   ├── restore.sh             # Restore procedures
│   └── cleanup.sh             # Cleanup old backups
├── cron/
│   ├── backup-cron.sh         # Cron job setup
│   └── monitoring-cron.sh     # Backup monitoring
├── storage/
│   ├── local/                 # Local backup storage
│   ├── encryption/            # Encryption keys (not in git)
│   └── logs/                  # Backup logs
└── monitoring/
    ├── health-check.sh        # Backup health monitoring
    └── alerts.sh              # Alert system
```

## Features

### 1. Automated Backup Scheduling
- **Full Backups**: Daily at 2:00 AM UTC
- **Incremental Backups**: Every 6 hours
- **WAL Archiving**: Continuous for PITR
- **Backup Verification**: After each backup

### 2. Multiple Backup Types
- **Full Database Dump**: Complete schema and data
- **Incremental Backups**: Changes since last backup
- **Transaction Log Backups**: WAL files for PITR
- **Schema-Only Backups**: Structure without data

### 3. Security Features
- **End-to-End Encryption**: AES-256 encryption for all backups
- **Secure Key Management**: Separate encryption keys
- **Access Control**: Restricted file permissions
- **Audit Logging**: All backup operations logged

### 4. Recovery Options
- **Full Database Restore**: Complete database recovery
- **Point-in-Time Recovery**: Restore to specific timestamp
- **Selective Table Restore**: Individual table recovery
- **Schema Recovery**: Structure-only restoration

### 5. Monitoring & Alerts
- **Backup Status Monitoring**: Success/failure tracking
- **Storage Usage Alerts**: Disk space monitoring
- **Retention Policy Enforcement**: Automatic cleanup
- **Email Notifications**: Critical alerts

## Quick Start

### 1. Initial Setup
```bash
# Navigate to backup directory
cd scripts/backup

# Make scripts executable
chmod +x scripts/*.sh cron/*.sh monitoring/*.sh

# Create required directories
mkdir -p storage/{local,encryption,logs}

# Initialize configuration
cp config/backup.config.json.example config/backup.config.json
```

### 2. Configure Environment Variables
```bash
# Create .env file in backup directory
cat > .env << EOF
SUPABASE_PROJECT_ID=chekmxqlnosxphbmxiil
SUPABASE_DB_URL=postgresql://postgres:[password]@db.chekmxqlnosxphbmxiil.supabase.co:5432/postgres
BACKUP_ENCRYPTION_KEY=your-encryption-key-here
BACKUP_STORAGE_PATH=/path/to/backup/storage
NOTIFICATION_EMAIL=admin@yourproject.com
EOF
```

### 3. Set Up Cron Jobs
```bash
# Install cron jobs
./cron/backup-cron.sh install

# Verify cron installation
crontab -l | grep backup
```

### 4. Test Backup System
```bash
# Run test backup
./scripts/full-backup.sh --test

# Verify backup integrity
./scripts/verify-backup.sh --latest

# Test restoration (to test database)
./scripts/restore.sh --test --source=latest
```

## Configuration

### Backup Configuration (`config/backup.config.json`)
```json
{
  "schedules": {
    "full_backup": "0 2 * * *",
    "incremental_backup": "0 */6 * * *",
    "wal_archive": "continuous",
    "verification": "after_backup"
  },
  "retention": {
    "full_backups": 30,
    "incremental_backups": 7,
    "wal_files": 14
  },
  "storage": {
    "local_path": "./storage/local",
    "offsite_enabled": true,
    "encryption_enabled": true
  },
  "monitoring": {
    "health_check_interval": 3600,
    "alert_on_failure": true,
    "notification_channels": ["email", "webhook"]
  }
}
```

### Retention Policy (`config/retention.config.json`)
```json
{
  "policies": {
    "daily_backups": {
      "keep_daily": 7,
      "keep_weekly": 4,
      "keep_monthly": 12,
      "keep_yearly": 5
    },
    "incremental_backups": {
      "keep_hours": 48,
      "keep_daily": 7
    },
    "wal_files": {
      "keep_days": 14,
      "archive_after_days": 30
    }
  }
}
```

## Usage

### Running Backups Manually
```bash
# Full backup
./scripts/full-backup.sh

# Incremental backup
./scripts/incremental-backup.sh

# Verify specific backup
./scripts/verify-backup.sh --file=backup_20240101_020000.sql.gz

# Check backup health
./monitoring/health-check.sh
```

### Restoration
```bash
# List available backups
./scripts/restore.sh --list

# Restore latest full backup
./scripts/restore.sh --type=full --source=latest

# Point-in-time recovery
./scripts/restore.sh --type=pitr --timestamp="2024-01-01 12:00:00"

# Restore specific table
./scripts/restore.sh --type=table --table=listings --source=latest
```

## Monitoring

### Health Checks
The system includes comprehensive health monitoring:
- Backup completion status
- Backup file integrity
- Storage capacity monitoring
- WAL archiving status
- Encryption key availability

### Alerts
Automated alerts for:
- Backup failures
- Storage space warnings
- Encryption key issues
- WAL archiving problems
- Verification failures

## Maintenance

### Regular Tasks
- Review backup logs weekly
- Monitor storage usage
- Test restoration procedures monthly
- Update retention policies as needed
- Rotate encryption keys quarterly

### Troubleshooting
- Check logs in `storage/logs/`
- Verify environment variables
- Test database connectivity
- Validate file permissions
- Check disk space availability

## Security Considerations

1. **Access Control**: Restrict backup directory permissions
2. **Encryption Keys**: Store securely, separate from backups
3. **Network Security**: Use secure connections for off-site transfers
4. **Audit Logging**: Monitor all backup operations
5. **Regular Testing**: Validate backup integrity and restoration

## Support

For issues or questions:
1. Check the logs in `storage/logs/`
2. Review the troubleshooting section
3. Verify configuration settings
4. Test individual components

## Version History

- v1.0.0: Initial implementation with full backup support
- v1.1.0: Added incremental backup and PITR
- v1.2.0: Enhanced monitoring and alerting
- v1.3.0: Added encryption and off-site storage 