FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation ca-certificates ffmpeg python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
# Fail early if an old animation filename or missing per-file configuration returns.
RUN node scripts/test-lf-animation-file-layout.mjs
# Fail the image build if the HTTP server contains invalid JavaScript.
RUN node --check server/index.mjs
RUN node --check server/chapter-timing.mjs
RUN node --test server/chapter-timing.test.mjs
RUN node --check server/native-motion.mjs
RUN node --test server/native-motion.test.mjs
RUN node --check server/paired-chapter.mjs
RUN node --test server/paired-chapter.test.mjs
RUN node --check server/clip-catalog.mjs
RUN node --test server/clip-catalog.test.mjs
RUN node --test server/visual-plan-validator.test.mjs server/visual-word-alignment.test.mjs
RUN node --check server/assembly-gcs.mjs
RUN node --test server/assembly-gcs.test.mjs
RUN node --check server/render-delivery.mjs
RUN node --test server/render-delivery.test.mjs
RUN node --check server/segmented-tts.mjs
RUN node --check server/visual-timing-context.mjs
RUN node --test server/segmented-tts.test.mjs
RUN python3 scripts/extract_cards.py Cards
RUN npx remotion browser ensure
ENV NODE_ENV=production
CMD ["node", "server/index.mjs"]
