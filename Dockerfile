# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  else npm ci; fi

COPY . .

# Build the Next.js app in standalone mode for optimized production deployments
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Create the production-ready image
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV for production
ENV NODE_ENV=production

ENV IMAGE_DIR=/data/images

RUN apk add --no-cache su-exec
RUN mkdir -p /data/images

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# copy your standalone output...
# COPY --from=builder ...

ENTRYPOINT ["docker-entrypoint.sh"]

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["node", "server.js"]