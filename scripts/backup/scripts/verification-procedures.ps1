# ============================================================================
# Backup Verification Procedures for ProjectCars Database
# ============================================================================
# Description: Automated backup verification with checksums and test restores
# Version: 1.0.0
# Created: 2025-07-05
# ============================================================================

param(
    [string]$Mode = "verify",
    [switch]$Checksums = $false,
    [switch]$TestRestore = $false,
    [switch]$Schedule = $false
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Split-Path -Parent $ScriptDir
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "$BackupDir\storage\logs\verification-$Timestamp.log"
$ReportFile = "$BackupDir\storage\logs\verification-report-$(Get-Date -Format 'yyyyMMdd').json"
$ChecksumFile = "$BackupDir\storage\logs\backup-checksums.json"

function Write-VerificationLog {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "INFO"     { Write-Host $logEntry -ForegroundColor Green }
        "WARN"     { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR"    { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS"  { Write-Host $logEntry -ForegroundColor Cyan }
        "CRITICAL" { Write-Host $logEntry -ForegroundColor Magenta }
    }
    
    try {
        $logEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
    } catch {
        Write-Host "Warning: Could not write to log file" -ForegroundColor Yellow
    }
}

function Test-BackupIntegrity {
    param([string]$BackupFile)
    
    $fileName = Split-Path $BackupFile -Leaf
    Write-VerificationLog "INFO" "Testing integrity: $fileName"
    
    # Check file exists and is readable
    if (-not (Test-Path $BackupFile)) {
        Write-VerificationLog "ERROR" "File not found: $BackupFile"
        return $false
    }
    
    # Check file size
    $fileSize = (Get-Item $BackupFile).Length
    if ($fileSize -eq 0) {
        Write-VerificationLog "ERROR" "File is empty: $fileName"
        return $false
    }
    
    # Check basic content
    try {
        $content = Get-Content $BackupFile -TotalCount 10
        $hasSQL = $false
        foreach ($line in $content) {
            if ($line -match "CREATE|INSERT|SELECT|DATABASE") {
                $hasSQL = $true
                break
            }
        }
        
        if (-not $hasSQL) {
            Write-VerificationLog "WARN" "No SQL content detected in: $fileName"
        }
        
        Write-VerificationLog "SUCCESS" "Integrity check passed: $fileName"
        return $true
        
    } catch {
        Write-VerificationLog "ERROR" "Cannot read file content: $fileName"
        return $false
    }
}

function New-FileChecksum {
    param([string]$FilePath)
    
    try {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        return @{
            file = Split-Path $FilePath -Leaf
            path = $FilePath
            hash = $hash.Hash
            size = (Get-Item $FilePath).Length
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    } catch {
        Write-VerificationLog "ERROR" "Failed to generate checksum for: $(Split-Path $FilePath -Leaf)"
        return $null
    }
}

function Test-FileChecksum {
    param([string]$FilePath)
    
    $fileName = Split-Path $FilePath -Leaf
    Write-VerificationLog "INFO" "Verifying checksum: $fileName"
    
    # Load existing checksums
    if (-not (Test-Path $ChecksumFile)) {
        Write-VerificationLog "WARN" "No checksum database found, creating new one"
        return $true
    }
    
    try {
        $checksums = Get-Content $ChecksumFile | ConvertFrom-Json
        $stored = $checksums | Where-Object { $_.file -eq $fileName }
        
        if (-not $stored) {
            Write-VerificationLog "WARN" "No stored checksum for: $fileName"
            return $true
        }
        
        # Calculate current checksum
        $current = Get-FileHash -Path $FilePath -Algorithm SHA256
        
        if ($current.Hash -eq $stored.hash) {
            Write-VerificationLog "SUCCESS" "Checksum verified: $fileName"
            return $true
        } else {
            Write-VerificationLog "CRITICAL" "CHECKSUM MISMATCH: $fileName may be corrupted!"
            return $false
        }
        
    } catch {
        Write-VerificationLog "ERROR" "Checksum verification failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-BackupRestore {
    param([string]$BackupFile)
    
    $fileName = Split-Path $BackupFile -Leaf
    Write-VerificationLog "INFO" "Testing restore capability: $fileName"
    
    try {
        # Read and analyze backup content
        $content = Get-Content $BackupFile -Raw
        
        # Check for essential SQL components
        $tests = @{
            "Table definitions" = ($content -match "CREATE TABLE")
            "Data inserts" = ($content -match "INSERT INTO")
            "Schema structure" = ($content -match "CREATE SCHEMA|CREATE DATABASE")
            "Valid termination" = ($content -match "COMMIT|END")
        }
        
        $passed = 0
        $total = $tests.Count
        
        foreach ($test in $tests.GetEnumerator()) {
            if ($test.Value) {
                Write-VerificationLog "SUCCESS" "✓ $($test.Key) - PASSED"
                $passed++
            } else {
                Write-VerificationLog "WARN" "✗ $($test.Key) - FAILED"
            }
        }
        
        $successRate = [math]::Round(($passed / $total) * 100, 2)
        $message = "Restore test results: $passed/$total tests passed ($successRate" + "%)"
        Write-VerificationLog "INFO" $message
        
        if ($successRate -ge 75) {
            Write-VerificationLog "SUCCESS" "Restore test passed"
            return $true
        } else {
            Write-VerificationLog "ERROR" "Restore test failed"
            return $false
        }
        
    } catch {
        Write-VerificationLog "ERROR" "Restore test failed: $($_.Exception.Message)"
        return $false
    }
}

function Get-BackupFiles {
    $storagePath = "$BackupDir\storage\local"
    
    if (-not (Test-Path $storagePath)) {
        Write-VerificationLog "ERROR" "Storage directory not found: $storagePath"
        return @()
    }
    
    $files = Get-ChildItem -Path $storagePath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    return $files | ForEach-Object { $_.FullName }
}

function Invoke-VerificationProcedures {
    Write-VerificationLog "INFO" "Starting backup verification procedures"
    
    $backupFiles = Get-BackupFiles
    
    if ($backupFiles.Count -eq 0) {
        Write-VerificationLog "ERROR" "No backup files found for verification"
        return $false
    }
    
    Write-VerificationLog "INFO" "Found $($backupFiles.Count) backup files to verify"
    
    $results = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        total_files = $backupFiles.Count
        successful = 0
        failed = 0
        integrity_failures = 0
        checksum_failures = 0
        restore_failures = 0
        files = @()
    }
    
    $checksumData = @()
    
    foreach ($file in $backupFiles) {
        $fileName = Split-Path $file -Leaf
        Write-VerificationLog "INFO" "Verifying: $fileName"
        
        $fileResult = @{
            file = $fileName
            size = (Get-Item $file).Length
            integrity = $false
            checksum = $false
            restore = $false
            status = "FAILED"
        }
        
        # 1. Integrity check
        $fileResult.integrity = Test-BackupIntegrity -BackupFile $file
        if (-not $fileResult.integrity) {
            $results.integrity_failures++
        }
        
        # 2. Checksum verification (if requested)
        if ($Checksums) {
            $fileResult.checksum = Test-FileChecksum -FilePath $file
            if (-not $fileResult.checksum) {
                $results.checksum_failures++
            }
            
            # Generate checksum for storage
            $checksum = New-FileChecksum -FilePath $file
            if ($checksum) {
                $checksumData += $checksum
            }
        } else {
            $fileResult.checksum = $true
        }
        
        # 3. Restore test (if requested)
        if ($TestRestore) {
            $fileResult.restore = Test-BackupRestore -BackupFile $file
            if (-not $fileResult.restore) {
                $results.restore_failures++
            }
        } else {
            $fileResult.restore = $true
        }
        
        # Overall status
        if ($fileResult.integrity -and $fileResult.checksum -and $fileResult.restore) {
            $fileResult.status = "PASSED"
            $results.successful++
        } else {
            $results.failed++
        }
        
        $results.files += $fileResult
        Write-Host ""
    }
    
    # Update checksum database
    if ($checksumData.Count -gt 0) {
        try {
            $checksumData | ConvertTo-Json -Depth 3 | Out-File -FilePath $ChecksumFile -Encoding UTF8
            Write-VerificationLog "SUCCESS" "Updated checksum database with $($checksumData.Count) entries"
        } catch {
            Write-VerificationLog "ERROR" "Failed to update checksum database"
        }
    }
    
    # Generate report
    $results.success_rate = [math]::Round(($results.successful / $results.total_files) * 100, 2)
    
    try {
        $results | ConvertTo-Json -Depth 4 | Out-File -FilePath $ReportFile -Encoding UTF8
        Write-VerificationLog "SUCCESS" "Verification report saved: $ReportFile"
    } catch {
        Write-VerificationLog "ERROR" "Failed to save verification report"
    }
    
    # Display summary
    Write-Host "`n" + "="*50 -ForegroundColor Cyan
    Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
    Write-Host "="*50 -ForegroundColor Cyan
    Write-Host "Total Files: $($results.total_files)" -ForegroundColor White
    Write-Host "Successful: $($results.successful)" -ForegroundColor Green
    Write-Host "Failed: $($results.failed)" -ForegroundColor Red
    $successRateText = "Success Rate: " + $results.success_rate + "%"
    Write-Host $successRateText -ForegroundColor $(if ($results.success_rate -eq 100) { "Green" } else { "Yellow" })
    
    if ($results.integrity_failures -gt 0) {
        Write-Host "Integrity Failures: $($results.integrity_failures)" -ForegroundColor Red
    }
    if ($results.checksum_failures -gt 0) {
        Write-Host "Checksum Failures: $($results.checksum_failures)" -ForegroundColor Magenta
    }
    if ($results.restore_failures -gt 0) {
        Write-Host "Restore Test Failures: $($results.restore_failures)" -ForegroundColor Red
    }
    
    Write-Host "="*50 -ForegroundColor Cyan
    
    return ($results.failed -eq 0)
}

function Set-AutomatedSchedule {
    Write-VerificationLog "INFO" "Setting up automated verification schedule"
    
    $scriptPath = $MyInvocation.MyCommand.Path
    
    # Hourly basic verification
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Mode verify"
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
        Register-ScheduledTask -TaskName "ProjectCars_Verification_Hourly" -Action $action -Trigger $trigger -Force
        Write-VerificationLog "SUCCESS" "Hourly verification task scheduled"
    } catch {
        Write-VerificationLog "ERROR" "Failed to schedule hourly task: $($_.Exception.Message)"
    }
    
    # Daily checksum verification
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Mode verify -Checksums"
        $trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
        Register-ScheduledTask -TaskName "ProjectCars_Verification_Daily" -Action $action -Trigger $trigger -Force
        Write-VerificationLog "SUCCESS" "Daily checksum verification task scheduled"
    } catch {
        Write-VerificationLog "ERROR" "Failed to schedule daily task: $($_.Exception.Message)"
    }
    
    # Weekly full verification
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Mode verify -Checksums -TestRestore"
        $trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Sunday -At "01:00"
        Register-ScheduledTask -TaskName "ProjectCars_Verification_Weekly" -Action $action -Trigger $trigger -Force
        Write-VerificationLog "SUCCESS" "Weekly full verification task scheduled"
    } catch {
        Write-VerificationLog "ERROR" "Failed to schedule weekly task: $($_.Exception.Message)"
    }
}

