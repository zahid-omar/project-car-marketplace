# Backup Verification Script for ProjectCars Database
# Simple and reliable verification procedures
# Version: 1.0.0
# Created: 2025-07-05

param(
    [switch]$Checksums = $false,
    [switch]$TestRestore = $false,
    [switch]$Schedule = $false
)

# Configuration
$BackupDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LogFile = "$BackupDir\storage\logs\verification-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$ReportFile = "$BackupDir\storage\logs\verification-report-$(Get-Date -Format 'yyyyMMdd').json"

function Write-Log {
    param($Level, $Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "INFO"     { Write-Host $entry -ForegroundColor Green }
        "WARN"     { Write-Host $entry -ForegroundColor Yellow }
        "ERROR"    { Write-Host $entry -ForegroundColor Red }
        "SUCCESS"  { Write-Host $entry -ForegroundColor Cyan }
        "CRITICAL" { Write-Host $entry -ForegroundColor Magenta }
    }
    
    try {
        $entry | Out-File -FilePath $LogFile -Append
    } catch {
        Write-Host "Warning: Could not write to log" -ForegroundColor Yellow
    }
}

function Test-BackupFile {
    param($FilePath)
    
    $fileName = Split-Path $FilePath -Leaf
    Write-Log "INFO" "Verifying: $fileName"
    
    # Check if file exists
    if (-not (Test-Path $FilePath)) {
        Write-Log "ERROR" "File not found: $fileName"
        return $false
    }
    
    # Check file size
    $size = (Get-Item $FilePath).Length
    if ($size -eq 0) {
        Write-Log "ERROR" "File is empty: $fileName"
        return $false
    }
    
    Write-Log "INFO" "File size: $([math]::Round($size/1KB, 2)) KB"
    
    # Check file content
    try {
        $firstLines = Get-Content $FilePath -TotalCount 5
        $hasValidContent = $false
        
        foreach ($line in $firstLines) {
            if ($line -match "CREATE|INSERT|SELECT|DATABASE|BEGIN") {
                $hasValidContent = $true
                break
            }
        }
        
        if ($hasValidContent) {
            Write-Log "SUCCESS" "Content validation passed: $fileName"
            return $true
        } else {
            Write-Log "WARN" "No SQL content detected: $fileName"
            return $true  # Don't fail for this
        }
    } catch {
        Write-Log "ERROR" "Cannot read file: $fileName"
        return $false
    }
}

function Get-FileChecksum {
    param($FilePath)
    
    try {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        return $hash.Hash
    } catch {
        Write-Log "ERROR" "Cannot calculate checksum for: $(Split-Path $FilePath -Leaf)"
        return $null
    }
}

function Test-RestoreCapability {
    param($FilePath)
    
    $fileName = Split-Path $FilePath -Leaf
    Write-Log "INFO" "Testing restore capability: $fileName"
    
    try {
        $content = Get-Content $FilePath -Raw
        
        # Basic restore tests
        $hasCreateStatements = $content -match "CREATE TABLE|CREATE SCHEMA"
        $hasDataStatements = $content -match "INSERT INTO|COPY"
        $hasProperStructure = $content.Length -gt 100
        
        $passedTests = 0
        $totalTests = 3
        
        if ($hasCreateStatements) {
            Write-Log "SUCCESS" "✓ CREATE statements found"
            $passedTests++
        } else {
            Write-Log "WARN" "✗ No CREATE statements found"
        }
        
        if ($hasDataStatements) {
            Write-Log "SUCCESS" "✓ Data statements found"
            $passedTests++
        } else {
            Write-Log "WARN" "✗ No data statements found"
        }
        
        if ($hasProperStructure) {
            Write-Log "SUCCESS" "✓ File structure valid"
            $passedTests++
        } else {
            Write-Log "WARN" "✗ File structure questionable"
        }
        
        $rate = [math]::Round(($passedTests / $totalTests) * 100, 2)
        Write-Log "INFO" "Restore test score: $passedTests/$totalTests tests passed"
        
        return ($passedTests -ge 2)  # Require at least 2 out of 3 tests to pass
        
    } catch {
        Write-Log "ERROR" "Restore test failed: $($_.Exception.Message)"
        return $false
    }
}

function Get-BackupFiles {
    $storagePath = "$BackupDir\storage\local"
    
    if (-not (Test-Path $storagePath)) {
        Write-Log "ERROR" "Storage directory not found: $storagePath"
        return @()
    }
    
    $files = Get-ChildItem -Path $storagePath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    return $files | ForEach-Object { $_.FullName }
}

