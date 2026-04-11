# Multi-stage production build for smarTODO (Next.js 15 + Turborepo)
#
# Usage:
#   docker build -t smartodo -f docker/Dockerfile .
#   docker run -p 3000:3000 --env-file .env.local smartodo

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm (match version in package.json#packageManager)
RUN npm install -g pnpm@10

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json        ./packages/core/
COPY packages/ui/package.json          ./packages/ui/
COPY packages/plugin-sdk/package.json  ./packages/plugin-sdk/
COPY packages/ai/package.json          ./packages/ai/
COPY packages/supabase/package.json    ./packages/supabase/
COPY plugins/sprint-board/package.json ./plugins/sprint-board/
COPY plugins/time-tracking/package.json ./plugins/time-tracking/
COPY apps/web/package.json             ./apps/web/

RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=deps /app/node_modules                        ./node_modules
COPY --from=deps /app/packages/core/node_modules          ./packages/core/node_modules
COPY --from=deps /app/packages/ui/node_modules            ./packages/ui/node_modules
COPY --from=deps /app/packages/plugin-sdk/node_modules    ./packages/plugin-sdk/node_modules
COPY --from=deps /app/packages/ai/node_modules            ./packages/ai/node_modules
COPY --from=deps /app/packages/supabase/node_modules      ./packages/supabase/node_modules
COPY --from=deps /app/plugins/sprint-board/node_modules   ./plugins/sprint-board/node_modules
COPY --from=deps /app/plugins/time-tracking/node_modules  ./plugins/time-tracking/node_modules
COPY --from=deps /app/apps/web/node_modules               ./apps/web/node_modules

COPY . .

# Build-time public env vars (non-secret)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_VERSION=dev

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

RUN pnpm turbo run build --filter=@smartodo/web

# ── Stage 3: minimal runtime image ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone output bundles everything needed
COPY --from=builder /app/apps/web/public                          ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Docker healthcheck — polls /api/health every 30 s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "apps/web/server.js"]
