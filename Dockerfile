# --- Base ---
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/lib/db/migrate.ts ./lib/db/migrate.ts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install Playwright Chromium to a fixed path (avoids $HOME issues in Railway)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN ./node_modules/.bin/playwright install --with-deps chromium

CMD ["sh", "-c", "./node_modules/.bin/tsx lib/db/migrate.ts && ./node_modules/.bin/tsx worker/index.ts"]

# Install only what's needed for running migrations at startup
RUN pnpm add tsx dotenv drizzle-orm pg

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "./node_modules/.bin/tsx lib/db/migrate.ts && node server.js"]
