# Vizara — Universal WebAR SaaS Platform

Har qanday tashkilot ro'yxatdan o'tib, 3D modellar yuklaydi, QR kod generatsiya qiladi va mijozlari WebAR tajribasidan foydalanadi.

**Tariflar:** Starter $5 · Business $15 · Pro $35 · Enterprise $99 (oylik)

## Texnologiyalar

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **Backend:** Express, Prisma, JWT auth, Stripe subscriptions
- **AR:** Google model-viewer (WebXR), Foto Zona

## Tez boshlash (development)

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

| Xizmat   | Manzil                    |
|----------|---------------------------|
| Frontend | http://localhost:3000     |
| API      | http://localhost:3001     |
| Health   | http://localhost:3001/api/health |

## Production build

```bash
npm run build:all          # Frontend + backend
npm run db:migrate:deploy  # DB migratsiya (production)
NODE_ENV=production npm start
```

Production rejimida bitta server (`PORT`) ham API, ham `dist/` SPA ni xizmat qiladi.

### Majburiy production env

| O'zgaruvchi   | Tavsif                                      |
|---------------|---------------------------------------------|
| `JWT_SECRET`  | Kamida 32 belgili tasodifiy string            |
| `APP_URL`     | Public URL (masalan `https://vizara.app`)   |
| `DATABASE_URL`| SQLite yoki PostgreSQL connection string    |
| `DEMO_MODE`   | `false` (Stripe bilan ishlash uchun)          |

Stripe uchun: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, va har bir tarif uchun `STRIPE_PRICE_*`.

## Docker deploy

```bash
cp .env.example .env
# .env ni production qiymatlar bilan to'ldiring:
#   JWT_SECRET, APP_URL, DEMO_MODE=false, Stripe kalitlari

docker compose up -d --build
```

Ilova `http://localhost:3001` da ochiladi (API + frontend bir portda).

**Persistent data:** Docker volume `vizara-data` (DB) va `vizara-uploads` (3D modellar, QR).

### Health check

```
GET /api/health
→ { "status": "ok", "db": "connected", "uptime": 123 }
```

## API endpoints

```
POST   /api/auth/register | /login
GET    /api/auth/me
GET|POST|PATCH  /api/organizations[/:id]
GET|POST       /api/models/:orgId
DELETE         /api/models/:orgId/:modelId
GET|POST       /api/experiences/:orgId
GET            /api/experiences/public/:orgSlug/:expSlug
GET            /api/billing/plans | /status/:orgId
POST           /api/billing/checkout/:orgId
POST           /api/billing/webhook
```

## AR havola

```
/ar/{tashkilot-slug}/{tajriba-slug}
```

## Backend xususiyatlari

- JWT autentifikatsiya (bcrypt, 7 kun)
- Tarif bo'yicha limitlar (modellar, tajribalar, fayl hajmi)
- Stripe Checkout + webhook
- Demo billing (faqat `DEMO_MODE=true`)
- Rate limiting (auth, upload, public AR)
- CORS allowlist (`CORS_ORIGIN` / `APP_URL`)
- Graceful shutdown (SIGTERM/SIGINT)
- Structured JSON logging

## Production checklist

Deploy oldin:

```bash
npm run build:all
npm run verify
npm run db:migrate:deploy   # production DB
```

| Tekshiruv | Talab |
|-----------|-------|
| `JWT_SECRET` | Min 32 belgi, tasodifiy |
| `APP_URL` | HTTPS public URL |
| `DEMO_MODE` | `false` (production bloklangan) |
| Stripe | Barcha `STRIPE_*` kalitlar to'ldirilgan |
| Docker | `vizara-data` + `vizara-uploads` volume |
| nginx | `deploy/nginx.conf` namunasi |

```bash
npm run verify   # 0 error bo'lishi kerak
```

## Xavfsizlik (audit)

- JWT + bcrypt (cost 12)
- Rate limiting: global API, auth, upload, public AR
- CORS allowlist
- GLB/GLTF magic-byte validatsiya
- Path traversal himoya (uploads)
- Stripe webhook imzo + idempotency (takrorlanmas)
- Production env validatsiya (startup da exit)
- Non-root Docker user
- Graceful shutdown
- Health: `/api/health` (DB + uploads), `/api/health/live`
- 401 sessiya boshqaruvi (frontend)

## Skriptlar

| Skript                  | Vazifa                          |
|-------------------------|---------------------------------|
| `npm run dev`           | API + frontend (hot reload)     |
| `npm run build`         | Frontend → `dist/`              |
| `npm run build:server`  | Backend → `dist-server/`        |
| `npm run build:all`     | Ikkalasini build qilish         |
| `npm start`             | Production server               |
| `npm run db:push`       | Dev schema sync                 |
| `npm run db:migrate`    | Yangi migratsiya (dev)          |
| `npm run db:migrate:deploy` | Production migratsiya       |
| `npm run verify`        | Deploy oldin tekshiruv          |
