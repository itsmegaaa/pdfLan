# 🐳 PDFVault Docker Deployment Guide

Docker is the easiest and most portable way to run PDFVault. With a single command, the entire stack (Node.js, LibreOffice, Ghostscript, QPDF, Poppler, Chromium) is provisioned and running without any manual software installations on the host system.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS)  
- Docker Engine 24+ & Docker Compose v2+ (Linux)

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Clone the Repository
```bash
git clone https://github.com/itsmegaaa/pdfLan.git
cd pdfLan
```

### Step 2 — (Optional) Custom Configuration
Copy the Docker environment template:
```bash
cp .env.docker .env
```
Edit `.env` if you want to change the port or other operational settings.

### Step 3 — Build & Start
```bash
docker compose up -d --build
```

The initial build takes **5–15 minutes** as it downloads and installs all underlying binaries (LibreOffice, Ghostscript, Chromium, Poppler, etc.). Subsequent builds will be near-instantaneous thanks to Docker layer caching.

Once finished, open your browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 Access from Other Devices on the LAN

Once the container is running, other client machines on the same local network can access the application:
```
http://<HOST_SERVER_IP>:3000
```

To find the Host Server's local IP address:
```bash
# Windows
ipconfig

# Linux / macOS
ip addr show | grep "inet "
```

> [!WARNING]
> **Security Notice**: Do not expose this port directly to the public internet. PDFVault is designed for private local network use.

---

## 📋 Useful Commands

| Command | Description |
|---|---|
| `docker compose up -d --build` | Rebuild and run in the background |
| `docker compose up -d` | Start services (without rebuilding) |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | View real-time container logs |
| `docker compose restart pdfvault` | Restart the application container |
| `docker compose ps` | Check container status |

---

## ⚙️ Configuration (`docker-compose.yml`)

All settings can be customized via `.env` in the project root:

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `3000` | Port exposed to the host machine |
| `FILE_TTL_MINUTES` | `120` | Retention duration for temp files (minutes) |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size limit (MB) |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

---

## 📦 Docker Image Contents

The image is based on `node:20-slim` (Debian) and comes pre-bundled with:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | 20 LTS | Server runtime |
| **LibreOffice** | Latest stable | Office ↔ PDF conversion |
| **Ghostscript** | Latest stable | Compression & PDF/A |
| **QPDF** | Latest stable | PDF encryption & unlocking |
| **Poppler** (`pdftoppm`) | Latest stable | PDF → JPG extraction |
| **Chromium** | Latest stable | HTML → PDF conversion (Puppeteer) |

---

## 🔧 Troubleshooting

### Container stops immediately / exits with error
```bash
# Inspect container logs for details
docker compose logs pdfvault
```

### LibreOffice conversion failure
Ensure the container has sufficient **memory (minimum 1GB RAM allocated)**. LibreOffice requires enough memory for headless document processing.
```bash
# Check resource usage
docker stats pdfvault
```

### Port 3000 is already in use
Edit your `.env` file and change `APP_PORT` to another available port (e.g. `8080`):
```env
APP_PORT=8080
```
Then restart the stack:
```bash
docker compose down && docker compose up -d
```

### Resetting temporary files and volumes
```bash
docker compose down
docker volume rm pdflan_pdfvault_tmp
docker compose up -d
```
