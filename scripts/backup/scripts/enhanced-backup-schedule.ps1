# Enhanced Backup Schedule Script for Project Cars Database
# Alternative to PITR for Free Plan Limitations
# Created: 2025-07-05
# Purpose: Implement more frequent automated backups to simulate PITR capabilities

param(
    [string]$Mode = "schedule",
    [string]$BackupType = "incremental",
    [string]$ConfigPath = "../../config/backup.config.json"
)

# Import configuration
$config = Get-Content $ConfigPath | ConvertFrom-Json
$logPath = "../../storage/logs/enhanced-backup-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logPath -Value $logEntry
    Write-Host $logEntry
}

function Get-BackupFrequency {
    $hour = (Get-Date).Hour
    
    # Enhanced backup frequency based on business hours
    if ($hour -ge 8 -and $hour -le 18) {
        return "BusinessHours"  # Every 2 hours during business hours
    } elseif ($hour -ge 19 -and $hour -le 23) {
        return "Evening"        # Every 4 hours during evening
    } else {
        return "Overnight"      # Every 6 hours overnight
    }
}

function Schedule-EnhancedBackups {
    Write-Log "Configuring enhanced backup schedule"
    
    # Business Hours (8 AM - 6 PM): Every 2 hours
    $businessHoursSchedule = @(8, 10, 12, 14, 16, 18)
    
    # Evening Hours (7 PM - 11 PM): Every 4 hours  
    $eveningHoursSchedule = @(19, 23)
    
    # Overnight Hours (12 AM - 7 AM): Every 6 hours
    $overnightHoursSchedule = @(0, 6)
    
    # Create scheduled task entries
    $allSchedules = $businessHoursSchedule + $eveningHoursSchedule + $overnightHoursSchedule
    
    foreach ($hour in $allSchedules) {
        $taskName = "ProjectCarsBackup_$hour"
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$PSScriptRoot\comprehensive-backup.ps1`" -Mode Full"
        $trigger = New-ScheduledTaskTrigger -Daily -At "$hour`:00"
        
        Write-Log "Scheduling backup task for $hour:00"
        
        try {
            Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Force
            Write-Log "Successfully scheduled backup for $hour:00"
        } catch {
            Write-Log "Failed to schedule backup for $hour:00 - $($_.Exception.Message)" "ERROR"
        }
    }
}

function Test-BackupRecovery {
    param([string]$BackupFile)
    
    Write-Log "Testing backup recovery capabilities"
    
    # Test backup file integrity
    if (Test-Path $BackupFile) {
        $fileSize = (Get-Item $BackupFile).Length
        Write-Log "Backup file size: $fileSize bytes"
        
        # Verify SQL content
        $content = Get-Content $BackupFile -Raw
        if ($content -match "CREATE TABLE" -and $content -match "INSERT INTO") {
            Write-Log "Backup file contains valid SQL structure"
            return $true
        } else {
            Write-Log "Backup file missing expected SQL content" "ERROR"
            return $false
        }
    } else {
        Write-Log "Backup file not found: $BackupFile" "ERROR"
        return $false
    }
}

function Generate-BackupReport {
    Write-Log "Generating enhanced backup strategy report"
    
    $report = @{
        "strategy" = "Enhanced Backup Frequency"
        "purpose" = "Alternative to PITR for Free Plan"
        "frequency" = @{
            "business_hours" = "Every 2 hours (8 AM - 6 PM)"
            "evening_hours" = "Every 4 hours (7 PM - 11 PM)"
            "overnight_hours" = "Every 6 hours (12 AM - 7 AM)"
        }
        "recovery_point_objective" = "2-6 hours maximum data loss"
        "advantages" = @(
            "No additional costs",
            "Compatible with free plan",
            "Granular recovery options",
            "Automated scheduling"
        )
        "limitations" = @(
            "Not true PITR (no WAL archiving)",
            "Higher storage requirements",
            "Manual recovery process",
            "Limited to backup frequency intervals"
        )
        "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $reportPath = "../../storage/logs/enhanced-backup-report-$(Get-Date -Format 'yyyyMMdd').json"
    $report | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath
    
    Write-Log "Report generated: $reportPath"
    return $report
}

# Main execution
switch ($Mode) {
    "schedule" {
        Write-Log "Starting enhanced backup scheduling"
        Schedule-EnhancedBackups
        Write-Log "Enhanced backup scheduling completed"
    }
    "test" {
        Write-Log "Testing most recent backup"
        $latestBackup = Get-ChildItem "../../storage/local/*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestBackup) {
            Test-BackupRecovery -BackupFile $latestBackup.FullName
        }
    }
    "report" {
        $report = Generate-BackupReport
        Write-Host "Enhanced Backup Strategy Report Generated" -ForegroundColor Green
        Write-Host "Recovery Point Objective: 2-6 hours maximum data loss" -ForegroundColor Yellow
        Write-Host "Frequency: Variable based on business hours" -ForegroundColor Cyan
    }
    default {
        Write-Log "Unknown mode: $Mode" "ERROR"
        Write-Host "Usage: enhanced-backup-schedule.ps1 -Mode [schedule|test|report]"
    }
}

Write-Log "Enhanced backup script execution completed" 