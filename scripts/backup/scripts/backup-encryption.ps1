# ============================================================================
# ProjectCars Backup Encryption System (PowerShell)
# ============================================================================
# Description: Comprehensive end-to-end encryption for backup data
# Author: ProjectCars Backup System
# Version: 1.0.0
# Features: AES-256-GCM encryption, secure key management, rotation
# ============================================================================

param(
    [string]$ConfigFile = "config\backup.config.json",
    [string]$Action = "encrypt",  # encrypt, decrypt, generate-key, rotate-key
    [string]$InputFile = "",
    [string]$OutputFile = "",
    [string]$KeyFile = "",
    [switch]$Force = $false,
    [switch]$Help = $false
)

# Script configuration
$Script:ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:BackupDir = Split-Path -Parent $Script:ScriptDir
$Script:Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Script:LogFile = "$Script:BackupDir\storage\logs\encryption-$Script:Timestamp.log"

# Constants
$Script:AESKeySize = 32  # 256 bits
$Script:IVSize = 16      # 128 bits
$Script:TagSize = 16     # 128 bits for GCM
$Script:SaltSize = 32    # 256 bits
$Script:KeyDerivationIterations = 100000

# Function to write log messages
function Write-EncryptionLog {
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
Usage: .\backup-encryption.ps1 [ACTION] [OPTIONS]

ACTIONS:
    encrypt          Encrypt a backup file
    decrypt          Decrypt a backup file
    generate-key     Generate a new encryption key
    rotate-key       Rotate existing encryption key

OPTIONS:
    -ConfigFile FILE    Use custom config file (default: config\backup.config.json)
    -InputFile FILE     Input file path
    -OutputFile FILE    Output file path
    -KeyFile FILE       Custom key file path
    -Force             Force overwrite existing files
    -Help              Show this help message

EXAMPLES:
    .\backup-encryption.ps1 generate-key                        # Generate new key
    .\backup-encryption.ps1 encrypt -InputFile backup.sql       # Encrypt backup
    .\backup-encryption.ps1 decrypt -InputFile backup.sql.enc   # Decrypt backup
    .\backup-encryption.ps1 rotate-key                          # Rotate key

"@ -ForegroundColor Cyan
}

# Function to load configuration
function Get-EncryptionConfiguration {
    param([string]$ConfigPath)
    
    $fullConfigPath = Join-Path $Script:BackupDir $ConfigPath
    
    if (-not (Test-Path $fullConfigPath)) {
        Write-EncryptionLog "ERROR" "Configuration file not found: $fullConfigPath"
        return $null
    }
    
    try {
        $config = Get-Content $fullConfigPath -Raw | ConvertFrom-Json
        Write-EncryptionLog "INFO" "Configuration loaded successfully"
        return $config
    }
    catch {
        Write-EncryptionLog "ERROR" "Failed to parse configuration file: $($_.Exception.Message)"
        return $null
    }
}

# Function to generate secure random bytes
function New-SecureRandomBytes {
    param([int]$Size)
    
    $bytes = New-Object byte[] $Size
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return $bytes
}

# Function to derive key from password using PBKDF2
function Get-DerivedKey {
    param(
        [string]$Password,
        [byte[]]$Salt,
        [int]$Iterations = $Script:KeyDerivationIterations
    )
    
    $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes($Password)
    $pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($passwordBytes, $Salt, $Iterations)
    $key = $pbkdf2.GetBytes($Script:AESKeySize)
    $pbkdf2.Dispose()
    return $key
}

