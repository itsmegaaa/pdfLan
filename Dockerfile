# ═══════════════════════════════════════════════════════════════════
# Stage 1: Frontend Builder
# ═══════════════════════════════════════════════════════════════════
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY frontend/ ./
RUN npm run build


# ═══════════════════════════════════════════════════════════════════
# Stage 2: Production Runtime
# ═══════════════════════════════════════════════════════════════════
FROM node:20-slim AS production

# Metadata
LABEL maintainer="PDFVault" \
      version="1.0.6" \
      description="PDFVault - Self-hosted PDF tool suite for LAN"

# Prevent interactive apt prompts
ENV DEBIAN_FRONTEND=noninteractive

# ─── Install System Dependencies ───────────────────────────────────
# Update apt and install all required tools in a single layer to minimize image size
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    curl \
    ca-certificates \
    gnupg \
    # LibreOffice (for Office <-> PDF conversion)
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    # Ghostscript (for PDF compression and PDF/A conversion)
    ghostscript \
    # QPDF (for PDF encryption/decryption)
    qpdf \
    # Poppler Utils (for PDF -> JPG via pdftoppm)
    poppler-utils \
    # Chromium for Puppeteer (HTML -> PDF)
    chromium \
    # Fonts for proper document rendering
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    # Required libs for Chromium/Puppeteer
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    # Cleanup to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# ─── Setup Node.js App ─────────────────────────────────────────────
WORKDIR /app

# Copy backend package files and install prod dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev --prefer-offline && cd ..

# Copy backend source files
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# ─── Create temp directories ───────────────────────────────────────
RUN mkdir -p ./backend/tmp/uploads ./backend/tmp/outputs \
    && chown -R node:node /app

# ─── Configure environment for Docker ─────────────────────────────
ENV APP_HOST=0.0.0.0 \
    APP_PORT=3000 \
    # Linux binary paths (pre-installed in this image)
    LIBREOFFICE_PATH=/usr/bin/soffice \
    GHOSTSCRIPT_PATH=/usr/bin/gs \
    QPDF_PATH=/usr/bin/qpdf \
    POPPLER_PATH=/usr/bin \
    CHROMIUM_PATH=/usr/bin/chromium \
    # Temp dirs inside container
    TEMP_DIR=/app/backend/tmp/uploads \
    OUTPUT_DIR=/app/backend/tmp/outputs \
    # Defaults
    FILE_TTL_MINUTES=120 \
    MAX_FILE_SIZE_MB=50 \
    CORS_ORIGIN=* \
    # Puppeteer: Skip downloading bundled Chromium, use system Chromium
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    # LibreOffice headless environment
    HOME=/tmp

# ─── Use non-root user for security ───────────────────────────────
USER node
WORKDIR /app/backend

# ─── Expose port ───────────────────────────────────────────────────
EXPOSE 3000

# ─── Health check ──────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# ─── Start application ─────────────────────────────────────────────
CMD ["node", "index.js"]
