# ============================================================================
# ProjectCars Encryption System Test Script
# ============================================================================
# Description: Comprehensive test of the backup encryption system
# Author: ProjectCars Backup System
# Version: 1.0.0
# ============================================================================

param(
    [string]$ConfigFile = "config\backup.config.json",
    [switch]$Help = $false
)

# Script configuration
$Script:ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:BackupDir = Split-Path -Parent $Script:ScriptDir
$Script:Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Script:LogFile = "$Script:BackupDir\storage\logs\encryption-test-$Script:Timestamp.log"

# Function to write log messages
function Write-TestLog {
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
        "TEST"  { Write-Host $logEntry -ForegroundColor Magenta }
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
Usage: .\test-encryption.ps1 [OPTIONS]

OPTIONS:
    -ConfigFile FILE    Use custom config file (default: config\backup.config.json)
    -Help              Show this help message

DESCRIPTION:
    This script performs comprehensive testing of the backup encryption system:
    - Key generation and validation
    - File encryption and decryption
    - Backup creation with encryption
    - Integrity verification
    - Performance testing

"@ -ForegroundColor Cyan
}

# Function to load configuration
function Get-TestConfiguration {
    param([string]$ConfigPath)
    
    $fullConfigPath = Join-Path $Script:BackupDir $ConfigPath
    
    if (-not (Test-Path $fullConfigPath)) {
        Write-TestLog "ERROR" "Configuration file not found: $fullConfigPath"
        return $null
    }
    
    try {
        $config = Get-Content $fullConfigPath -Raw | ConvertFrom-Json
        Write-TestLog "INFO" "Configuration loaded successfully"
        return $config
    }
    catch {
        Write-TestLog "ERROR" "Failed to parse configuration file: $($_.Exception.Message)"
        return $null
    }
}