# Function to generate encryption key
function New-EncryptionKey {
    param(
        [string]$KeyFilePath,
        [switch]$Force
    )
    
    if ((Test-Path $KeyFilePath) -and -not $Force) {
        Write-EncryptionLog "ERROR" "Key file already exists: $KeyFilePath (use -Force to overwrite)"
        return $false
    }
    
    try {
        # Generate random key
        $keyBytes = New-SecureRandomBytes $Script:AESKeySize
        
        # Create key metadata
        $keyMetadata = @{
            version = "1.0"
            algorithm = "AES-256-GCM"
            created = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            key_size = $Script:AESKeySize
            iterations = $Script:KeyDerivationIterations
        }
        
        # Save key and metadata
        $keyData = @{
            metadata = $keyMetadata
            key = [System.Convert]::ToBase64String($keyBytes)
        }
        
        $keyJson = $keyData | ConvertTo-Json -Depth 10
        $keyJson | Out-File -FilePath $KeyFilePath -Encoding UTF8
        
        # Set secure permissions (Windows)
        if ($IsWindows -or $PSVersionTable.PSVersion.Major -le 5) {
            $acl = Get-Acl $KeyFilePath
            $acl.SetAccessRuleProtection($true, $false)
            $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
                "FullControl",
                "Allow"
            )
            $acl.SetAccessRule($accessRule)
            Set-Acl -Path $KeyFilePath -AclObject $acl
        }
        
        Write-EncryptionLog "SUCCESS" "Encryption key generated successfully: $KeyFilePath"
        return $true
    }
    catch {
        Write-EncryptionLog "ERROR" "Failed to generate encryption key: $($_.Exception.Message)"
        return $false
    }
}

# Function to load encryption key
function Get-EncryptionKey {
    param([string]$KeyFilePath)
    
    if (-not (Test-Path $KeyFilePath)) {
        Write-EncryptionLog "ERROR" "Key file not found: $KeyFilePath"
        return $null
    }
    
    try {
        $keyData = Get-Content $KeyFilePath -Raw | ConvertFrom-Json
        $keyBytes = [System.Convert]::FromBase64String($keyData.key)
        
        Write-EncryptionLog "INFO" "Encryption key loaded successfully"
        return $keyBytes
    }
    catch {
        Write-EncryptionLog "ERROR" "Failed to load encryption key: $($_.Exception.Message)"
        return $null
    }
}

# Function to encrypt file using AES-256-GCM
function Invoke-FileEncryption {
    param(
        [string]$InputFilePath,
        [string]$OutputFilePath,
        [byte[]]$Key
    )
    
    if (-not (Test-Path $InputFilePath)) {
        Write-EncryptionLog "ERROR" "Input file not found: $InputFilePath"
        return $false
    }
    
    try {
        # Read input file
        $inputData = [System.IO.File]::ReadAllBytes($InputFilePath)
        Write-EncryptionLog "INFO" "Read input file: $([math]::Round($inputData.Length / 1MB, 2)) MB"
        
        # Generate IV and additional data
        $iv = New-SecureRandomBytes $Script:IVSize
        $additionalData = [System.Text.Encoding]::UTF8.GetBytes("ProjectCars-Backup-v1.0")
        
        # Initialize AES-GCM
        $aes = [System.Security.Cryptography.AesCcm]::new($Key)
        $tag = New-Object byte[] $Script:TagSize
        $ciphertext = New-Object byte[] $inputData.Length
        
        # Encrypt data
        $aes.Encrypt($iv, $inputData, $ciphertext, $tag, $additionalData)
        $aes.Dispose()
        
        # Create encrypted file format
        $encryptedData = New-Object System.Collections.Generic.List[byte]
        $encryptedData.AddRange([System.Text.Encoding]::UTF8.GetBytes("PCBACKUP"))  # Magic header
        $encryptedData.AddRange([System.BitConverter]::GetBytes([uint32]1))          # Version
        $encryptedData.AddRange([System.BitConverter]::GetBytes([uint32]$iv.Length))
        $encryptedData.AddRange($iv)
        $encryptedData.AddRange([System.BitConverter]::GetBytes([uint32]$tag.Length))
        $encryptedData.AddRange($tag)
        $encryptedData.AddRange([System.BitConverter]::GetBytes([uint32]$ciphertext.Length))
        $encryptedData.AddRange($ciphertext)
        
        # Write encrypted file
        [System.IO.File]::WriteAllBytes($OutputFilePath, $encryptedData.ToArray())
        
        Write-EncryptionLog "SUCCESS" "File encrypted successfully: $OutputFilePath"
        Write-EncryptionLog "INFO" "Compressed size: $([math]::Round($encryptedData.Count / 1MB, 2)) MB"
        
        return $true
    }
    catch {
        Write-EncryptionLog "ERROR" "Failed to encrypt file: $($_.Exception.Message)"
        return $false
    }
}

