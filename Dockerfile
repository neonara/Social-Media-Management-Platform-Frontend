# ---------------- Base Image ----------------
FROM node:18-alpine AS base

# Fix native module compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------- Dependencies ----------------
FROM base AS deps

# Copy lockfile for deterministic install
COPY package.json package-lock.json* ./

# Install only prod deps (Next.js does server-side logic in prod too)
RUN npm ci --only=production

# ---------------- Builder ----------------
FROM base AS builder

# Copy deps from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source
COPY . .

# Build the Next.js app
RUN npm run build

# ---------------- Runner ----------------
FROM base AS runner

WORKDIR /app

# Use non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Optional: if you use a custom server
# COPY --from=builder /app/server.js ./server.js

USER nextjs

EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD nc -z localhost 3000 || exit 1

CMD ["npm", "start"]
