# ============================================================================
# Off-Site Backup Manager for ProjectCars Database
# ============================================================================
# Description: Automated off-site backup storage with cloud integration
# Supports multiple cloud providers for redundancy
# Version: 1.0.0
# Created: 2025-07-05
# ============================================================================

param(
    [string]$Mode = "sync",
    [string]$Provider = "aws",  # aws, azure, gcp, all
    [string]$ConfigPath = "../config/offsite-config.json",
    [switch]$Verify = $false,
    [switch]$DryRun = $false,
    [switch]$SetupConfig = $false
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Split-Path -Parent $ScriptDir
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "$BackupDir\storage\logs\offsite-backup-$Timestamp.log"

function Write-OffsiteLog {
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

function New-OffsiteConfig {
    Write-OffsiteLog "INFO" "Creating off-site backup configuration"
    
    $config = @{
        enabled = $true
        retention_days = 90
        encryption_enabled = $true
        compression_enabled = $true
        providers = @{
            aws = @{
                enabled = $false
                bucket = "projectcars-backups"
                region = "us-east-1"
                access_key_id = ""
                secret_access_key = ""
                kms_key_id = ""
            }
            azure = @{
                enabled = $false
                storage_account = "projectcarsbackups"
                container = "database-backups"
                connection_string = ""
            }
            gcp = @{
                enabled = $false
                bucket = "projectcars-database-backups"
                project_id = ""
                key_file = ""
            }
            local_secondary = @{
                enabled = $true
                path = "\\\\backup-server\\projectcars"
                description = "Secondary local network storage"
            }
        }
        sync_schedule = @{
            frequency = "daily"
            time = "04:00"
            max_concurrent = 3
        }
        notifications = @{
            enabled = $true
            email = ""
            webhook = ""
        }
    }
    
    try {
        $configDir = Split-Path $ConfigPath -Parent
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        }
        
        $config | ConvertTo-Json -Depth 4 | Out-File -FilePath $ConfigPath -Encoding UTF8
        Write-OffsiteLog "SUCCESS" "Configuration template created: $ConfigPath"
        Write-OffsiteLog "INFO" "Please edit the configuration file to add your cloud provider credentials"
        
        return $true
    } catch {
        Write-OffsiteLog "ERROR" "Failed to create configuration: $($_.Exception.Message)"
        return $false
    }
}

function Get-OffsiteConfig {
    if (-not (Test-Path $ConfigPath)) {
        Write-OffsiteLog "WARN" "Configuration file not found, creating template"
        New-OffsiteConfig
        return $null
    }
    
    try {
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        Write-OffsiteLog "INFO" "Configuration loaded from: $ConfigPath"
        return $config
    } catch {
        Write-OffsiteLog "ERROR" "Failed to load configuration: $($_.Exception.Message)"
        return $null
    }
}

function Test-CloudConnectivity {
    param($ProviderConfig, $ProviderName)
    
    Write-OffsiteLog "INFO" "Testing connectivity to $ProviderName"
    
    switch ($ProviderName) {
        "aws" {
            if (-not $ProviderConfig.access_key_id -or -not $ProviderConfig.secret_access_key) {
                Write-OffsiteLog "WARN" "AWS credentials not configured"
                return $false
            }
            
            # Test AWS CLI availability
            try {
                $result = & aws --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-OffsiteLog "SUCCESS" "AWS CLI available: $($result -split "`n" | Select-Object -First 1)"
                    
                    # Test bucket access
                    $env:AWS_ACCESS_KEY_ID = $ProviderConfig.access_key_id
                    $env:AWS_SECRET_ACCESS_KEY = $ProviderConfig.secret_access_key
                    $env:AWS_DEFAULT_REGION = $ProviderConfig.region
                    
                    $listResult = & aws s3 ls s3://$($ProviderConfig.bucket) 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-OffsiteLog "SUCCESS" "AWS S3 bucket accessible: $($ProviderConfig.bucket)"
                        return $true
                    } else {
                        Write-OffsiteLog "WARN" "AWS S3 bucket not accessible (may need creation): $($ProviderConfig.bucket)"
                        return $false
                    }
                } else {
                    Write-OffsiteLog "WARN" "AWS CLI not available. Install AWS CLI for S3 integration."
                    return $false
                }
            } catch {
                Write-OffsiteLog "WARN" "AWS connectivity test failed: $($_.Exception.Message)"
                return $false
            }
        }
        
        "azure" {
            if (-not $ProviderConfig.connection_string) {
                Write-OffsiteLog "WARN" "Azure connection string not configured"
                return $false
            }
            
            try {
                $result = & az --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-OffsiteLog "SUCCESS" "Azure CLI available"
                    return $true
                } else {
                    Write-OffsiteLog "WARN" "Azure CLI not available. Install Azure CLI for blob storage integration."
                    return $false
                }
            } catch {
                Write-OffsiteLog "WARN" "Azure connectivity test failed: $($_.Exception.Message)"
                return $false
            }
        }
        
        "gcp" {
            if (-not $ProviderConfig.key_file -or -not $ProviderConfig.project_id) {
                Write-OffsiteLog "WARN" "GCP credentials not configured"
                return $false
            }
            
            try {
                $result = & gcloud --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-OffsiteLog "SUCCESS" "Google Cloud CLI available"
                    return $true
                } else {
                    Write-OffsiteLog "WARN" "Google Cloud CLI not available. Install gcloud for GCS integration."
                    return $false
                }
            } catch {
                Write-OffsiteLog "WARN" "GCP connectivity test failed: $($_.Exception.Message)"
                return $false
            }
        }
        
        "local_secondary" {
            if (-not $ProviderConfig.path) {
                Write-OffsiteLog "WARN" "Local secondary path not configured"
                return $false
            }
            
            if (Test-Path $ProviderConfig.path) {
                Write-OffsiteLog "SUCCESS" "Local secondary storage accessible: $($ProviderConfig.path)"
                return $true
            } else {
                Write-OffsiteLog "WARN" "Local secondary storage not accessible: $($ProviderConfig.path)"
                return $false
            }
        }
    }
    
    return $false
}

function Compress-BackupFile {
    param($FilePath, $OutputPath)
    
    Write-OffsiteLog "INFO" "Compressing backup: $(Split-Path $FilePath -Leaf)"
    
    try {
        # Use PowerShell's Compress-Archive
        Compress-Archive -Path $FilePath -DestinationPath $OutputPath -Force
        
        $originalSize = (Get-Item $FilePath).Length
        $compressedSize = (Get-Item $OutputPath).Length
        $compressionRatio = [math]::Round((1 - $compressedSize / $originalSize) * 100, 2)
        
        Write-OffsiteLog "SUCCESS" "Compression completed: $compressionRatio% size reduction"
        return $true
    } catch {
        Write-OffsiteLog "ERROR" "Compression failed: $($_.Exception.Message)"
        return $false
    }
}

function Sync-ToAWS {
    param($LocalFile, $Config, $DryRun = $false)
    
    $fileName = Split-Path $LocalFile -Leaf
    Write-OffsiteLog "INFO" "Syncing to AWS S3: $fileName"
    
    if ($DryRun) {
        Write-OffsiteLog "INFO" "[DRY RUN] Would upload to s3://$($Config.bucket)/$fileName"
        return $true
    }
    
    try {
        # Set AWS credentials
        $env:AWS_ACCESS_KEY_ID = $Config.access_key_id
        $env:AWS_SECRET_ACCESS_KEY = $Config.secret_access_key
        $env:AWS_DEFAULT_REGION = $Config.region
        
        # Upload with server-side encryption
        $uploadArgs = @(
            "s3", "cp", $LocalFile, "s3://$($Config.bucket)/$fileName"
        )
        
        if ($Config.kms_key_id) {
            $uploadArgs += "--sse", "aws:kms", "--sse-kms-key-id", $Config.kms_key_id
        } else {
            $uploadArgs += "--sse", "AES256"
        }
        
        $result = & aws @uploadArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-OffsiteLog "SUCCESS" "AWS S3 upload completed: $fileName"
            return $true
        } else {
            Write-OffsiteLog "ERROR" "AWS S3 upload failed: $result"
            return $false
        }
    } catch {
        Write-OffsiteLog "ERROR" "AWS S3 sync error: $($_.Exception.Message)"
        return $false
    }
}

function Sync-ToLocalSecondary {
    param($LocalFile, $Config, $DryRun = $false)
    
    $fileName = Split-Path $LocalFile -Leaf
    $destinationPath = Join-Path $Config.path $fileName
    
    Write-OffsiteLog "INFO" "Syncing to local secondary: $fileName"
    
    if ($DryRun) {
        Write-OffsiteLog "INFO" "[DRY RUN] Would copy to: $destinationPath"
        return $true
    }
    
    try {
        # Ensure destination directory exists
        $destDir = Split-Path $destinationPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $LocalFile -Destination $destinationPath -Force
        Write-OffsiteLog "SUCCESS" "Local secondary copy completed: $fileName"
        return $true
    } catch {
        Write-OffsiteLog "ERROR" "Local secondary sync failed: $($_.Exception.Message)"
        return $false
    }
}

function Verify-OffsiteBackup {
    param($LocalFile, $Provider, $Config)
    
    $fileName = Split-Path $LocalFile -Leaf
    Write-OffsiteLog "INFO" "Verifying off-site backup: $fileName ($Provider)"
    
    switch ($Provider) {
        "aws" {
            try {
                $env:AWS_ACCESS_KEY_ID = $Config.access_key_id
                $env:AWS_SECRET_ACCESS_KEY = $Config.secret_access_key
                $env:AWS_DEFAULT_REGION = $Config.region
                
                $result = & aws s3api head-object --bucket $Config.bucket --key $fileName 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    $objectInfo = $result | ConvertFrom-Json
                    Write-OffsiteLog "SUCCESS" "AWS S3 verification passed: $fileName"
                    return $true
                } else {
                    Write-OffsiteLog "ERROR" "AWS S3 verification failed: $result"
                    return $false
                }
            } catch {
                Write-OffsiteLog "ERROR" "AWS S3 verification error: $($_.Exception.Message)"
                return $false
            }
        }
        
        "local_secondary" {
            $remotePath = Join-Path $Config.path $fileName
            if (Test-Path $remotePath) {
                $localSize = (Get-Item $LocalFile).Length
                $remoteSize = (Get-Item $remotePath).Length
                
                if ($localSize -eq $remoteSize) {
                    Write-OffsiteLog "SUCCESS" "Local secondary verification passed: $fileName"
                    return $true
                } else {
                    Write-OffsiteLog "ERROR" "Local secondary size mismatch: $fileName"
                    return $false
                }
            } else {
                Write-OffsiteLog "ERROR" "Local secondary file not found: $remotePath"
                return $false
            }
        }
    }
    
    return $false
}

function Start-OffsiteSync {
    param($Config, $DryRun = $false)
    
    Write-OffsiteLog "INFO" "Starting off-site backup synchronization"
    
    # Get local backup files
    $localBackupPath = "$BackupDir\storage\local"
    if (-not (Test-Path $localBackupPath)) {
        Write-OffsiteLog "ERROR" "Local backup directory not found: $localBackupPath"
        return $false
    }
    
    $backupFiles = Get-ChildItem -Path $localBackupPath -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backupFiles.Count -eq 0) {
        Write-OffsiteLog "WARN" "No backup files found for off-site sync"
        return $true
    }
    
    Write-OffsiteLog "INFO" "Found $($backupFiles.Count) backup files for off-site sync"
    
    $syncResults = @{
        total_files = $backupFiles.Count
        successful_syncs = 0
        failed_syncs = 0
        providers_used = @()
        files = @()
    }
    
    foreach ($file in $backupFiles) {
        $fileName = $file.Name
        $filePath = $file.FullName
        
        Write-OffsiteLog "INFO" "Processing: $fileName"
        
        $fileResult = @{
            file = $fileName
            size_bytes = $file.Length
            providers = @{}
        }
        
        # Compress file if enabled
        $sourceFile = $filePath
        if ($Config.compression_enabled) {
            $compressedPath = "$localBackupPath\$($fileName).zip"
            if (Compress-BackupFile -FilePath $filePath -OutputPath $compressedPath) {
                $sourceFile = $compressedPath
                $fileResult.compressed = $true
            }
        }
        
        $fileSuccess = $false
        
        # Sync to each enabled provider
        foreach ($providerName in $Config.providers.PSObject.Properties.Name) {
            $providerConfig = $Config.providers.$providerName
            
            if (-not $providerConfig.enabled) {
                continue
            }
            
            $syncSuccess = $false
            
            switch ($providerName) {
                "aws" {
                    $syncSuccess = Sync-ToAWS -LocalFile $sourceFile -Config $providerConfig -DryRun $DryRun
                }
                "local_secondary" {
                    $syncSuccess = Sync-ToLocalSecondary -LocalFile $sourceFile -Config $providerConfig -DryRun $DryRun
                }
            }
            
            # Verify if sync was successful and verification is enabled
            if ($syncSuccess -and $Verify -and -not $DryRun) {
                $verifySuccess = Verify-OffsiteBackup -LocalFile $sourceFile -Provider $providerName -Config $providerConfig
                $fileResult.providers.$providerName = @{
                    sync_success = $syncSuccess
                    verify_success = $verifySuccess
                    overall_success = $verifySuccess
                }
            } else {
                $fileResult.providers.$providerName = @{
                    sync_success = $syncSuccess
                    verify_success = $null
                    overall_success = $syncSuccess
                }
            }
            
            if ($syncSuccess) {
                $fileSuccess = $true
                if ($syncResults.providers_used -notcontains $providerName) {
                    $syncResults.providers_used += $providerName
                }
            }
        }
        
        # Clean up compressed file if created
        if ($Config.compression_enabled -and $sourceFile -ne $filePath -and (Test-Path $sourceFile)) {
            Remove-Item $sourceFile -Force
        }
        
        if ($fileSuccess) {
            $syncResults.successful_syncs++
            Write-OffsiteLog "SUCCESS" "Off-site sync completed: $fileName"
        } else {
            $syncResults.failed_syncs++
            Write-OffsiteLog "ERROR" "Off-site sync failed: $fileName"
        }
        
        $syncResults.files += $fileResult
        Write-Host ""
    }
    
    # Generate summary report
    $reportPath = "$BackupDir\storage\logs\offsite-sync-report-$(Get-Date -Format 'yyyyMMdd').json"
    try {
        $syncResults.timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $syncResults.success_rate = [math]::Round(($syncResults.successful_syncs / $syncResults.total_files) * 100, 2)
        
        $syncResults | ConvertTo-Json -Depth 4 | Out-File -FilePath $reportPath -Encoding UTF8
        Write-OffsiteLog "SUCCESS" "Sync report saved: $reportPath"
    } catch {
        Write-OffsiteLog "ERROR" "Failed to save sync report"
    }
    
    # Display summary
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "OFF-SITE BACKUP SYNC SUMMARY" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "Total Files: $($syncResults.total_files)" -ForegroundColor White
    Write-Host "Successful: $($syncResults.successful_syncs)" -ForegroundColor Green
    Write-Host "Failed: $($syncResults.failed_syncs)" -ForegroundColor Red
    Write-Host "Providers Used: $($syncResults.providers_used -join ', ')" -ForegroundColor White
    Write-Host "Success Rate: $($syncResults.success_rate)%" -ForegroundColor $(if ($syncResults.success_rate -eq 100) { "Green" } else { "Yellow" })
    Write-Host "="*60 -ForegroundColor Cyan
    
    return ($syncResults.failed_syncs -eq 0)
}

# Main execution
Write-OffsiteLog "INFO" "Off-Site Backup Manager Starting"

# Ensure log directory exists
$logDir = Split-Path $LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

if ($SetupConfig) {
    $success = New-OffsiteConfig
    if ($success) {
        Write-OffsiteLog "SUCCESS" "Configuration setup completed"
        exit 0
    } else {
        Write-OffsiteLog "ERROR" "Configuration setup failed"
        exit 1
    }
}

$config = Get-OffsiteConfig
if (-not $config) {
    Write-OffsiteLog "ERROR" "Could not load configuration. Run with -SetupConfig to create template."
    exit 1
}

switch ($Mode) {
    "sync" {
        $success = Start-OffsiteSync -Config $config -DryRun $DryRun
        if ($success) {
            Write-OffsiteLog "SUCCESS" "Off-site synchronization completed successfully"
            exit 0
        } else {
            Write-OffsiteLog "ERROR" "Off-site synchronization completed with errors"
            exit 1
        }
    }
    
    "test" {
        Write-OffsiteLog "INFO" "Testing off-site provider connectivity"
        $allProviders = $config.providers.PSObject.Properties.Name
        $workingProviders = @()
        
        foreach ($providerName in $allProviders) {
            $providerConfig = $config.providers.$providerName
            if ($providerConfig.enabled) {
                if (Test-CloudConnectivity -ProviderConfig $providerConfig -ProviderName $providerName) {
                    $workingProviders += $providerName
                }
            }
        }
        
        Write-OffsiteLog "INFO" "Working providers: $($workingProviders -join ', ')"
        if ($workingProviders.Count -gt 0) {
            Write-OffsiteLog "SUCCESS" "At least one off-site provider is available"
            exit 0
        } else {
            Write-OffsiteLog "ERROR" "No off-site providers are available"
            exit 1
        }
    }
    
    default {
        Write-OffsiteLog "ERROR" "Unknown mode: $Mode"
        Write-Host "Usage: offsite-backup-manager.ps1 -Mode [sync|test] [options]"
        exit 1
    }
}

Write-OffsiteLog "INFO" "Off-Site Backup Manager completed" 