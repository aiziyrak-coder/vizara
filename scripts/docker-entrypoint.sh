#!/bin/sh
set -e

# Fix volume permissions when running as root (Docker)
if [ "$(id -u)" = "0" ]; then
  chown -R vizara:vizara /app/data /app/uploads 2>/dev/null || true
  exec su-exec vizara "$0" "$@"
fi

echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed, falling back to db push..."
  npx prisma db push --skip-generate
fi

echo "Starting Vizara server..."
exec node dist-server/index.js
