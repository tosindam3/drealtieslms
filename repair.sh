#!/bin/bash
set -e

SITE_DIR="domains/drealtiesfx.com"
BACKEND_DIR="$SITE_DIR/backend"
PUBLIC_DIR="$SITE_DIR/public_html"

echo "Checking .env file..."
if [ -f "$BACKEND_DIR/.env" ]; then
    echo ".env file found."
else
    echo "ERROR: .env file NOT found!"
    exit 1
fi

echo "Setting permissions..."
chmod -R 775 "$BACKEND_DIR/storage" "$BACKEND_DIR/bootstrap/cache"

echo "Patching index.php..."
sed -i "s|__DIR__.'/../vendor/autoload.php'|__DIR__.'/../backend/vendor/autoload.php'|g" "$PUBLIC_DIR/index.php"
sed -i "s|__DIR__.'/../bootstrap/app.php'|__DIR__.'/../backend/bootstrap/app.php'|g" "$PUBLIC_DIR/index.php"
sed -i "s|__DIR__.'/../storage/framework/maintenance.php'|__DIR__.'/../backend/storage/framework/maintenance.php'|g" "$PUBLIC_DIR/index.php"

echo "Running Laravel commands..."
cd "$BACKEND_DIR"
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "REPAIR_COMPLETE"
