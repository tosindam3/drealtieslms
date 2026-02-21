#!/bin/bash

################################################################################
# Hostinger Shared Hosting Deployment Script
# React + Laravel Monorepo
# 
# Usage:
#   First deployment: ./deploy.sh --first-time
#   Updates:          ./deploy.sh
#   Rollback:         ./deploy.sh --rollback
################################################################################

set -e  # Exit on error

################################################################################
# CONFIGURATION - EDIT THESE VALUES
################################################################################

DOMAIN="www.drealtiesfx.com"
APP_NAME="Drealtiesfx-Academy"
REPO_SSH="git@github.com:babatotech/Drealtiesfx_Academy.git"
BRANCH="staging"  # Change to "main" after testing

# Database credentials - UPDATE THESE AFTER CREATING DATABASE IN HOSTINGER
DB_HOST="localhost"
DB_NAME="u416132331_drealtiefx"  # Your database name from hPanel
DB_USER="u416132331_admin"        # Your database user from hPanel
DB_PASS="YOUR_DATABASE_PASSWORD"  # Your database password from hPanel

# Paths (usually don't need to change these)
HOME_DIR="${HOME}"
APP_DIR="${HOME_DIR}/apps/${APP_NAME}"
PUBLIC_HTML="${HOME_DIR}/public_html"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIST="${APP_DIR}/dist"

# Build frontend on server? (true/false)
# Set to false if Node.js not available - build locally instead
BUILD_FRONTEND_ON_SERVER=false

# Use symlink or rsync? (symlink/rsync)
# Try symlink first, use rsync if symlinks not supported
DEPLOY_METHOD="rsync"

################################################################################
# COLORS FOR OUTPUT
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# HELPER FUNCTIONS
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        log_success "$1 is available"
        return 0
    else
        log_warning "$1 is not available"
        return 1
    fi
}

################################################################################
# VALIDATION CHECKS
################################################################################

validate_environment() {
    log_info "Validating environment..."
    
    # Check PHP
    if ! check_command php; then
        log_error "PHP is required but not found"
        exit 1
    fi
    
    PHP_VERSION=$(php -r "echo PHP_VERSION;" | cut -d. -f1,2)
    log_info "PHP version: ${PHP_VERSION}"
    
    # Check Composer
    if ! check_command composer; then
        log_error "Composer is required but not found"
        exit 1
    fi
    
    # Check Git
    if ! check_command git; then
        log_error "Git is required but not found"
        exit 1
    fi
    
    # Check Node (optional)
    if check_command node; then
        NODE_VERSION=$(node -v)
        log_info "Node.js version: ${NODE_VERSION}"
    else
        if [ "$BUILD_FRONTEND_ON_SERVER" = true ]; then
            log_error "BUILD_FRONTEND_ON_SERVER is true but Node.js not found"
            exit 1
        fi
    fi
    
    log_success "Environment validation passed"
}

################################################################################
# FIRST-TIME DEPLOYMENT
################################################################################

