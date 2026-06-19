#!/usr/bin/env python3
"""Deploy Vizara to production server via SSH."""
import os
import sys
import tarfile
import io
import paramiko

HOST = "164.90.186.193"
USER = "root"
PASSWORD = os.environ.get("VIZARA_SSH_PASSWORD", "Fjsti2026Ai")
APP_DIR = "/var/www/vizara"
LOCAL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {"node_modules", "dist", "dist-server", "uploads", ".git", "prisma/prisma"}
SKIP_EXT = {".db", ".db-journal"}


def should_skip(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    for skip in SKIP_DIRS:
        if skip in parts:
            return True
    return any(path.endswith(ext) for ext in SKIP_EXT)


def create_tarball() -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for root, dirs, files in os.walk(LOCAL_ROOT):
            dirs[:] = [d for d in dirs if d not in {"node_modules", ".git", "dist", "dist-server", "uploads"}]
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, LOCAL_ROOT).replace("\\", "/")
                if should_skip(rel):
                    continue
                if rel.startswith(".env") and rel != ".env.production.example" and rel != ".env.example":
                    continue
                tar.add(full, arcname=rel)
    buf.seek(0)
    return buf.read()


def run(client: paramiko.SSHClient, cmd: str, timeout=600) -> str:
    print(f"\n$ {cmd[:120]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out:
        safe = out[-4000:] if len(out) > 4000 else out
        print(safe.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))
    if err:
        safe_err = err[-2000:] if len(err) > 2000 else err
        print("STDERR:", safe_err.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))
    if code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd}")
    return out


def main():
    print("Creating deployment archive...")
    data = create_tarball()
    print(f"Archive size: {len(data) / 1024 / 1024:.1f} MB")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(client, f"mkdir -p {APP_DIR}/data {APP_DIR}/uploads/models {APP_DIR}/uploads/qr /var/www/certbot")

    print("Uploading files...")
    sftp = client.open_sftp()
    remote_tar = f"{APP_DIR}/deploy.tar.gz"
    with sftp.file(remote_tar, "wb") as rf:
        rf.write(data)
    sftp.close()

    deploy_script = f"""
set -e
cd {APP_DIR}
tar -xzf deploy.tar.gz
rm -f deploy.tar.gz
chmod +x deploy/server-deploy.sh

# Fix CRLF if uploaded from Windows
sed -i 's/\\r$//' deploy/server-deploy.sh 2>/dev/null || true

if [ ! -f .env ]; then
  JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  cat > .env <<ENVEOF
NODE_ENV=production
PORT=3011
HOST=127.0.0.1
DATABASE_URL=file:{APP_DIR}/data/vizara.db
JWT_SECRET=$JWT
APP_URL=https://vizara.uz
CORS_ORIGIN=https://vizara.uz
DEMO_MODE=true
ALLOW_DEMO_IN_PRODUCTION=true
TRUST_PROXY_HOPS=1
MAX_UPLOAD_SIZE_MB=4096
ENVEOF
fi

if [ -f .env ]; then
  sed -i 's|https://vizara.saxar.uz|https://vizara.uz|g' .env
  sed -i 's|https://vizaraapi.saxar.uz|https://api.vizara.uz|g' .env
  sed -i 's|^APP_URL=.*|APP_URL=https://vizara.uz|' .env
  sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://vizara.uz|' .env
fi

cat > .env.production <<'ENVEOF'
VITE_API_URL=https://api.vizara.uz/api
ENVEOF

npm ci
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate
npm run build:all

npm install -g pm2 2>/dev/null || true
pm2 delete vizara-api 2>/dev/null || true
pm2 start dist-server/index.js --name vizara-api --cwd {APP_DIR}
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

mkdir -p /var/www/certbot

# Phase 1: HTTP nginx (for certbot + initial serve)
cp deploy/nginx-vizara-frontend-http.conf /etc/nginx/sites-available/vizara.uz.conf
cp deploy/nginx-vizara-api-http.conf /etc/nginx/sites-available/api.vizara.uz.conf
cp deploy/nginx-legacy-saxar-redirect.conf /etc/nginx/sites-available/legacy-saxar-redirect.conf
ln -sf /etc/nginx/sites-available/vizara.uz.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.vizara.uz.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/legacy-saxar-redirect.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Phase 2: SSL certificates
if [ ! -f /etc/letsencrypt/live/vizara.uz/fullchain.pem ]; then
  certbot certonly --webroot -w /var/www/certbot -d vizara.uz -d www.vizara.uz \\
    --non-interactive --agree-tos -m admin@vizara.uz || true
fi
if [ ! -f /etc/letsencrypt/live/api.vizara.uz/fullchain.pem ]; then
  certbot certonly --webroot -w /var/www/certbot -d api.vizara.uz \\
    --non-interactive --agree-tos -m admin@vizara.uz || true
fi

# Phase 3: Full HTTPS nginx configs
if [ -f /etc/letsencrypt/live/vizara.uz/fullchain.pem ]; then
  cp deploy/nginx-vizara-frontend.conf /etc/nginx/sites-available/vizara.uz.conf
fi
if [ -f /etc/letsencrypt/live/api.vizara.uz/fullchain.pem ]; then
  cp deploy/nginx-vizara-api.conf /etc/nginx/sites-available/api.vizara.uz.conf
fi
nginx -t && systemctl reload nginx
echo DEPLOY_OK
"""

    run(client, deploy_script, timeout=900)

    # Health check
    run(client, "curl -s http://127.0.0.1:3011/api/health || true")
    run(client, "pm2 list")
    client.close()
    print("\n=== DONE ===")
    print("Frontend: https://vizara.uz")
    print("API:      https://api.vizara.uz/api/health")


if __name__ == "__main__":
    main()
