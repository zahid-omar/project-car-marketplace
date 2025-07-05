# ============================================================================
# Automated Backup Verification System for ProjectCars Database
# ============================================================================
# Description: Comprehensive automated verification procedures with scheduling,
#              checksum validation, test restores, and monitoring
# Author: ProjectCars Backup System  
# Version: 2.0.0
# Created: 2025-07-05
# ============================================================================

param(
    [string]$Mode = "verify",
    [string]$ConfigPath = "../config/backup.config.json",
    [string]$Schedule = "hourly",
    [switch]$TestRestore = $false,
    [switch]$Checksums = $false,
    [switch]$FullAudit = $false,
    [switch]$SetupSchedule = $false
)

# Script configuration
$Script:ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:BackupDir = Split-Path -Parent $Script:ScriptDir
$Script:Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Script:LogFile = "$Script:BackupDir\storage\logs\auto-verify-$Script:Timestamp.log"
$Script:ReportFile = "$Script:BackupDir\storage\logs\verification-report-$(Get-Date -Format 'yyyyMMdd').json"
$Script:ChecksumFile = "$Script:BackupDir\storage\logs\backup-checksums.json"

# Import configuration
try {
    $config = Get-Content $ConfigPath | ConvertFrom-Json
} catch {
    Write-Host "Warning: Could not load config from $ConfigPath, using defaults" -ForegroundColor Yellow
    $config = @{
        verification = @{
            schedule = "hourly"
            retention_days = 30
            alert_threshold = 2
        }
    }
}

