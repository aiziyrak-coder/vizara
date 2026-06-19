#!/bin/bash
# Vizara server deploy — run ON the server as root
# Does NOT modify existing nginx sites — only adds vizara + vizaraapi configs
set -euo pipefail

APP_DIR="/var/www/vizara"
REPO="https://github.com/aiziyrak-coder/vizara.git"
API_PORT=3011

echo "=== Vizara deploy ==="

# Node.js 20
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

mkdir -p "$APP_DIR/data" "$APP_DIR/uploads/models" "$APP_DIR/uploads/qr"
mkdir -p /var/www/certbot

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
fi

cd "$APP_DIR"

# Production env (preserve existing JWT if present)
if [ ! -f .env ]; then
  JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  cat > .env <<EOF
NODE_ENV=production
PORT=$API_PORT
HOST=127.0.0.1
DATABASE_URL=file:$APP_DIR/data/vizara.db
JWT_SECRET=$JWT
APP_URL=https://vizara.uz
CORS_ORIGIN=https://vizara.uz
DEMO_MODE=true
ALLOW_DEMO_IN_PRODUCTION=true
TRUST_PROXY_HOPS=1
MAX_UPLOAD_SIZE_MB=4096
EOF
fi

# Frontend build env
cat > .env.production <<'ENVEOF'
VITE_API_URL=https://api.vizara.uz/api
ENVEOF

# Sync domain vars on existing installs
if [ -f .env ]; then
  sed -i 's|https://vizara.saxar.uz|https://vizara.uz|g' .env
  sed -i 's|https://vizaraapi.saxar.uz|https://api.vizara.uz|g' .env
  grep -q '^APP_URL=' .env || echo 'APP_URL=https://vizara.uz' >> .env
  grep -q '^CORS_ORIGIN=' .env || echo 'CORS_ORIGIN=https://vizara.uz' >> .env
  sed -i 's|^APP_URL=.*|APP_URL=https://vizara.uz|' .env
  sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://vizara.uz|' .env
fi

npm ci
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate
npm run build:all

# PM2 — API only (frontend served by nginx)
pm2 delete vizara-api 2>/dev/null || true
pm2 start dist-server/index.js --name vizara-api --cwd "$APP_DIR"
pm2 save

# Nginx — add ONLY our configs (do not touch other sites)
cp deploy/nginx-vizara-frontend.conf /etc/nginx/sites-available/vizara.uz.conf
cp deploy/nginx-vizara-api.conf /etc/nginx/sites-available/api.vizara.uz.conf
cp deploy/nginx-legacy-saxar-redirect.conf /etc/nginx/sites-available/legacy-saxar-redirect.conf
ln -sf /etc/nginx/sites-available/vizara.uz.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.vizara.uz.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/legacy-saxar-redirect.conf /etc/nginx/sites-enabled/

# SSL certs (only if missing)
if [ ! -d /etc/letsencrypt/live/vizara.uz ]; then
  certbot certonly --nginx -d vizara.uz -d www.vizara.uz --non-interactive --agree-tos -m admin@vizara.uz || \
  certbot certonly --webroot -w /var/www/certbot -d vizara.uz -d www.vizara.uz --non-interactive --agree-tos -m admin@vizara.uz
fi
if [ ! -d /etc/letsencrypt/live/api.vizara.uz ]; then
  certbot certonly --nginx -d api.vizara.uz --non-interactive --agree-tos -m admin@vizara.uz || \
  certbot certonly --webroot -w /var/www/certbot -d api.vizara.uz --non-interactive --agree-tos -m admin@vizara.uz
fi

nginx -t && systemctl reload nginx

echo "=== Deploy complete ==="
echo "Frontend: https://vizara.uz"
echo "API:      https://api.vizara.uz/api/health"