# Function to decrypt file using AES-256-GCM
function Invoke-FileDecryption {
    param(
        [string]$InputFilePath,
        [string]$OutputFilePath,
        [byte[]]$Key
    )
    
    if (-not (Test-Path $InputFilePath)) {
        Write-EncryptionLog "ERROR" "Input file not found: $InputFilePath"
        return $false
    }
    
    try {
        # Read encrypted file
        $encryptedData = [System.IO.File]::ReadAllBytes($InputFilePath)
        
        # Parse encrypted file format
        $offset = 0
        $magic = [System.Text.Encoding]::UTF8.GetString($encryptedData, $offset, 8)
        $offset += 8
        
        if ($magic -ne "PCBACKUP") {
            Write-EncryptionLog "ERROR" "Invalid encrypted file format"
            return $false
        }
        
        $version = [System.BitConverter]::ToUInt32($encryptedData, $offset)
        $offset += 4
        
        $ivLength = [System.BitConverter]::ToUInt32($encryptedData, $offset)
        $offset += 4
        $iv = $encryptedData[$offset..($offset + $ivLength - 1)]
        $offset += $ivLength
        
        $tagLength = [System.BitConverter]::ToUInt32($encryptedData, $offset)
        $offset += 4
        $tag = $encryptedData[$offset..($offset + $tagLength - 1)]
        $offset += $tagLength
        
        $ciphertextLength = [System.BitConverter]::ToUInt32($encryptedData, $offset)
        $offset += 4
        $ciphertext = $encryptedData[$offset..($offset + $ciphertextLength - 1)]
        
        # Decrypt data
        $additionalData = [System.Text.Encoding]::UTF8.GetBytes("ProjectCars-Backup-v1.0")
        $aes = [System.Security.Cryptography.AesCcm]::new($Key)
        $plaintext = New-Object byte[] $ciphertext.Length
        
        $aes.Decrypt($iv, $ciphertext, $tag, $plaintext, $additionalData)
        $aes.Dispose()
        
        # Write decrypted file
        [System.IO.File]::WriteAllBytes($OutputFilePath, $plaintext)
        
        Write-EncryptionLog "SUCCESS" "File decrypted successfully: $OutputFilePath"
        Write-EncryptionLog "INFO" "Decrypted size: $([math]::Round($plaintext.Length / 1MB, 2)) MB"
        
        return $true
    }
    catch {
        Write-EncryptionLog "ERROR" "Failed to decrypt file: $($_.Exception.Message)"
        return $false
    }
}