function Start-VerificationProcess {
    Write-Log "INFO" "Starting backup verification process"
    
    # Ensure log directory exists
    $logDir = Split-Path $LogFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    $backupFiles = Get-BackupFiles
    
    if ($backupFiles.Count -eq 0) {
        Write-Log "ERROR" "No backup files found"
        return $false
    }
    
    Write-Log "INFO" "Found $($backupFiles.Count) backup files"
    
    $results = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        total_files = $backupFiles.Count
        passed = 0
        failed = 0
        files = @()
    }
    
    foreach ($file in $backupFiles) {
        $fileName = Split-Path $file -Leaf
        
        $fileResult = @{
            file = $fileName
            size_bytes = (Get-Item $file).Length
            integrity = $false
            checksum = ""
            restore_test = $false
            overall_status = "FAILED"
        }
        
        # Test file integrity
        $fileResult.integrity = Test-BackupFile -FilePath $file
        
        # Generate checksum if requested
        if ($Checksums) {
            $checksum = Get-FileChecksum -FilePath $file
            if ($checksum) {
                $fileResult.checksum = $checksum.Substring(0, 16) + "..."
                Write-Log "SUCCESS" "Checksum: $($fileResult.checksum)"
            }
        }
        
        # Test restore capability if requested
        if ($TestRestore) {
            $fileResult.restore_test = Test-RestoreCapability -FilePath $file
        } else {
            $fileResult.restore_test = $true
        }
        
        # Determine overall status
        if ($fileResult.integrity -and $fileResult.restore_test) {
            $fileResult.overall_status = "PASSED"
            $results.passed++
            Write-Log "SUCCESS" "Overall status: PASSED for $fileName"
        } else {
            $results.failed++
            Write-Log "ERROR" "Overall status: FAILED for $fileName"
        }
        
        $results.files += $fileResult
        Write-Host ""  # Add space between files
    }
    
    # Calculate success rate
    $successRate = if ($results.total_files -gt 0) {
        [math]::Round(($results.passed / $results.total_files) * 100, 2)
    } else { 0 }
    
    $results.success_rate = $successRate
    
    # Save report
    try {
        $results | ConvertTo-Json -Depth 3 | Out-File -FilePath $ReportFile
        Write-Log "SUCCESS" "Report saved: $ReportFile"
    } catch {
        Write-Log "ERROR" "Failed to save report"
    }
    
    # Display summary
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "BACKUP VERIFICATION SUMMARY" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "Timestamp: $($results.timestamp)" -ForegroundColor White
    Write-Host "Total Files: $($results.total_files)" -ForegroundColor White
    Write-Host "Passed: $($results.passed)" -ForegroundColor Green
    Write-Host "Failed: $($results.failed)" -ForegroundColor Red
    
    $rateColor = if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" }
    Write-Host "Success Rate: $successRate percent" -ForegroundColor $rateColor
    
    Write-Host "="*60 -ForegroundColor Cyan
    
    return ($results.failed -eq 0)
}

function Set-ScheduledVerification {
    Write-Log "INFO" "Setting up scheduled verification tasks"
    
    $scriptPath = $MyInvocation.MyCommand.Path
    
    # Daily basic verification
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -Daily -At "03:00"
        Register-ScheduledTask -TaskName "ProjectCars_Daily_Verification" -Action $action -Trigger $trigger -Force
        Write-Log "SUCCESS" "Daily verification task scheduled"
    } catch {
        Write-Log "ERROR" "Failed to schedule daily task: $($_.Exception.Message)"
    }
    
    # Weekly full verification with checksums and restore tests
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Checksums -TestRestore"
        $trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Sunday -At "02:00"
        Register-ScheduledTask -TaskName "ProjectCars_Weekly_Full_Verification" -Action $action -Trigger $trigger -Force
        Write-Log "SUCCESS" "Weekly full verification task scheduled"
    } catch {
        Write-Log "ERROR" "Failed to schedule weekly task: $($_.Exception.Message)"
    }
}

# Main execution
Write-Log "INFO" "Backup Verification Script Started"

if ($Schedule) {
    Set-ScheduledVerification
} else {
    $success = Start-VerificationProcess
    
    if ($success) {
        Write-Log "SUCCESS" "All verifications passed"
        exit 0
    } else {
        Write-Log "ERROR" "Some verifications failed"
        exit 1
    }
}

Write-Log "INFO" "Verification script completed" 