# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_API_BASE_URL=""
ARG BACKEND_INTERNAL_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ARG BACKEND_INTERNAL_URL=""
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
