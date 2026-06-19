# ─── Stage 1: build ───
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build && npm run build:server
RUN npx prisma generate

# ─── Stage 2: production runtime ───
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl su-exec \
  && addgroup -g 1001 vizara \
  && adduser -u 1001 -G vizara -D vizara

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

RUN chmod +x ./scripts/docker-entrypoint.sh \
  && mkdir -p /app/data /app/uploads/models /app/uploads/qr \
  && chown -R vizara:vizara /app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>r.json()).then(j=>process.exit(j.status==='ok'?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
