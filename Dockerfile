# Stage 1: Build the Next.js application (Debian-based)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# APP VERSION SETTINGS
ARG NEXT_PUBLIC_VERSION=dev
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION

# Install Python + venv + build tooling (some py deps may need compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create venv and make it default
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy lockfiles
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Python deps (cache-friendly)
COPY image-quality/requirements.txt ./image-quality/requirements.txt

# If requirements includes ultralytics/torch, installing torch from the CPU index is often more reliable:
# (You can keep torch in requirements too; this just helps pip resolve wheels deterministically.)
RUN pip install --no-cache-dir -U pip \
 && pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu "torch>=1.8.0" \
 && pip install --no-cache-dir -r image-quality/requirements.txt

# Install JS deps
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
  else npm ci; fi

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# Stage 2: Production image (Debian-based)
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV IMAGE_DIR=/data/images

# Install Python runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

USER root
RUN mkdir -p /data/images \
 && chown -R 1001:1001 /data


RUN apt-get update && apt-get install -y --no-install-recommends gosu \
 && rm -rf /var/lib/apt/lists/*

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid 1001 nextjs

# Copy Next standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/image-quality ./image-quality

# Copy the venv that already has all deps installed
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python deps (prefer installing exactly what's in requirements.txt)
# If ultralytics pulls torch, ensure torch can be resolved (CPU index line helps).
RUN /opt/venv/bin/python -m pip install --no-cache-dir -U pip \
 && /opt/venv/bin/python -m pip install --no-cache-dir -r image-quality/requirements.txt


 RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*
# RUN pip3 install --no-cache-dir -U pip \
#  && pip3 install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r image-quality/requirements.txt

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]

# Next.js standalone usually starts with node server.js
CMD ["node", "server.js"]
