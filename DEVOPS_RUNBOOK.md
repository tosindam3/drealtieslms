# DevOps Runbook - DrealtiesFX Academy

## 🚀 Production Environment

- **URL**: https://www.drealtiesfx.com
- **Server**: Hostinger Shared Hosting
- **Host**: 178.16.128.142
- **Port**: 65002
- **User**: u416132331
- **Backend**: Laravel 11 (PHP 8.2)
- **Frontend**: React + Vite
- **Deployment**: GitHub Actions (rsync)

---

## 📋 Common Issues & Solutions

### Issue 1: CSRF Token Mismatch (419 Error)

**Symptoms**: Login fails with "CSRF token mismatch" error

**Root Causes**:
1. Old JavaScript files cached in browser
2. Missing CSRF cookie fetch before authentication
3. Incorrect CORS/session configuration

**Solution**:
```bash
# 1. Clear browser cache (hard refresh: Ctrl+Shift+R)
# 2. Verify CSRF implementation in frontend
# 3. Check backend session configuration

# Verify on server:
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
cd domains/drealtiesfx.com/backend
grep SESSION_DOMAIN .env
grep SANCTUM_STATEFUL_DOMAINS .env

# Should be:
# SESSION_DOMAIN=.drealtiesfx.com
# SANCTUM_STATEFUL_DOMAINS=www.drealtiesfx.com,drealtiesfx.com,localhost:5173
```

**Prevention**:
- Cache control headers in `.htaccess` (already implemented)
- Vite generates unique hashes for JS files
- Always fetch CSRF cookie before auth requests

---

### Issue 2: API JSON Response Instead of React App

**Symptoms**: Homepage shows `{"message":"DrealtiesFX Academy API"...}` instead of React app

**Root Cause**: Missing or incorrect `.htaccess` file

**Solution**:
```bash
# Deploy .htaccess manually
scp -i "SAVE KEY/open_key" -P 65002 .htaccess.production u416132331@178.16.128.142:domains/drealtiesfx.com/public_html/.htaccess

# Verify it exists
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142 'cat domains/drealtiesfx.com/public_html/.htaccess'
```

**Prevention**:
- Deployment workflow now auto-deploys `.htaccess` (commit 9f1edf4)
- `.htaccess` prioritizes `index.html` over `index.php`

---

### Issue 3: 500 Internal Server Error

**Symptoms**: White page with "500 Internal Server Error"

**Root Causes**:
1. Missing `.env` file
2. Missing storage directories
3. Wrong permissions
4. Missing APP_KEY

**Solution**:
```bash
# Connect to server
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
cd domains/drealtiesfx.com/backend

# 1. Check if .env exists
ls -la .env

# 2. If missing, restore from local
exit
scp -i "SAVE KEY/open_key" -P 65002 .env.production u416132331@178.16.128.142:domains/drealtiesfx.com/backend/.env

# 3. Recreate storage directories
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
cd domains/drealtiesfx.com/backend
mkdir -p storage/framework/{sessions,views,cache/data}
mkdir -p storage/{logs,app/public}
mkdir -p bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 4. Clear and rebuild caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache

# 5. Check logs
tail -50 storage/logs/laravel.log
```

**Prevention**:
- Deployment workflow preserves `.env` via EXCLUDE pattern
- Post-deployment script creates storage directories automatically
- Fallback creates `.env` from `.env.example` if missing

---

### Issue 4: Old JavaScript Files Cached

**Symptoms**: Changes not reflecting after deployment, old errors persist

**Root Cause**: Browser caching old JS files

**Solution**:
```bash
# 1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
# 2. Clear browser cache completely
# 3. Use incognito/private mode to test

# 4. Verify new files are deployed
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
ls -lh domains/drealtiesfx.com/public_html/assets/*.js

# 5. Remove old files manually if needed
cd domains/drealtiesfx.com/public_html/assets
rm -f index-OLD_HASH.js LandingPage-OLD_HASH.js
```

**Prevention**:
- `.htaccess` now includes cache control headers (commit 76e645b)
- JS/CSS: `Cache-Control: public, max-age=31536000, immutable`
- HTML: `Cache-Control: no-cache, no-store, must-revalidate`
- Vite generates unique hashes on each build

---

## 🔄 Deployment Process

### Automatic Deployment (GitHub Actions)

**Trigger**: Push to `main` branch

**Workflow**: `.github/workflows/deploy.yml`

**Steps**:
1. Checkout code
2. Install PHP 8.2 + Composer dependencies
3. Install Node.js 20 + NPM dependencies
4. Build React app with `VITE_API_URL=https://www.drealtiesfx.com`
5. Prepare deployment structure:
   - Copy React build → `public_html/`
   - Copy Laravel backend → `backend/`
   - Copy `.htaccess.production` → `public_html/.htaccess`
   - Copy `.env.production` → `backend/.env.example`
   - Patch `index.php` paths
