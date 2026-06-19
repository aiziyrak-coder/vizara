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
APP_URL=https://vizara.saxar.uz
CORS_ORIGIN=https://vizara.saxar.uz
DEMO_MODE=true
ALLOW_DEMO_IN_PRODUCTION=true
TRUST_PROXY_HOPS=1
MAX_UPLOAD_SIZE_MB=4096
EOF
fi

# Frontend build env
cat > .env.production <<'EOF'
VITE_API_URL=https://vizaraapi.saxar.uz/api
EOF

npm ci
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate
npm run build:all

# PM2 — API only (frontend served by nginx)
pm2 delete vizara-api 2>/dev/null || true
pm2 start dist-server/index.js --name vizara-api --cwd "$APP_DIR"
pm2 save

# Nginx — add ONLY our configs (do not touch other sites)
cp deploy/nginx-vizara-frontend.conf /etc/nginx/sites-available/vizara.saxar.uz.conf
cp deploy/nginx-vizara-api.conf /etc/nginx/sites-available/vizaraapi.saxar.uz.conf
ln -sf /etc/nginx/sites-available/vizara.saxar.uz.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/vizaraapi.saxar.uz.conf /etc/nginx/sites-enabled/

# SSL certs (only if missing)
if [ ! -d /etc/letsencrypt/live/vizara.saxar.uz ]; then
  certbot certonly --nginx -d vizara.saxar.uz --non-interactive --agree-tos -m admin@saxar.uz || \
  certbot certonly --webroot -w /var/www/certbot -d vizara.saxar.uz --non-interactive --agree-tos -m admin@saxar.uz
fi
if [ ! -d /etc/letsencrypt/live/vizaraapi.saxar.uz ]; then
  certbot certonly --nginx -d vizaraapi.saxar.uz --non-interactive --agree-tos -m admin@saxar.uz || \
  certbot certonly --webroot -w /var/www/certbot -d vizaraapi.saxar.uz --non-interactive --agree-tos -m admin@saxar.uz
fi

nginx -t && systemctl reload nginx

echo "=== Deploy complete ==="
echo "Frontend: https://vizara.saxar.uz"
echo "API:      https://vizaraapi.saxar.uz/api/health"
