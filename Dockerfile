# syntax=docker/dockerfile:1

# Production Dockerfile for Manti
# Multi-stage build for optimized image size

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Skip env validation during build (env vars provided at runtime)
ENV SKIP_ENV_VALIDATION=true
# Provide dummy DATABASE_URL for build-time (Next.js collects page data)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Build the Next.js application
RUN npm run build

# ============================================
# Stage 3: Production runner
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle migrations and config for database setup
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

# Copy src directory structure needed for tsconfig paths and drizzle
COPY --from=builder /app/src ./src

# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Install dependencies needed for migrations
RUN npm install drizzle-kit drizzle-orm postgres tsx

USER nextjs

EXPOSE 3000

# Run migrations then start the app
ENTRYPOINT ["./entrypoint.sh"]