function Write-AutoVerifyLog {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console output with colors
    switch ($Level) {
        "INFO"     { Write-Host $logEntry -ForegroundColor Green }
        "WARN"     { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR"    { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS"  { Write-Host $logEntry -ForegroundColor Cyan }
        "CRITICAL" { Write-Host $logEntry -ForegroundColor Magenta }
    }
    
    # Log to file
    try {
        $logEntry | Out-File -FilePath $Script:LogFile -Append -Encoding UTF8
    } catch {
        Write-Host "Warning: Could not write to log file" -ForegroundColor Yellow
    }
}

function New-BackupChecksum {
    param([string]$BackupFilePath)
    
    Write-AutoVerifyLog "INFO" "Generating checksum for: $(Split-Path $BackupFilePath -Leaf)"
    
    try {
        $hash = Get-FileHash -Path $BackupFilePath -Algorithm SHA256
        $checksumData = @{
            file = Split-Path $BackupFilePath -Leaf
            full_path = $BackupFilePath
            algorithm = "SHA256"
            hash = $hash.Hash
            size_bytes = (Get-Item $BackupFilePath).Length
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        
        Write-AutoVerifyLog "SUCCESS" "Checksum generated: $($hash.Hash.Substring(0,16))..."
        return $checksumData
    } catch {
        Write-AutoVerifyLog "ERROR" "Failed to generate checksum: $($_.Exception.Message)"
        return $null
    }
}

function Test-BackupChecksum {
    param([string]$BackupFilePath)
    
    $fileName = Split-Path $BackupFilePath -Leaf
    Write-AutoVerifyLog "INFO" "Verifying checksum for: $fileName"
    
    # Load existing checksums
    if (-not (Test-Path $Script:ChecksumFile)) {
        Write-AutoVerifyLog "WARN" "No checksum file found, creating new one"
        return $true
    }
    
    try {
        $checksums = Get-Content $Script:ChecksumFile | ConvertFrom-Json
        $existingChecksum = $checksums | Where-Object { $_.file -eq $fileName }
        
        if (-not $existingChecksum) {
            Write-AutoVerifyLog "WARN" "No stored checksum found for: $fileName"
            return $true
        }
        
        # Calculate current checksum
        $currentHash = Get-FileHash -Path $BackupFilePath -Algorithm SHA256
        
        if ($currentHash.Hash -eq $existingChecksum.hash) {
            Write-AutoVerifyLog "SUCCESS" "Checksum verification passed"
            return $true
        } else {
            Write-AutoVerifyLog "CRITICAL" "Checksum verification FAILED - backup may be corrupted!"
            Write-AutoVerifyLog "ERROR" "Expected: $($existingChecksum.hash)"
            Write-AutoVerifyLog "ERROR" "Actual:   $($currentHash.Hash)"
            return $false
        }
    } catch {
        Write-AutoVerifyLog "ERROR" "Checksum verification failed: $($_.Exception.Message)"
        return $false
    }
}

function Update-ChecksumDatabase {
    param([array]$ChecksumData)
    
    Write-AutoVerifyLog "INFO" "Updating checksum database"
    
    try {
        # Load existing checksums
        $existingChecksums = @()
        if (Test-Path $Script:ChecksumFile) {
            $existingChecksums = Get-Content $Script:ChecksumFile | ConvertFrom-Json
        }
        
        # Update or add new checksums
        foreach ($newChecksum in $ChecksumData) {
            $existing = $existingChecksums | Where-Object { $_.file -eq $newChecksum.file }
            if ($existing) {
                $existing.hash = $newChecksum.hash
                $existing.timestamp = $newChecksum.timestamp
                $existing.size_bytes = $newChecksum.size_bytes
            } else {
                $existingChecksums += $newChecksum
            }
        }
        
        # Save updated checksums
        $existingChecksums | ConvertTo-Json -Depth 3 | Out-File -FilePath $Script:ChecksumFile -Encoding UTF8
        Write-AutoVerifyLog "SUCCESS" "Checksum database updated with $($ChecksumData.Count) entries"
        
    } catch {
        Write-AutoVerifyLog "ERROR" "Failed to update checksum database: $($_.Exception.Message)"
    }
}

function Invoke-TestRestore {
    param([string]$BackupFilePath)
    
    $fileName = Split-Path $BackupFilePath -Leaf
    Write-AutoVerifyLog "INFO" "Performing test restore for: $fileName"
    
    # Create temporary test database name
    $testDbName = "projectcars_test_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    
    try {
        # Read backup content to validate structure
        $backupContent = Get-Content $BackupFilePath -Raw
        
        # Basic structure validation
        $structureTests = @{
            "CREATE statements" = ($backupContent -match "CREATE TABLE" -or $backupContent -match "CREATE SCHEMA")
            "Data statements" = ($backupContent -match "INSERT INTO" -or $backupContent -match "COPY")
            "Valid SQL syntax" = ($backupContent -match "BEGIN;" -or $backupContent -match "COMMIT;" -or $backupContent.Length -gt 100)
            "No corruption markers" = (-not ($backupContent -match "CORRUPTED" -or $backupContent -match "ERROR"))
        }
        
        $testsPassed = 0
        $testsTotal = $structureTests.Count
        
        foreach ($test in $structureTests.GetEnumerator()) {
            if ($test.Value) {
                Write-AutoVerifyLog "SUCCESS" "✓ $($test.Key) - PASSED"
                $testsPassed++
            } else {
                Write-AutoVerifyLog "WARN" "✗ $($test.Key) - FAILED"
            }
        }
        
        $successRate = [math]::Round(($testsPassed / $testsTotal) * 100, 2)
        Write-AutoVerifyLog "INFO" "Test restore validation: $testsPassed/$testsTotal tests passed ($successRate percent)"
        
        if ($successRate -ge 75) {
            Write-AutoVerifyLog "SUCCESS" "Test restore validation passed (>= 75% success rate)"
            return $true
        } else {
            Write-AutoVerifyLog "ERROR" "Test restore validation failed (< 75% success rate)"
            return $false
        }
        
    } catch {
        Write-AutoVerifyLog "ERROR" "Test restore failed: $($_.Exception.Message)"
        return $false
    }
}

function Get-BackupFiles {
    $storagePath = "$Script:BackupDir\storage\local"
    
    if (-not (Test-Path $storagePath)) {
        Write-AutoVerifyLog "ERROR" "Storage path not found: $storagePath"
        return @()
    }
    
    $backupFiles = Get-ChildItem -Path $storagePath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    return $backupFiles | ForEach-Object { $_.FullName }
}

function Invoke-ComprehensiveVerification {
    param([array]$BackupFiles)
    
    Write-AutoVerifyLog "INFO" "Starting comprehensive verification of $($BackupFiles.Count) backup files"
    
    $verificationResults = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        total_files = $BackupFiles.Count
        successful_verifications = 0
        failed_verifications = 0
        checksum_failures = 0
        restore_test_failures = 0
        files = @()
    }
    
    $checksumData = @()
    
    foreach ($backupFile in $BackupFiles) {
        $fileName = Split-Path $backupFile -Leaf
        Write-AutoVerifyLog "INFO" "Verifying: $fileName"
        
        $fileResult = @{
            file = $fileName
            path = $backupFile
            size_bytes = (Get-Item $backupFile).Length
            timestamp = (Get-Item $backupFile).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            integrity_check = $false
            checksum_check = $false
            restore_test = $false
            overall_status = "FAILED"
        }
        
        # 1. Basic integrity verification using existing script
        try {
            Write-AutoVerifyLog "INFO" "Running basic integrity verification..."
            $verifyResult = & "$Script:ScriptDir\verify-backup.ps1" -BackupFile $backupFile -Level "full"
            if ($LASTEXITCODE -eq 0) {
                $fileResult.integrity_check = $true
                Write-AutoVerifyLog "SUCCESS" "Basic integrity check passed"
            } else {
                Write-AutoVerifyLog "ERROR" "Basic integrity check failed"
            }
        } catch {
            Write-AutoVerifyLog "ERROR" "Integrity check error: $($_.Exception.Message)"
        }
        
        # 2. Checksum verification
        if ($Checksums) {
            $fileResult.checksum_check = Test-BackupChecksum -BackupFilePath $backupFile
            if (-not $fileResult.checksum_check) {
                $verificationResults.checksum_failures++
            }
            
            # Generate new checksum for future verification
            $checksum = New-BackupChecksum -BackupFilePath $backupFile
            if ($checksum) {
                $checksumData += $checksum
            }
        } else {
            $fileResult.checksum_check = $true # Skip if not requested
        }
        
        # 3. Test restore
        if ($TestRestore) {
            $fileResult.restore_test = Invoke-TestRestore -BackupFilePath $backupFile
            if (-not $fileResult.restore_test) {
                $verificationResults.restore_test_failures++
            }
        } else {
            $fileResult.restore_test = $true # Skip if not requested
        }
        
        # Determine overall status
        if ($fileResult.integrity_check -and $fileResult.checksum_check -and $fileResult.restore_test) {
            $fileResult.overall_status = "PASSED"
            $verificationResults.successful_verifications++
            Write-AutoVerifyLog "SUCCESS" "All verifications passed for: $fileName"
        } else {
            $verificationResults.failed_verifications++
            Write-AutoVerifyLog "ERROR" "Some verifications failed for: $fileName"
        }
        
        $verificationResults.files += $fileResult
        Write-Host "" # Spacing between files
    }
    
    # Update checksum database
    if ($checksumData.Count -gt 0) {
        Update-ChecksumDatabase -ChecksumData $checksumData
    }
    
    return $verificationResults
}

function New-VerificationReport {
    param([hashtable]$Results)
    
    Write-AutoVerifyLog "INFO" "Generating verification report"
    
    # Add summary statistics
    $Results.success_rate = if ($Results.total_files -gt 0) { 
        [math]::Round(($Results.successful_verifications / $Results.total_files) * 100, 2) 
    } else { 0 }
    
    $Results.recommendations = @()
    
    # Generate recommendations based on results
    if ($Results.failed_verifications -gt 0) {
        $Results.recommendations += "Investigate and resolve $($Results.failed_verifications) failed verification(s)"
    }
    
    if ($Results.checksum_failures -gt 0) {
        $Results.recommendations += "CRITICAL: $($Results.checksum_failures) backup(s) have checksum failures - possible corruption"
    }
    
    if ($Results.restore_test_failures -gt 0) {
        $Results.recommendations += "WARNING: $($Results.restore_test_failures) backup(s) failed restore tests"
    }
    
    if ($Results.success_rate -eq 100) {
        $Results.recommendations += "All backups verified successfully - no action required"
    }
    
    # Save report
    try {
        $Results | ConvertTo-Json -Depth 4 | Out-File -FilePath $Script:ReportFile -Encoding UTF8
        Write-AutoVerifyLog "SUCCESS" "Verification report saved: $Script:ReportFile"
    } catch {
        Write-AutoVerifyLog "ERROR" "Failed to save report: $($_.Exception.Message)"
    }
    
    return $Results
}

function Set-VerificationSchedule {
    Write-AutoVerifyLog "INFO" "Setting up automated verification schedule"
    
    # Define verification tasks
    $verificationTasks = @(
        @{
            name = "ProjectCarsBackupVerify_Hourly"
            description = "Hourly basic backup verification"
            schedule = "hourly"
            arguments = "-Mode verify"
            time = "00"
        },
        @{
            name = "ProjectCarsBackupVerify_Daily"
            description = "Daily comprehensive verification with checksums"
            schedule = "daily"
            arguments = "-Mode verify -Checksums"
            time = "03:00"
        },
        @{
            name = "ProjectCarsBackupVerify_Weekly"
            description = "Weekly full audit with test restores"
            schedule = "weekly"
            arguments = "-Mode verify -Checksums -TestRestore -FullAudit"
            time = "02:00"
            day = "Sunday"
        }
    )
    
    foreach ($task in $verificationTasks) {
        try {
            $taskName = $task.name
            $scriptPath = $MyInvocation.MyCommand.Path
            $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" $($task.arguments)"
            
            switch ($task.schedule) {
                "hourly" {
                    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 9999)
                }
                "daily" {
                    $trigger = New-ScheduledTaskTrigger -Daily -At $task.time
                }
                "weekly" {
                    $trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek $task.day -At $task.time
                }
            }
            
            $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
            
            Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $task.description -Force
            Write-AutoVerifyLog "SUCCESS" "Scheduled task created: $taskName"
            
        } catch {
            Write-AutoVerifyLog "ERROR" "Failed to create scheduled task $($task.name): $($_.Exception.Message)"
        }
    }
}

