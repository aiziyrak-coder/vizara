#!/usr/bin/env node
/**
 * Pre-deploy verification — run: npm run verify
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`✗ ${msg}`); errors++; }
function warn(msg) { console.warn(`⚠ ${msg}`); warnings++; }
function ok(msg) { console.log(`✓ ${msg}`); }

console.log('\nVizara pre-deploy verification\n');

// Build artifacts
for (const dir of ['dist', 'dist-server']) {
  const p = path.join(root, dir);
  if (!fs.existsSync(p)) fail(`Missing ${dir}/ — run npm run build:all`);
  else ok(`${dir}/ exists`);
}

if (!fs.existsSync(path.join(root, 'dist-server/index.js'))) {
  fail('dist-server/index.js missing');
}

// Prisma
if (!fs.existsSync(path.join(root, 'prisma/migrations'))) {
  warn('prisma/migrations/ missing');
} else ok('prisma migrations exist');

// Env example
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['DATABASE_URL', 'JWT_SECRET', 'APP_URL']) {
  if (!envExample.includes(key)) fail(`.env.example missing ${key}`);
}
ok('.env.example has required keys');

// Docker
for (const f of ['Dockerfile', 'docker-compose.yml', 'scripts/docker-entrypoint.sh']) {
  if (!fs.existsSync(path.join(root, f))) fail(`Missing ${f}`);
  else ok(f);
}

// Security checks on .env if present
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  if (env.includes('vizara-change-this-secret-in-production')) {
    warn('.env still uses default JWT_SECRET');
  }
  if (/DEMO_MODE\s*=\s*"?true"?/i.test(env)) {
    warn('.env has DEMO_MODE=true — disable for production');
  }
} else {
  warn('.env not found (copy from .env.example)');
}

// Unused heavy deps check removed — keep verify lean

console.log(`\nResult: ${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors > 0 ? 1 : 0);
