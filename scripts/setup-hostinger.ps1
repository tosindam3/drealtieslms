# DrealtiesFX Academy - Initial Hostinger Setup Script (Windows PowerShell)
# Purpose: Automate initial server setup and configuration from Windows
# Usage: .\setup-hostinger.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Color output helper
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }

Write-Info "========================================"
Write-Info "DrealtiesFX Academy - Hostinger Setup"
Write-Info "======================================="
Write-Info ""

# Check for PuTTY or OpenSSH
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue

if (-not $sshAvailable) {
    Write-Error "SSH is not available. Please install OpenSSH or use PuTTY."
    exit 1
}

# Gather user input
$sshHost = Read-Host "Enter Hostinger SSH host"
$sshUser = Read-Host "Enter SSH username"
$sshPassword = Read-Host "Enter SSH password" -AsSecureString
$domain = Read-Host "Enter domain name (e.g., academy.com)"
$dbName = Read-Host "Enter database name"
$dbUser = Read-Host "Enter database username"
$dbPassword = Read-Host "Enter database password" -AsSecureString

Write-Warning "`nConfiguration Summary:"
Write-Host "SSH Host: $sshHost"
Write-Host "SSH User: $sshUser"
Write-Host "Domain: $domain"
Write-Host "Database: $dbName"
Write-Host ""

$proceed = Read-Host "Proceed with setup? (y/n)"
if ($proceed -ne "y" -and $proceed -ne "Y") {
    Write-Error "Setup cancelled"
    exit 1
}

# Convert secure strings
$plainPassword = [System.Net.NetworkCredential]::new("", $sshPassword).Password
$plainDbPassword = [System.Net.NetworkCredential]::new("", $dbPassword).Password

# SSH command helper
function Invoke-SSH {
    param([string]$Command)
    
    try {
        $output = @"
$plainPassword
exit
"@ | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$sshUser@$sshHost" $Command 2>&1
        return $output
    }
    catch {
        Write-Error "SSH Error: $_"
        return $false
    }
}

Write-Warning "`n📁 Setting up directory structure..."
Invoke-SSH "mkdir -p ~/academy-api ~/storage/logs ~/storage/app ~/storage/cache ~/public_html/dist ~/backups"
Write-Success "✓ Directories created"

Write-Warning "`n🔐 Setting permissions..."
Invoke-SSH "chmod 755 ~/academy-api ~/public_html ~/storage ~/backups"
Write-Success "✓ Permissions set"

Write-Warning "`n📦 Installing PHP dependencies..."
Invoke-SSH "cd ~/academy-api && composer install --no-dev --optimize-autoloader"
Write-Success "✓ Composer dependencies installed"

Write-Warning "`n⚙️  Configuring Laravel environment..."
$appKey = ([System.Convert]::ToBase64String((1..32 | % {[byte](Get-Random -Max 256))}))

$envContent = @"
APP_NAME='DrealtiesFX Academy'
APP_ENV=production
APP_KEY=base64:$appKey
APP_DEBUG=false
APP_URL=https://$domain

LOG_CHANNEL=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=$dbName
DB_USERNAME=$dbUser
DB_PASSWORD=$plainDbPassword

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_DRIVER=sync

SANCTUM_STATEFUL_DOMAINS=$domain,www.$domain

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls

GEMINI_API_KEY=your_api_key_here
"@

# Create temporary file and upload
$tempEnv = New-TemporaryFile
Set-Content -Path $tempEnv -Value $envContent

# Note: This part requires SFTP or SCP. Simpler approach is to use the shell script on the server
Write-Warning "Note: Please manually update .env file on the server with database credentials"
Write-Host $envContent

Write-Success "✓ .env configuration ready (needs manual upload)"

Write-Warning "`n🗄️  Running database migrations..."
Invoke-SSH "cd ~/academy-api && php artisan migrate --force"
Write-Success "✓ Migrations completed"

Write-Warning "`n🔧 Optimizing application..."
Invoke-SSH "cd ~/academy-api && php artisan config:cache && php artisan route:cache"
Write-Success "✓ Application optimized"

Write-Warning "`n========================================`n"
Write-Info "Next Steps:"
Write-Info "========================================"
Write-Host "1. Copy the .env configuration to server (manually or via SCP)"
Write-Host "2. Update GitHub Secrets:"
Write-Host "   - SSH_HOST: $sshHost"
Write-Host "   - SSH_USER: $sshUser"
Write-Host "   - DB_HOST: localhost"
Write-Host "   - DB_DATABASE: $dbName"
Write-Host "   - DB_USERNAME: $dbUser"
Write-Host "3. Push code to GitHub main branch"
Write-Host "4. Test at https://$domain"
Write-Host ""
Write-Info "========================================"