# Function to test key generation
function Test-KeyGeneration {
    param([string]$KeyFilePath)
    
    Write-TestLog "TEST" "Testing encryption key generation"
    
    try {
        # Remove existing key file if it exists
        if (Test-Path $KeyFilePath) {
            Remove-Item $KeyFilePath -Force
        }
        
        # Generate new key
        $keyGenScript = Join-Path $Script:ScriptDir "backup-encryption.ps1"
        $keyGenArgs = @(
            "-Action", "generate-key",
            "-KeyFile", $KeyFilePath,
            "-Force"
        )
        
        & $keyGenScript @keyGenArgs
        
        if (Test-Path $KeyFilePath) {
            Write-TestLog "SUCCESS" "Key generation test passed"
            return $true
        }
        else {
            Write-TestLog "ERROR" "Key generation test failed"
            return $false
        }
    }
    catch {
        Write-TestLog "ERROR" "Key generation test failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test file encryption and decryption
function Test-FileEncryption {
    param(
        [string]$KeyFilePath,
        [string]$TestDir
    )
    
    Write-TestLog "TEST" "Testing file encryption and decryption"
    
    try {
        # Create test file
        $testFile = Join-Path $TestDir "test-encryption-file.txt"
        $testContent = @"
ProjectCars Backup Encryption Test
Generated: $(Get-Date)
Content: This is a test file for encryption validation
Size: $(Get-Random -Minimum 1000 -Maximum 9999) bytes
Random: $(Get-Random)
"@
        
        $testContent | Out-File -FilePath $testFile -Encoding UTF8
        $originalSize = (Get-Item $testFile).Length
        
        # Test encryption
        $encryptScript = Join-Path $Script:ScriptDir "backup-encryption.ps1"
        $encryptArgs = @(
            "-Action", "encrypt",
            "-InputFile", $testFile,
            "-KeyFile", $KeyFilePath
        )
        
        & $encryptScript @encryptArgs
        
        $encryptedFile = "$testFile.enc"
        if (-not (Test-Path $encryptedFile)) {
            Write-TestLog "ERROR" "Encryption test failed: encrypted file not created"
            return $false
        }
        
        $encryptedSize = (Get-Item $encryptedFile).Length
        Write-TestLog "INFO" "Original size: $originalSize bytes, Encrypted size: $encryptedSize bytes"
        
        # Test decryption
        $decryptArgs = @(
            "-Action", "decrypt",
            "-InputFile", $encryptedFile,
            "-OutputFile", "$testFile.dec",
            "-KeyFile", $KeyFilePath
        )
        
        & $encryptScript @decryptArgs
        
        $decryptedFile = "$testFile.dec"
        if (-not (Test-Path $decryptedFile)) {
            Write-TestLog "ERROR" "Decryption test failed: decrypted file not created"
            return $false
        }
        
        # Compare original and decrypted content
        $originalContent = Get-Content $testFile -Raw
        $decryptedContent = Get-Content $decryptedFile -Raw
        
        if ($originalContent -eq $decryptedContent) {
            Write-TestLog "SUCCESS" "File encryption/decryption test passed"
            
            # Clean up test files
            Remove-Item $testFile, $encryptedFile, $decryptedFile -Force
            
            return $true
        }
        else {
            Write-TestLog "ERROR" "File encryption/decryption test failed: content mismatch"
            return $false
        }
    }
    catch {
        Write-TestLog "ERROR" "File encryption test failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test backup creation with encryption
function Test-EncryptedBackup {
    param(
        [object]$Config,
        [string]$TestDir
    )
    
    Write-TestLog "TEST" "Testing encrypted backup creation"
    
    try {
        # Run encrypted backup in test mode
        $backupScript = Join-Path $Script:ScriptDir "encrypted-backup.ps1"
        $backupArgs = @(
            "-Mode", "test",
            "-Encrypt",
            "-Verify",
            "-ConfigFile", "config\backup.config.json"
        )
        
        & $backupScript @backupArgs
        
        # Check if backup files were created
        $backupFiles = Get-ChildItem -Path $TestDir -Filter "backup-test-*.enc" | Sort-Object CreationTime -Descending
        
        if ($backupFiles.Count -gt 0) {
            $latestBackup = $backupFiles[0]
            Write-TestLog "SUCCESS" "Encrypted backup test passed"
            Write-TestLog "INFO" "Backup file: $($latestBackup.Name)"
            Write-TestLog "INFO" "Backup size: $([math]::Round($latestBackup.Length / 1KB, 2)) KB"
            
            # Check for metadata file
            $metadataFile = "$($latestBackup.FullName).metadata.json"
            if (Test-Path $metadataFile) {
                Write-TestLog "SUCCESS" "Metadata file created successfully"
                return $true
            }
            else {
                Write-TestLog "WARN" "Metadata file not found, but backup created"
                return $true
            }
        }
        else {
            Write-TestLog "ERROR" "Encrypted backup test failed: no backup files created"
            return $false
        }
    }
    catch {
        Write-TestLog "ERROR" "Encrypted backup test failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test key rotation
function Test-KeyRotation {
    param([string]$KeyFilePath)
    
    Write-TestLog "TEST" "Testing key rotation"
    
    try {
        # Get current key content
        $originalKey = Get-Content $KeyFilePath -Raw
        
        # Rotate key
        $keyRotateScript = Join-Path $Script:ScriptDir "backup-encryption.ps1"
        $rotateArgs = @(
            "-Action", "rotate-key",
            "-KeyFile", $KeyFilePath
        )
        
        & $keyRotateScript @rotateArgs
        
        # Check if new key is different
        $newKey = Get-Content $KeyFilePath -Raw
        
        if ($originalKey -ne $newKey) {
            Write-TestLog "SUCCESS" "Key rotation test passed"
            
            # Check if backup key exists
            $backupKeys = Get-ChildItem -Path (Split-Path $KeyFilePath -Parent) -Filter "*.backup.*"
            if ($backupKeys.Count -gt 0) {
                Write-TestLog "SUCCESS" "Backup key created successfully"
                return $true
            }
            else {
                Write-TestLog "WARN" "Key rotated but backup key not found"
                return $true
            }
        }
        else {
            Write-TestLog "ERROR" "Key rotation test failed: key not changed"
            return $false
        }
    }
    catch {
        Write-TestLog "ERROR" "Key rotation test failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test performance
function Test-EncryptionPerformance {
    param(
        [string]$KeyFilePath,
        [string]$TestDir
    )
    
    Write-TestLog "TEST" "Testing encryption performance"
    
    try {
        # Create test files of different sizes
        $testSizes = @(1KB, 10KB, 100KB, 1MB)
        $results = @()
        
        foreach ($size in $testSizes) {
            $testFile = Join-Path $TestDir "perf-test-$size.txt"
            $testContent = "A" * $size
            $testContent | Out-File -FilePath $testFile -Encoding UTF8 -NoNewline
            
            # Measure encryption time
            $encryptStart = Get-Date
            
            $encryptScript = Join-Path $Script:ScriptDir "backup-encryption.ps1"
            $encryptArgs = @(
                "-Action", "encrypt",
                "-InputFile", $testFile,
                "-KeyFile", $KeyFilePath
            )
            
            & $encryptScript @encryptArgs
            
            $encryptEnd = Get-Date
            $encryptTime = ($encryptEnd - $encryptStart).TotalMilliseconds
            
            # Measure decryption time
            $decryptStart = Get-Date
            
            $decryptArgs = @(
                "-Action", "decrypt",
                "-InputFile", "$testFile.enc",
                "-OutputFile", "$testFile.dec",
                "-KeyFile", $KeyFilePath
            )
            
            & $encryptScript @decryptArgs
            
            $decryptEnd = Get-Date
            $decryptTime = ($decryptEnd - $decryptStart).TotalMilliseconds
            
            $results += [PSCustomObject]@{
                Size = $size
                EncryptTime = $encryptTime
                DecryptTime = $decryptTime
                TotalTime = $encryptTime + $decryptTime
            }
            
            # Clean up
            Remove-Item $testFile, "$testFile.enc", "$testFile.dec" -Force
        }
        
        # Display results
        Write-TestLog "INFO" "Performance test results:"
        foreach ($result in $results) {
            Write-TestLog "INFO" "  Size: $($result.Size) | Encrypt: $([math]::Round($result.EncryptTime, 2))ms | Decrypt: $([math]::Round($result.DecryptTime, 2))ms | Total: $([math]::Round($result.TotalTime, 2))ms"
        }
        
        Write-TestLog "SUCCESS" "Performance test completed"
        return $true
    }
    catch {
        Write-TestLog "ERROR" "Performance test failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to run all tests
function Start-ComprehensiveTest {
    param([object]$Config)
    
    Write-TestLog "INFO" "Starting comprehensive encryption system test"
    
    $testResults = @()
    $testDir = Join-Path $Script:BackupDir "storage\local"
    $keyFile = Join-Path $Script:BackupDir $Config.storage.encryption.key_file
    
    # Ensure test directory exists
    if (-not (Test-Path $testDir)) {
        New-Item -ItemType Directory -Path $testDir -Force
    }
    
    # Ensure key directory exists
    $keyDir = Split-Path $keyFile -Parent
    if (-not (Test-Path $keyDir)) {
        New-Item -ItemType Directory -Path $keyDir -Force
    }
    
    # Test 1: Key Generation
    Write-TestLog "INFO" "=== Test 1: Key Generation ==="
    $testResults += [PSCustomObject]@{
        Test = "Key Generation"
        Result = Test-KeyGeneration -KeyFilePath $keyFile
    }
    
    # Test 2: File Encryption/Decryption
    Write-TestLog "INFO" "=== Test 2: File Encryption/Decryption ==="
    $testResults += [PSCustomObject]@{
        Test = "File Encryption/Decryption"
        Result = Test-FileEncryption -KeyFilePath $keyFile -TestDir $testDir
    }
    
    # Test 3: Encrypted Backup Creation
    Write-TestLog "INFO" "=== Test 3: Encrypted Backup Creation ==="
    $testResults += [PSCustomObject]@{
        Test = "Encrypted Backup Creation"
        Result = Test-EncryptedBackup -Config $Config -TestDir $testDir
    }
    
    # Test 4: Key Rotation
    Write-TestLog "INFO" "=== Test 4: Key Rotation ==="
    $testResults += [PSCustomObject]@{
        Test = "Key Rotation"
        Result = Test-KeyRotation -KeyFilePath $keyFile
    }
    
    # Test 5: Performance Testing
    Write-TestLog "INFO" "=== Test 5: Performance Testing ==="
    $testResults += [PSCustomObject]@{
        Test = "Performance Testing"
        Result = Test-EncryptionPerformance -KeyFilePath $keyFile -TestDir $testDir
    }
    
    # Display test summary
    Write-TestLog "INFO" "=== Test Summary ==="
    $passedTests = 0
    $totalTests = $testResults.Count
    
    foreach ($result in $testResults) {
        $status = if ($result.Result) { "PASSED" } else { "FAILED" }
        $color = if ($result.Result) { "Green" } else { "Red" }
        
        Write-Host "  $($result.Test): $status" -ForegroundColor $color
        
        if ($result.Result) {
            $passedTests++
        }
    }
    
    Write-TestLog "INFO" "Tests passed: $passedTests/$totalTests"
    
    if ($passedTests -eq $totalTests) {
        Write-TestLog "SUCCESS" "All encryption system tests passed!"
        return $true
    }
    else {
        Write-TestLog "ERROR" "Some encryption system tests failed!"
        return $false
    }
}

# Main execution
function Main {
    Write-TestLog "INFO" "Starting ProjectCars Encryption System Test"
    
    if ($Help) {
        Show-Usage
        return
    }
    
    # Load configuration
    $config = Get-TestConfiguration -ConfigPath $ConfigFile
    if (-not $config) {
        return
    }
    
    # Run comprehensive tests
    $result = Start-ComprehensiveTest -Config $config
    
    if ($result) {
        Write-TestLog "SUCCESS" "All encryption system tests completed successfully"
        exit 0
    }
    else {
        Write-TestLog "ERROR" "Some encryption system tests failed"
        exit 1
    }
}

# Run main function
Main
