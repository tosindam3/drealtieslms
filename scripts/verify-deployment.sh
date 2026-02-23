#!/bin/bash

# DrealtiesFX Academy - Deployment Verification Script
# Run this after deployment to verify everything is working

set -e

echo "🔍 Verifying DrealtiesFX Academy Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="SAVE KEY/open_key"
SSH_PORT=65002
SSH_USER="u416132331"
SSH_HOST="178.16.128.142"
DOMAIN="drealtiesfx.com"
SITE_URL="https://www.drealtiesfx.com"

# Function to run SSH command
run_ssh() {
    ssh -i "$SSH_KEY" -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "$1"
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "1️⃣  Checking .env file..."
if run_ssh "[ -f domains/${DOMAIN}/backend/.env ]"; then
    print_status 0 ".env file exists"
else
    print_status 1 ".env file missing!"
    exit 1
fi

echo ""
echo "2️⃣  Checking .htaccess file..."
if run_ssh "[ -f domains/${DOMAIN}/public_html/.htaccess ]"; then
    print_status 0 ".htaccess file exists"
else
    print_status 1 ".htaccess file missing!"
    exit 1
fi

echo ""
echo "3️⃣  Checking storage directories..."
STORAGE_DIRS=(
    "storage/framework/sessions"
    "storage/framework/views"
    "storage/framework/cache/data"
    "storage/logs"
    "storage/app/public"
    "bootstrap/cache"
)

for dir in "${STORAGE_DIRS[@]}"; do
    if run_ssh "[ -d domains/${DOMAIN}/backend/${dir} ]"; then
        print_status 0 "${dir} exists"
    else
        print_status 1 "${dir} missing!"
    fi
done

echo ""
echo "4️⃣  Checking file permissions..."
PERMS=$(run_ssh "stat -c '%a' domains/${DOMAIN}/backend/storage" 2>/dev/null || echo "000")
if [ "$PERMS" = "775" ] || [ "$PERMS" = "777" ]; then
    print_status 0 "Storage permissions: ${PERMS}"
else
    print_status 1 "Storage permissions incorrect: ${PERMS} (should be 775)"
fi

echo ""
echo "5️⃣  Checking Laravel configuration..."
VERSION=$(run_ssh "cd domains/${DOMAIN}/backend && php artisan --version 2>/dev/null" || echo "ERROR")
if [[ $VERSION == *"Laravel"* ]]; then
    print_status 0 "Laravel: ${VERSION}"
else
    print_status 1 "Laravel not responding"
fi

echo ""
echo "6️⃣  Checking API endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/api/health" || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    print_status 0 "API responding: HTTP ${API_RESPONSE}"
else
    print_status 1 "API not responding: HTTP ${API_RESPONSE}"
fi

echo ""
echo "7️⃣  Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/" || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    print_status 0 "Frontend responding: HTTP ${FRONTEND_RESPONSE}"
    
    # Check if it's actually HTML (not JSON)
    CONTENT_TYPE=$(curl -s -I "${SITE_URL}/" | grep -i "content-type" | grep -i "html" || echo "")
    if [ -n "$CONTENT_TYPE" ]; then
        print_status 0 "Frontend serving HTML (not JSON)"
    else
        print_status 1 "Frontend might be serving JSON instead of HTML"
    fi
else
    print_status 1 "Frontend not responding: HTTP ${FRONTEND_RESPONSE}"
fi

echo ""
echo "8️⃣  Checking latest deployment files..."
LATEST_JS=$(run_ssh "ls -t domains/${DOMAIN}/public_html/assets/index-*.js 2>/dev/null | head -1" || echo "")
if [ -n "$LATEST_JS" ]; then
    FILE_DATE=$(run_ssh "stat -c '%y' ${LATEST_JS}" | cut -d' ' -f1,2 | cut -d'.' -f1)
    print_status 0 "Latest JS file: $(basename ${LATEST_JS}) (${FILE_DATE})"
else
    print_status 1 "No JS files found"
fi

echo ""
echo "9️⃣  Checking Laravel logs for recent errors..."
ERROR_COUNT=$(run_ssh "tail -100 domains/${DOMAIN}/backend/storage/logs/laravel.log 2>/dev/null | grep -c 'ERROR' || echo 0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_status 0 "No recent errors in Laravel logs"
else
    print_status 1 "${ERROR_COUNT} errors found in recent logs"
    echo -e "${YELLOW}   Run: ssh and check storage/logs/laravel.log${NC}"
fi

echo ""
echo "🔟  Checking cache status..."
CONFIG_CACHED=$(run_ssh "[ -f domains/${DOMAIN}/backend/bootstrap/cache/config.php ] && echo 'yes' || echo 'no'")
ROUTES_CACHED=$(run_ssh "[ -f domains/${DOMAIN}/backend/bootstrap/cache/routes-v7.php ] && echo 'yes' || echo 'no'")

if [ "$CONFIG_CACHED" = "yes" ]; then
    print_status 0 "Config cached"
else
    print_status 1 "Config not cached"
fi

if [ "$ROUTES_CACHED" = "yes" ]; then
    print_status 0 "Routes cached"
else
    print_status 1 "Routes not cached"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment verification complete!${NC}"
echo ""
echo "🌐 Site URL: ${SITE_URL}"
echo "📊 Admin: admin@drealtiesfx.com / password123"
echo ""
echo "💡 If issues persist:"
echo "   1. Clear browser cache (Ctrl+Shift+R)"
echo "   2. Check GitHub Actions: https://github.com/tosindam3/drealtieslms/actions"
echo "   3. Review DEVOPS_RUNBOOK.md for troubleshooting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