# Function to rotate encryption key
function Invoke-KeyRotation {
    param(
        [string]$KeyFilePath,
        [string]$BackupDir
    )
    
    try {
        # Backup current key
        $backupKeyPath = "$KeyFilePath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        if (Test-Path $KeyFilePath) {
            Copy-Item $KeyFilePath $backupKeyPath
            Write-EncryptionLog "INFO" "Current key backed up to: $backupKeyPath"
        }
        
        # Generate new key
        $result = New-EncryptionKey -KeyFilePath $KeyFilePath -Force
        
        if ($result) {
            Write-EncryptionLog "SUCCESS" "Key rotation completed successfully"
            Write-EncryptionLog "WARN" "Remember to re-encrypt existing backups with the new key"
            return $true
        }
        else {
            Write-EncryptionLog "ERROR" "Key rotation failed"
            return $false
        }
    }
    catch {
        Write-EncryptionLog "ERROR" "Key rotation failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test encryption/decryption
function Test-EncryptionSystem {
    param(
        [string]$KeyFilePath,
        [string]$TestDir
    )
    
    Write-EncryptionLog "INFO" "Starting encryption system test"
    
    try {
        # Create test file
        $testFile = Join-Path $TestDir "encryption-test.txt"
        $testData = "ProjectCars Backup Encryption Test - $(Get-Date)"
        $testData | Out-File -FilePath $testFile -Encoding UTF8
        
        # Encrypt test file
        $encryptedFile = "$testFile.enc"
        $key = Get-EncryptionKey -KeyFilePath $KeyFilePath
        
        if (-not $key) {
            return $false
        }
        
        $encryptResult = Invoke-FileEncryption -InputFilePath $testFile -OutputFilePath $encryptedFile -Key $key
        
        if (-not $encryptResult) {
            return $false
        }
        
        # Decrypt test file
        $decryptedFile = "$testFile.dec"
        $decryptResult = Invoke-FileDecryption -InputFilePath $encryptedFile -OutputFilePath $decryptedFile -Key $key
        
        if (-not $decryptResult) {
            return $false
        }
        
        # Verify decrypted content
        $originalContent = Get-Content $testFile -Raw
        $decryptedContent = Get-Content $decryptedFile -Raw
        
        if ($originalContent -eq $decryptedContent) {
            Write-EncryptionLog "SUCCESS" "Encryption system test passed"
            
            # Clean up test files
            Remove-Item $testFile, $encryptedFile, $decryptedFile -Force
            
            return $true
        }
        else {
            Write-EncryptionLog "ERROR" "Encryption system test failed: content mismatch"
            return $false
        }
    }
    catch {
        Write-EncryptionLog "ERROR" "Encryption system test failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
function Main {
    Write-EncryptionLog "INFO" "Starting ProjectCars Backup Encryption System"
    
    if ($Help) {
        Show-Usage
        return
    }
    
    # Load configuration
    $config = Get-EncryptionConfiguration -ConfigPath $ConfigFile
    if (-not $config) {
        return
    }
    
    # Get encryption settings
    $encryptionConfig = $config.storage.encryption
    $defaultKeyFile = Join-Path $Script:BackupDir $encryptionConfig.key_file
    
    if (-not $KeyFile) {
        $KeyFile = $defaultKeyFile
    }
    
    # Execute action
    switch ($Action.ToLower()) {
        "generate-key" {
            $result = New-EncryptionKey -KeyFilePath $KeyFile -Force:$Force
            if ($result) {
                # Test the new key
                Test-EncryptionSystem -KeyFilePath $KeyFile -TestDir (Join-Path $Script:BackupDir "storage\local")
            }
        }
        
        "encrypt" {
            if (-not $InputFile) {
                Write-EncryptionLog "ERROR" "Input file required for encryption"
                return
            }
            
            if (-not $OutputFile) {
                $OutputFile = "$InputFile.enc"
            }
            
            $key = Get-EncryptionKey -KeyFilePath $KeyFile
            if ($key) {
                Invoke-FileEncryption -InputFilePath $InputFile -OutputFilePath $OutputFile -Key $key
            }
        }
        
        "decrypt" {
            if (-not $InputFile) {
                Write-EncryptionLog "ERROR" "Input file required for decryption"
                return
            }
            
            if (-not $OutputFile) {
                $OutputFile = $InputFile -replace '\.enc$', ''
            }
            
            $key = Get-EncryptionKey -KeyFilePath $KeyFile
            if ($key) {
                Invoke-FileDecryption -InputFilePath $InputFile -OutputFilePath $OutputFile -Key $key
            }
        }
        
        "rotate-key" {
            Invoke-KeyRotation -KeyFilePath $KeyFile -BackupDir $Script:BackupDir
        }
        
        "test" {
            if (-not (Test-Path $KeyFile)) {
                Write-EncryptionLog "ERROR" "Key file not found. Generate key first."
                return
            }
            
            Test-EncryptionSystem -KeyFilePath $KeyFile -TestDir (Join-Path $Script:BackupDir "storage\local")
        }
        
        default {
            Write-EncryptionLog "ERROR" "Invalid action: $Action"
            Show-Usage
        }
    }
    
    Write-EncryptionLog "INFO" "ProjectCars Backup Encryption System completed"
}

# Run main function
Main
