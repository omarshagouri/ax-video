# AmpCoreX render service for Cloud Run (Remotion + headless Chrome).
FROM node:20-bookworm-slim

# Chrome/Chromium runtime libs Remotion needs to render headlessly.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Download the exact Chrome Headless Shell Remotion uses, at build time.
RUN npx remotion browser ensure

ENV NODE_ENV=production
# PORT is provided by Cloud Run. RENDER_API_KEY must be set as a Cloud Run env var.
CMD ["node", "server/index.mjs"]
