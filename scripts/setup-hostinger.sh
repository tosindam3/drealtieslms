#!/bin/bash

################################################################################
# DrealtiesFX Academy - Initial Hostinger Setup Script
# Purpose: Automate initial server setup and configuration
# Usage: bash setup-hostinger.sh
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}DrealtiesFX Academy - Hostinger Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Gather user input
read -p "Enter Hostinger SSH host: " SSH_HOST
read -p "Enter SSH username: " SSH_USER
read -sp "Enter SSH password: " SSH_PASSWORD
echo ""
read -p "Enter domain name (e.g., academy.com): " DOMAIN
read -p "Enter database name: " DB_NAME
read -p "Enter database username: " DB_USER
read -sp "Enter database password: " DB_PASSWORD
echo ""

echo -e "\n${YELLOW}⚙️  Configuration Summary:${NC}"
echo "SSH Host: $SSH_HOST"
echo "SSH User: $SSH_USER"
echo "Domain: $DOMAIN"
echo "Database: $DB_NAME"
echo ""

read -p "Proceed with setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Setup cancelled${NC}"
    exit 1
fi

# SSH command helper
run_ssh() {
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$1"
}

scp_upload() {
    sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$SSH_USER@$SSH_HOST:$2"
}

echo -e "\n${YELLOW}📁 Setting up directory structure...${NC}"
run_ssh "mkdir -p ~/academy-api
mkdir -p ~/storage/logs
mkdir -p ~/storage/app
mkdir -p ~/storage/cache
mkdir -p ~/public_html/dist
mkdir -p ~/backups"

echo -e "${GREEN}✓ Directories created${NC}"

echo -e "\n${YELLOW}🔐 Setting permissions...${NC}"
run_ssh "chmod 755 ~/academy-api
chmod 755 ~/public_html
chmod 755 ~/storage
chmod 755 ~/backups"

echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "\n${YELLOW}📦 Installing PHP dependencies...${NC}"
run_ssh "cd ~/academy-api && composer install --no-dev --optimize-autoloader"

echo -e "${GREEN}✓ Composer dependencies installed${NC}"

echo -e "\n${YELLOW}⚙️  Configuring Laravel environment...${NC}"

# Create .env file
ENV_CONTENT="APP_NAME='DrealtiesFX Academy'
APP_ENV=production
APP_KEY=base64:$(openssl rand -base64 32)
APP_DEBUG=false
APP_URL=https://$DOMAIN

LOG_CHANNEL=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_DRIVER=sync

SANCTUM_STATEFUL_DOMAINS=$DOMAIN,www.$DOMAIN

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=

STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

GEMINI_API_KEY="

echo "$ENV_CONTENT" | sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cat > ~/academy-api/.env"

echo -e "${GREEN}✓ .env file created${NC}"

echo -e "\n${YELLOW}🗄️  Running database migrations...${NC}"
run_ssh "cd ~/academy-api && php artisan migrate --force"

echo -e "${GREEN}✓ Migrations completed${NC}"

echo -e "\n${YELLOW}🔧 Optimizing application...${NC}"
run_ssh "cd ~/academy-api && php artisan config:cache && php artisan route:cache && php artisan view:cache"

echo -e "${GREEN}✓ Application optimized${NC}"

echo -e "\n${YELLOW}📜 Creating cron jobs...${NC}"
run_ssh "(crontab -l 2>/dev/null; echo '0 * * * * cd ~/academy-api && php artisan schedule:run >> /dev/null 2>&1') | crontab -"

echo -e "${GREEN}✓ Cron jobs configured${NC}"

echo -e "\n${YELLOW}📝 Creating .htaccess files...${NC}"

# Frontend .htaccess
FRONTEND_HTACCESS="<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # Exclude /api calls
    RewriteRule ^api/ - [L]
    
    # Route all requests to index.html for SPA
    RewriteRule . /index.html [L]
</IfModule>"

# API .htaccess
API_HTACCESS="<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On
    RewriteCond %{HTTP:Authorization} .
    RewriteRule ^ - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [L]
</IfModule>"

echo "$FRONTEND_HTACCESS" | sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cat > ~/public_html/.htaccess"
echo "$API_HTACCESS" | sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "cat > ~/academy-api/public/.htaccess"

echo -e "${GREEN}✓ .htaccess files created${NC}"

echo -e "\n${YELLOW}✅ Initial setup completed!${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo "1. Update GitHub Secrets with these values:"
echo "   - SSH_HOST: $SSH_HOST"
echo "   - SSH_USER: $SSH_USER"
echo "   - SSH_PASSWORD: $SSH_PASSWORD"
echo "   - DB_HOST: localhost"
echo "   - DB_DATABASE: $DB_NAME"
echo "   - DB_USERNAME: $DB_USER"
echo "   - DB_PASSWORD: $DB_PASSWORD"
echo ""
echo "2. Push to GitHub main branch"
echo "3. Verify GitHub Actions workflows execute successfully"
echo "4. Test your application at https://$DOMAIN"
echo ""
echo -e "${BLUE}========================================${NC}\n"