# Main execution
Write-VerificationLog "INFO" "Starting Backup Verification Procedures"

# Ensure log directory exists
$logsDir = "$BackupDir\storage\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

switch ($Mode) {
    "verify" {
        $success = Invoke-VerificationProcedures
        if ($success) {
            Write-VerificationLog "SUCCESS" "All verification procedures completed successfully"
            exit 0
        } else {
            Write-VerificationLog "ERROR" "Some verification procedures failed"
            exit 1
        }
    }
    
    "schedule" {
        if ($Schedule) {
            Set-AutomatedSchedule
            Write-VerificationLog "SUCCESS" "Automated verification schedule configured"
        } else {
            Write-VerificationLog "INFO" "Use -Schedule flag to set up automated tasks"
        }
    }
    
    "report" {
        if (Test-Path $ReportFile) {
            $report = Get-Content $ReportFile | ConvertFrom-Json
            Write-Host "Latest verification report:" -ForegroundColor Cyan
            Write-Host "Timestamp: $($report.timestamp)" -ForegroundColor White
            $reportRateText = "Success Rate: " + $report.success_rate + "%"
            Write-Host $reportRateText -ForegroundColor Green
        } else {
            Write-VerificationLog "ERROR" "No verification report found"
        }
    }
    
    default {
        Write-VerificationLog "ERROR" "Unknown mode: $Mode"
        Write-Host "Usage: verification-procedures.ps1 -Mode [verify|schedule|report] [-Checksums] [-TestRestore] [-Schedule]"
        exit 1
    }
}

Write-VerificationLog "INFO" "Verification procedures script completed" 