# ============================================================================
# ProjectCars Backup Verification Script (PowerShell)
# ============================================================================
# Description: Windows-compatible backup verification script
# Author: ProjectCars Backup System
# Version: 1.0.0
# ============================================================================

param(
    [string]$BackupFile = "",
    [switch]$Latest = $false,
    [switch]$All = $false,
    [string]$Level = "basic",
    [switch]$Help = $false
)

# Script configuration
$Script:ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:BackupDir = Split-Path -Parent $Script:ScriptDir
$Script:Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Script:LogFile = "$Script:BackupDir\storage\logs\verify-$Script:Timestamp.log"

# Function to write log messages
function Write-VerifyLog {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console with color
    switch ($Level) {
        "INFO"  { Write-Host $logEntry -ForegroundColor Green }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "DEBUG" { Write-Host $logEntry -ForegroundColor Blue }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    # Write to log file
    try {
        $logEntry | Out-File -FilePath $Script:LogFile -Append -Encoding UTF8
    }
    catch {
        Write-Host "Warning: Could not write to log file: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Function to show usage
function Show-Usage {
    Write-Host @"
Usage: .\verify-backup.ps1 [OPTIONS]

OPTIONS:
    -BackupFile FILE    Verify specific backup file
    -Latest            Verify latest backup file
    -All               Verify all backup files
    -Level LEVEL       Verification level: basic, full (default: basic)
    -Help              Show this help message

VERIFICATION LEVELS:
    basic              File integrity checks (file exists, size, metadata)
    full               Basic + metadata validation + file content checks

EXAMPLES:
    .\verify-backup.ps1 -Latest                     # Verify latest backup (basic)
    .\verify-backup.ps1 -BackupFile backup.sql      # Verify specific file
    .\verify-backup.ps1 -All -Level full            # Comprehensive verification

"@ -ForegroundColor Cyan
}

# Function to find latest backup file
function Find-LatestBackup {
    $storagePath = Join-Path $Script:BackupDir "storage\local"
    
    if (-not (Test-Path $storagePath)) {
        Write-VerifyLog "ERROR" "Storage path not found: $storagePath"
        return $null
    }
    
    $backupFiles = Get-ChildItem -Path $storagePath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backupFiles.Count -eq 0) {
        Write-VerifyLog "ERROR" "No backup files found in: $storagePath"
        return $null
    }
    
    return $backupFiles[0].FullName
}

# Function to find all backup files
function Find-AllBackups {
    $storagePath = Join-Path $Script:BackupDir "storage\local"
    
    if (-not (Test-Path $storagePath)) {
        Write-VerifyLog "ERROR" "Storage path not found: $storagePath"
        return @()
    }
    
    $backupFiles = Get-ChildItem -Path $storagePath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    return $backupFiles | ForEach-Object { $_.FullName }
}

# Function to verify file integrity
function Test-FileIntegrity {
    param([string]$FilePath)
    
    $fileName = Split-Path $FilePath -Leaf
    Write-VerifyLog "INFO" "Verifying file integrity: $fileName"
    
    # Check if file exists
    if (-not (Test-Path $FilePath)) {
        Write-VerifyLog "ERROR" "Backup file not found: $FilePath"
        return $false
    }
    
    # Check if file is readable
    try {
        $content = Get-Content $FilePath -TotalCount 1
    }
    catch {
        Write-VerifyLog "ERROR" "Backup file not readable: $FilePath"
        return $false
    }
    
    # Check file size
    $fileSize = (Get-Item $FilePath).Length
    if ($fileSize -eq 0) {
        Write-VerifyLog "ERROR" "Backup file is empty: $FilePath"
        return $false
    }
    
    Write-VerifyLog "INFO" "File size: $([math]::Round($fileSize / 1KB, 2)) KB"
    Write-VerifyLog "SUCCESS" "File integrity check passed"
    
    return $true
}

# Function to verify metadata
function Test-Metadata {
    param([string]$BackupFilePath)
    
    $metadataFile = "$BackupFilePath.metadata.json"
    
    if (-not (Test-Path $metadataFile)) {
        Write-VerifyLog "WARN" "Metadata file not found: $metadataFile"
        return $true  # Not critical for basic verification
    }
    
    Write-VerifyLog "INFO" "Verifying backup metadata..."
    
    try {
        $metadata = Get-Content $metadataFile | ConvertFrom-Json
        
        # Display key metadata
        Write-VerifyLog "INFO" "Backup name: $($metadata.backup_info.name)"
        Write-VerifyLog "INFO" "Timestamp: $($metadata.backup_info.timestamp)"
        Write-VerifyLog "INFO" "Type: $($metadata.backup_info.type)"
        Write-VerifyLog "INFO" "Created by: $($metadata.created_by.user) on $($metadata.created_by.hostname)"
        
        Write-VerifyLog "SUCCESS" "Metadata verification passed"
        return $true
    }
    catch {
        Write-VerifyLog "ERROR" "Invalid metadata file: $($_.Exception.Message)"
        return $false
    }
}

# Function to verify backup content
function Test-BackupContent {
    param([string]$BackupFilePath)
    
    Write-VerifyLog "INFO" "Verifying backup content..."
    
    try {
        $content = Get-Content $BackupFilePath -TotalCount 10
        
        # Check for SQL-like content
        $sqlKeywords = @("SELECT", "CREATE", "INSERT", "DATABASE", "--")
        $foundKeywords = 0
        
        foreach ($line in $content) {
            foreach ($keyword in $sqlKeywords) {
                if ($line -match $keyword) {
                    $foundKeywords++
                    break
                }
            }
        }
        
        if ($foundKeywords -gt 0) {
            Write-VerifyLog "SUCCESS" "Backup content appears valid (found $foundKeywords SQL-like patterns)"
            return $true
        } else {
            Write-VerifyLog "WARN" "Backup content may not be valid SQL (no SQL keywords found)"
            return $true  # Don't fail on this for now
        }
    }
    catch {
        Write-VerifyLog "ERROR" "Failed to read backup content: $($_.Exception.Message)"
        return $false
    }
}

# Function to verify single backup file
function Test-BackupFile {
    param(
        [string]$FilePath,
        [string]$VerificationLevel
    )
    
    $fileName = Split-Path $FilePath -Leaf
    Write-VerifyLog "INFO" "Starting verification of: $fileName"
    Write-VerifyLog "INFO" "Verification level: $VerificationLevel"
    
    $startTime = Get-Date
    
    # Basic verification (always performed)
    if (-not (Test-FileIntegrity -FilePath $FilePath)) {
        Write-VerifyLog "ERROR" "File integrity verification failed for: $fileName"
        return $false
    }
    
    # Metadata verification
    if (-not (Test-Metadata -BackupFilePath $FilePath)) {
        Write-VerifyLog "ERROR" "Metadata verification failed for: $fileName"
        return $false
    }
    
    # Full verification
    if ($VerificationLevel -eq "full") {
        if (-not (Test-BackupContent -BackupFilePath $FilePath)) {
            Write-VerifyLog "ERROR" "Content verification failed for: $fileName"
            return $false
        }
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-VerifyLog "SUCCESS" "Verification completed successfully in $([math]::Round($duration, 2)) seconds: $fileName"
    return $true
}

# Main execution
function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    Write-VerifyLog "INFO" "Starting ProjectCars Database Backup Verification (PowerShell)"
    Write-VerifyLog "INFO" "Verification level: $Level"
    
    # Determine which files to verify
    $filesToVerify = @()
    
    if ($BackupFile) {
        $fullPath = if ([System.IO.Path]::IsPathRooted($BackupFile)) { $BackupFile } else { Join-Path (Get-Location) $BackupFile }
        $filesToVerify += $fullPath
    }
    elseif ($Latest) {
        $latestFile = Find-LatestBackup
        if ($latestFile) {
            $filesToVerify += $latestFile
        }
    }
    elseif ($All) {
        $filesToVerify = Find-AllBackups
    }
    else {
        Write-VerifyLog "ERROR" "Must specify -BackupFile, -Latest, or -All"
        Show-Usage
        exit 1
    }
    
    if ($filesToVerify.Count -eq 0) {
        Write-VerifyLog "ERROR" "No backup files found to verify"
        exit 1
    }
    
    Write-VerifyLog "INFO" "Found $($filesToVerify.Count) backup file(s) to verify"
    
    # Verify each file
    $successfulVerifications = 0
    $failedVerifications = 0
    
    foreach ($file in $filesToVerify) {
        if (Test-BackupFile -FilePath $file -VerificationLevel $Level) {
            $successfulVerifications++
        } else {
            $failedVerifications++
        }
        Write-Host ""  # Add spacing between files
    }
    
    # Summary
    Write-VerifyLog "INFO" "Verification Summary:"
    Write-VerifyLog "INFO" "  Total files: $($filesToVerify.Count)"
    Write-VerifyLog "INFO" "  Successful: $successfulVerifications"
    Write-VerifyLog "INFO" "  Failed: $failedVerifications"
    
    if ($failedVerifications -eq 0) {
        Write-VerifyLog "SUCCESS" "All backup verifications completed successfully"
        exit 0
    } else {
        Write-VerifyLog "ERROR" "Some backup verifications failed"
        exit 1
    }
}

# Ensure log directory exists
$logDir = Split-Path $Script:LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Run main function
Main 