first_time_deployment() {
    log_info "Starting first-time deployment..."
    
    # Backup existing public_html
    if [ "$(ls -A $PUBLIC_HTML)" ]; then
        log_warning "public_html is not empty. Creating backup..."
        BACKUP_DIR="${HOME_DIR}/backups/public_html_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r ${PUBLIC_HTML}/* "$BACKUP_DIR/" 2>/dev/null || true
        log_success "Backup created at: $BACKUP_DIR"
        
        log_warning "Clearing public_html..."
        rm -rf ${PUBLIC_HTML}/*
        rm -rf ${PUBLIC_HTML}/.htaccess
    fi
    
    # Create apps directory
    mkdir -p "${HOME_DIR}/apps"
    
    # Clone repository
    if [ -d "$APP_DIR" ]; then
        log_warning "App directory already exists. Removing..."
        rm -rf "$APP_DIR"
    fi
    
    log_info "Cloning repository..."
    cd "${HOME_DIR}/apps"
    git clone "$REPO_SSH" "$APP_NAME"
    cd "$APP_DIR"
    git checkout "$BRANCH"
    log_success "Repository cloned"
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Deploy to public_html
    deploy_to_public_html
    
    # Run migrations
    log_info "Running database migrations..."
    cd "$BACKEND_DIR"
    php artisan migrate --force
    log_success "Migrations completed"
    
    # Final validation
    validate_deployment
    
    log_success "First-time deployment completed!"
    log_info "Visit https://${DOMAIN} to see your application"
}

################################################################################
# BACKEND SETUP
################################################################################

setup_backend() {
    log_info "Setting up Laravel backend..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log_info "Installing Composer dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
    
    # Create .env if doesn't exist
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cp .env.example .env
        
        # Update .env with production values
        sed -i "s|APP_ENV=.*|APP_ENV=production|g" .env
        sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|g" .env
        sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|g" .env
        
        sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST}|g" .env
        sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|g" .env
        sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USER}|g" .env
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|g" .env
        
        # Generate app key
        php artisan key:generate
        log_success ".env file created and configured"
    else
        log_info ".env file already exists, skipping creation"
    fi
    
    # Set permissions
    chmod 644 .env
    chmod -R 775 storage bootstrap/cache 2>/dev/null || true
    
    # Create storage link
    if [ ! -L public/storage ]; then
        log_info "Creating storage link..."
        php artisan storage:link
    fi
    
    # Clear caches
    log_info "Clearing caches..."
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan cache:clear
    
    # Cache config and routes
    log_info "Caching configuration..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    log_success "Backend setup completed"
}

################################################################################
# FRONTEND SETUP
################################################################################

setup_frontend() {
    log_info "Setting up React frontend..."
    
    cd "$APP_DIR"
    
    if [ "$BUILD_FRONTEND_ON_SERVER" = true ]; then
        log_info "Building frontend on server..."
        npm ci --production
        npm run build
        log_success "Frontend built successfully"
    else
        log_info "Skipping frontend build (BUILD_FRONTEND_ON_SERVER=false)"
        log_warning "Make sure dist/ folder is committed or uploaded manually"
    fi
    
    # Copy frontend build to Laravel public
    if [ -d "$FRONTEND_DIST" ]; then
        log_info "Copying frontend assets to Laravel public..."
        cp -r ${FRONTEND_DIST}/* ${BACKEND_DIR}/public/
        log_success "Frontend assets copied"
    else
        log_error "Frontend dist folder not found at: $FRONTEND_DIST"
        log_error "Build frontend locally and commit dist/ folder, or set BUILD_FRONTEND_ON_SERVER=true"
        exit 1
    fi
    
    # Create .htaccess for SPA routing
    create_htaccess
    
    # Add Laravel fallback route
    add_spa_fallback_route
}

################################################################################
# CREATE .HTACCESS
################################################################################

create_htaccess() {
    log_info "Creating .htaccess for SPA routing..."
    
    cat > ${BACKEND_DIR}/public/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send API requests to Laravel
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]

    # Send storage requests to Laravel
    RewriteCond %{REQUEST_URI} ^/storage/
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]

    # Handle Front Controller for other requests
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Disable directory browsing
Options -Indexes

# Prevent access to sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
EOF
    
    chmod 644 ${BACKEND_DIR}/public/.htaccess
    log_success ".htaccess created"
}

################################################################################
# ADD SPA FALLBACK ROUTE
################################################################################

add_spa_fallback_route() {
    log_info "Checking Laravel SPA fallback route..."
    
    ROUTES_FILE="${BACKEND_DIR}/routes/web.php"
    
    # Check if fallback route already exists
    if grep -q "SPA fallback" "$ROUTES_FILE"; then
        log_info "SPA fallback route already exists"
    else
        log_info "Adding SPA fallback route to routes/web.php..."
        cat >> "$ROUTES_FILE" << 'EOF'

// SPA fallback - must be last route
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api|storage).*$');
EOF
        log_success "SPA fallback route added"
    fi
}

################################################################################
# DEPLOY TO PUBLIC_HTML
################################################################################

deploy_to_public_html() {
    log_info "Deploying to public_html..."
    
    if [ "$DEPLOY_METHOD" = "symlink" ]; then
        log_info "Using symlink method..."
        
        # Test if symlinks work
        ln -sfn ${BACKEND_DIR}/public/* ${PUBLIC_HTML}/ 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Symlink created successfully"
        else
            log_warning "Symlink failed, falling back to rsync"
            DEPLOY_METHOD="rsync"
        fi
    fi
    
    if [ "$DEPLOY_METHOD" = "rsync" ]; then
        log_info "Using rsync method..."
        rsync -av --delete ${BACKEND_DIR}/public/ ${PUBLIC_HTML}/
        log_success "Files synced to public_html"
    fi
}

################################################################################
# UPDATE DEPLOYMENT
################################################################################

update_deployment() {
    log_info "Starting update deployment..."
    
    # Check if app exists
    if [ ! -d "$APP_DIR" ]; then
        log_error "App directory not found. Run with --first-time flag first."
        exit 1
    fi
    
    # Pull latest code
    log_info "Pulling latest code from Git..."
    cd "$APP_DIR"
    
    # Stash any local changes
    git stash
    
    # Pull updates
    git fetch origin
    git pull origin "$BRANCH"
    
    log_success "Code updated"
    
    # Update backend
    cd "$BACKEND_DIR"
    
    log_info "Updating Composer dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
    
    # Run migrations
    log_info "Running migrations..."
    php artisan migrate --force
    
    # Clear and rebuild caches
    log_info "Clearing caches..."
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan cache:clear
    
    log_info "Rebuilding caches..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    # Update frontend if needed
    if [ "$BUILD_FRONTEND_ON_SERVER" = true ]; then
        log_info "Rebuilding frontend..."
        cd "$APP_DIR"
        npm ci --production
        npm run build
    fi
    
    # Copy frontend to public
    if [ -d "$FRONTEND_DIST" ]; then
        log_info "Updating frontend assets..."
        cp -r ${FRONTEND_DIST}/* ${BACKEND_DIR}/public/
    fi
    
    # Redeploy to public_html
    deploy_to_public_html
    
    # Validate
    validate_deployment
    
    log_success "Update deployment completed!"
}

################################################################################
# ROLLBACK
################################################################################

rollback_deployment() {
    log_info "Starting rollback..."
    
    cd "$APP_DIR"
    
    # Show recent commits
    log_info "Recent commits:"
    git log --oneline -10
    
    echo ""
    read -p "Enter commit hash to rollback to: " COMMIT_HASH
    
    if [ -z "$COMMIT_HASH" ]; then
        log_error "No commit hash provided"
        exit 1
    fi
    
    # Confirm
    read -p "Are you sure you want to rollback to $COMMIT_HASH? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    # Rollback
    log_info "Rolling back to $COMMIT_HASH..."
    git reset --hard "$COMMIT_HASH"
    
    # Update deployment
    update_deployment
    
    log_success "Rollback completed!"
}

################################################################################
# VALIDATION
################################################################################

validate_deployment() {
    log_info "Validating deployment..."
    
    # Check Laravel
    cd "$BACKEND_DIR"
    
    log_info "Laravel version: $(php artisan --version)"
    
    # Check .env
    if [ -f .env ]; then
        if grep -q "APP_KEY=base64:" .env; then
            log_success ".env file is configured"
        else
            log_error "APP_KEY not set in .env"
        fi
    else
        log_error ".env file not found"
    fi
    
    # Check storage link
    if [ -L public/storage ]; then
        log_success "Storage link exists"
    else
        log_warning "Storage link missing"
    fi
    
    # Check permissions
    if [ -w storage ] && [ -w bootstrap/cache ]; then
        log_success "Storage and cache directories are writable"
    else
        log_warning "Permission issues detected"
    fi
    
    # Check database connection
    if php artisan migrate:status &>/dev/null; then
        log_success "Database connection successful"
    else
        log_error "Database connection failed"
    fi
    
    # Check public_html
    if [ -f ${PUBLIC_HTML}/index.php ]; then
        log_success "index.php exists in public_html"
    else
        log_error "index.php not found in public_html"
    fi
    
    # Check logs
    if [ -f storage/logs/laravel.log ]; then
        log_info "Recent log entries:"
        tail -5 storage/logs/laravel.log
    fi
    
    log_success "Validation completed"
}

################################################################################
# MAIN SCRIPT
################################################################################

main() {
    echo "=================================="
    echo "Hostinger Deployment Script"
    echo "=================================="
    echo ""
    
    # Parse arguments
    case "${1:-}" in
        --first-time)
            validate_environment
            first_time_deployment
            ;;
        --rollback)
            validate_environment
            rollback_deployment
            ;;
        --validate)
            validate_deployment
            ;;
        *)
            validate_environment
            update_deployment
            ;;
    esac
}

# Run main function
main "$@"