6. Rsync to server (excludes `.env`, `storage/`, `bootstrap/cache/`)
7. Post-deployment:
   - Verify `.env` exists (create from `.env.example` if missing)
   - Create storage directories
   - Set permissions
   - Clear caches
   - Run migrations
   - Rebuild caches

**Monitor**: https://github.com/tosindam3/drealtieslms/actions

### Manual Deployment

```bash
# 1. Build locally
npm run build

# 2. Deploy frontend
scp -i "SAVE KEY/open_key" -P 65002 -r dist/* u416132331@178.16.128.142:domains/drealtiesfx.com/public_html/

# 3. Deploy .htaccess
scp -i "SAVE KEY/open_key" -P 65002 .htaccess.production u416132331@178.16.128.142:domains/drealtiesfx.com/public_html/.htaccess

# 4. Deploy backend (if needed)
cd backend
scp -i "SAVE KEY/open_key" -P 65002 -r app/ routes/ config/ u416132331@178.16.128.142:domains/drealtiesfx.com/backend/

# 5. Run post-deployment commands
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
cd domains/drealtiesfx.com/backend
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan migrate --force
```

---

## 🔍 Debugging Commands

### Check Application Status
```bash
ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142
cd domains/drealtiesfx.com/backend

# Laravel version
php artisan --version

# Check configuration
php artisan config:show

# List routes
php artisan route:list

# Check database connection
php artisan db:show
```

### View Logs
```bash
# Laravel logs
tail -50 domains/drealtiesfx.com/backend/storage/logs/laravel.log

# Follow logs in real-time
tail -f domains/drealtiesfx.com/backend/storage/logs/laravel.log

# Search for errors
grep -i "error" domains/drealtiesfx.com/backend/storage/logs/laravel.log | tail -20
```

### Check File Permissions
```bash
cd domains/drealtiesfx.com/backend
ls -la storage/
ls -la bootstrap/cache/

# Fix permissions if needed
chmod -R 775 storage bootstrap/cache
```

### Verify Environment
```bash
cd domains/drealtiesfx.com/backend
cat .env | grep -E "APP_ENV|APP_DEBUG|APP_URL|DB_|SESSION_|SANCTUM_"
```

---

## 🛡️ Security Checklist

- [x] `.env` excluded from git
- [x] `.env` excluded from rsync deployment
- [x] `APP_DEBUG=false` in production
- [x] `APP_ENV=production`
- [x] HTTPS enforced via `.htaccess`
- [x] WWW redirect enforced
- [x] CORS configured for specific domains
- [x] Session domain set to `.drealtiesfx.com`
- [x] Sanctum stateful domains configured
- [x] Storage directories not publicly accessible
- [x] Composer autoloader optimized

---

## 📊 Performance Optimization

### Caching Strategy
- **Config**: Cached via `php artisan config:cache`
- **Routes**: Cached via `php artisan route:cache`
- **Views**: Cached via `php artisan view:cache`
- **Static Assets**: 1 year cache (immutable, hash-based)
- **Images**: 1 month cache
- **HTML**: No cache (always fresh)

### Database
- Migrations run automatically on deployment
- Indexes on frequently queried columns
- Eager loading to prevent N+1 queries

---

## 🔐 Credentials

### Admin Access
- **Email**: admin@drealtiesfx.com
- **Password**: password123

### SSH Access
- **Key**: `SAVE KEY/open_key`
- **Command**: `ssh -i "SAVE KEY/open_key" -p 65002 u416132331@178.16.128.142`

### GitHub Secrets
- `HOSTINGER_SSH_PRIVATE_KEY`: SSH private key for deployment
- `HOSTINGER_SSH_HOST`: 178.16.128.142
- `HOSTINGER_SSH_USERNAME`: u416132331
- `HOSTINGER_SSH_PORT`: 65002

---

## 📞 Emergency Contacts

If the site is completely down:

1. Check GitHub Actions for failed deployments
2. Check Laravel logs on server
3. Verify `.env` file exists
4. Verify `.htaccess` file exists
5. Check storage directory permissions
6. Clear all caches and rebuild

**Last Resort**: Restore from backup or redeploy from scratch using this runbook.

---

## 📝 Change Log

- **2026-02-23**: Fixed CSRF token issues, added cache control headers
- **2026-02-23**: Fixed deployment workflow to preserve `.env` and storage
- **2026-02-23**: Added automatic `.htaccess` deployment
- **2026-02-23**: Implemented comprehensive post-deployment checks
