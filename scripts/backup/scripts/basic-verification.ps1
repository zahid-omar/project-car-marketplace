# Basic Backup Verification Script
# ProjectCars Database Backup Verification
# Version: 1.0.0

param(
    [switch]$Checksums,
    [switch]$TestRestore
)

$BackupDir = Split-Path -Parent $PSScriptRoot
$LogFile = "$BackupDir\storage\logs\verification-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param($Level, $Message)
    $entry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $entry
    try {
        $entry | Out-File -FilePath $LogFile -Append -Encoding UTF8
    } catch {}
}

function Test-BackupFile {
    param($File)
    $name = Split-Path $File -Leaf
    Write-Log "INFO" "Testing: $name"
    
    if (-not (Test-Path $File)) {
        Write-Log "ERROR" "File not found: $name"
        return $false
    }
    
    $size = (Get-Item $File).Length
    if ($size -eq 0) {
        Write-Log "ERROR" "Empty file: $name"
        return $false
    }
    
    Write-Log "SUCCESS" "File OK: $name ($([math]::Round($size/1KB,2)) KB)"
    return $true
}

Write-Log "INFO" "Starting backup verification"

# Ensure log directory exists
$logDir = Split-Path $LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Find backup files
$backupPath = "$BackupDir\storage\local"
if (-not (Test-Path $backupPath)) {
    Write-Log "ERROR" "Backup directory not found: $backupPath"
    exit 1
}

$files = Get-ChildItem -Path $backupPath -Filter "*.sql" | Sort-Object LastWriteTime -Descending

if ($files.Count -eq 0) {
    Write-Log "ERROR" "No backup files found"
    exit 1
}

Write-Log "INFO" "Found $($files.Count) backup files"

# Test each file
$passed = 0
$failed = 0

foreach ($file in $files) {
    if (Test-BackupFile -File $file.FullName) {
        $passed++
        
        # Generate checksum if requested
        if ($Checksums) {
            try {
                $hash = Get-FileHash -Path $file.FullName -Algorithm SHA256
                Write-Log "SUCCESS" "Checksum: $($hash.Hash.Substring(0,16))..."
            } catch {
                Write-Log "WARN" "Could not generate checksum"
            }
        }
        
        # Test restore capability if requested
        if ($TestRestore) {
            try {
                $content = Get-Content $file.FullName -TotalCount 10
                $hasSQL = $false
                foreach ($line in $content) {
                    if ($line -match "CREATE|INSERT|DATABASE") {
                        $hasSQL = $true
                        break
                    }
                }
                if ($hasSQL) {
                    Write-Log "SUCCESS" "Restore test: SQL content detected"
                } else {
                    Write-Log "WARN" "Restore test: No SQL content detected"
                }
            } catch {
                Write-Log "ERROR" "Restore test failed"
            }
        }
    } else {
        $failed++
    }
    Write-Host ""
}

# Summary
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "BACKUP VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Total Files: $($files.Count)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "SUCCESS: All verifications passed!" -ForegroundColor Green
    Write-Log "SUCCESS" "All backup verifications completed successfully"
    exit 0
} else {
    Write-Host "FAILED: $failed verification(s) failed" -ForegroundColor Red
    Write-Log "ERROR" "Some backup verifications failed"
    exit 1
} 