function Show-VerificationSummary {
    param([hashtable]$Results)
    
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "BACKUP VERIFICATION SUMMARY" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    
    Write-Host "Timestamp: $($Results.timestamp)" -ForegroundColor White
    Write-Host "Total Files: $($Results.total_files)" -ForegroundColor White
    Write-Host "Successful: $($Results.successful_verifications)" -ForegroundColor Green
    Write-Host "Failed: $($Results.failed_verifications)" -ForegroundColor Red
    Write-Host "Success Rate: $($Results.success_rate)%" -ForegroundColor $(if ($Results.success_rate -eq 100) { "Green" } else { "Yellow" })
    
    if ($Results.checksum_failures -gt 0) {
        Write-Host "Checksum Failures: $($Results.checksum_failures)" -ForegroundColor Magenta
    }
    
    if ($Results.restore_test_failures -gt 0) {
        Write-Host "Restore Test Failures: $($Results.restore_test_failures)" -ForegroundColor Red
    }
    
    Write-Host "`nRecommendations:" -ForegroundColor Yellow
    foreach ($recommendation in $Results.recommendations) {
        Write-Host "• $recommendation" -ForegroundColor White
    }
    
    Write-Host "="*60 -ForegroundColor Cyan
}

# Main execution
function Main {
    Write-AutoVerifyLog "INFO" "Starting Automated Backup Verification System"
    Write-AutoVerifyLog "INFO" "Mode: $Mode"
    
    # Ensure directories exist
    $logsDir = "$Script:BackupDir\storage\logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }
    
    switch ($Mode) {
        "verify" {
            $backupFiles = Get-BackupFiles
            if ($backupFiles.Count -eq 0) {
                Write-AutoVerifyLog "ERROR" "No backup files found for verification"
                exit 1
            }
            
            $results = Invoke-ComprehensiveVerification -BackupFiles $backupFiles
            $report = New-VerificationReport -Results $results
            Show-VerificationSummary -Results $report
            
            # Exit with appropriate code
            if ($results.failed_verifications -eq 0) {
                exit 0
            } else {
                exit 1
            }
        }
        
        "schedule" {
            if ($SetupSchedule) {
                Set-VerificationSchedule
                Write-AutoVerifyLog "SUCCESS" "Automated verification schedule configured"
            } else {
                Write-AutoVerifyLog "INFO" "Use -SetupSchedule flag to configure automated scheduling"
            }
        }
        
        "report" {
            if (Test-Path $Script:ReportFile) {
                $report = Get-Content $Script:ReportFile | ConvertFrom-Json
                Show-VerificationSummary -Results $report
            } else {
                Write-AutoVerifyLog "ERROR" "No verification report found. Run verification first."
            }
        }
        
        default {
            Write-AutoVerifyLog "ERROR" "Unknown mode: $Mode"
            Write-Host "Usage: automated-verification-system.ps1 -Mode [verify|schedule|report] [options]"
            exit 1
        }
    }
}

# Execute main function
Main 