# 🐳 Panduan Deployment PDFVault dengan Docker

Docker adalah cara termudah dan paling portabel untuk menjalankan PDFVault. Dengan satu perintah, seluruh stack (Node.js, LibreOffice, Ghostscript, QPDF, Poppler, Chromium) sudah berjalan tanpa perlu instalasi manual apapun.

## Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS)  
- Docker Engine 24+ & Docker Compose v2+ (Linux)

---

## 🚀 Quick Start (3 Langkah)

### Langkah 1 — Clone Repository
```bash
git clone https://github.com/itsmegaaa/pdfLan.git
cd pdfLan
```

### Langkah 2 — (Opsional) Konfigurasi Kustom
Salin template environment Docker:
```bash
cp .env.docker .env
```
Edit file `.env` jika ingin mengubah port atau setting lainnya.

### Langkah 3 — Build & Jalankan
```bash
docker compose up -d --build
```

Proses build pertama memerlukan waktu **5–15 menit** karena mengunduh dan menginstal LibreOffice, Ghostscript, dan tool lainnya. Build berikutnya jauh lebih cepat karena layer sudah di-cache.

Setelah selesai, buka browser dan akses:
```
http://localhost:3000
```

---

## 🌐 Akses dari PC Lain di LAN

Setelah container berjalan, PC staf lain di jaringan yang sama dapat mengakses:
```
http://<IP_PC_SERVER>:3000
```

Untuk menemukan IP PC Server:
```bash
# Windows
ipconfig

# Linux / macOS
ip addr show | grep "inet "
```

> [!WARNING]
> **Jangan** mengekspos port ini ke internet publik. PDFVault dirancang untuk jaringan LAN internal.

---

## 📋 Perintah Berguna

| Perintah | Fungsi |
|---|---|
| `docker compose up -d --build` | Build ulang & jalankan di background |
| `docker compose up -d` | Jalankan (tanpa build ulang) |
| `docker compose down` | Hentikan & hapus container |
| `docker compose logs -f` | Lihat log real-time |
| `docker compose restart pdfvault` | Restart service |
| `docker compose ps` | Status container |

---

## ⚙️ Konfigurasi (`docker-compose.yml`)

Semua konfigurasi dapat diubah via file `.env` di root project:

| Variabel | Default | Keterangan |
|---|---|---|
| `APP_PORT` | `3000` | Port yang di-expose ke host |
| `FILE_TTL_MINUTES` | `120` | Waktu simpan file temp (menit) |
| `MAX_FILE_SIZE_MB` | `50` | Batas ukuran file upload (MB) |
| `CORS_ORIGIN` | `*` | CORS origin (batasi jika perlu) |

---

## 📦 Isi Image Docker

Image ini berbasis `node:20-slim` (Debian) dan sudah ter-bundle dengan:

| Tool | Versi | Kegunaan |
|---|---|---|
| **Node.js** | 20 LTS | Runtime server |
| **LibreOffice** | Latest stable | Konversi Office ↔ PDF |
| **Ghostscript** | Latest stable | Kompresi & PDF/A |
| **QPDF** | Latest stable | Enkripsi & dekripsi PDF |
| **Poppler** (`pdftoppm`) | Latest stable | PDF → JPG |
| **Chromium** | Latest stable | HTML → PDF (Puppeteer) |

---

## 🔧 Troubleshooting

### Container langsung berhenti / exit
```bash
# Lihat log untuk detail error
docker compose logs pdfvault
```

### LibreOffice gagal mengkonversi
Pastikan container memiliki cukup **memory (minimal 1GB)**. LibreOffice membutuhkan banyak RAM.
```bash
# Cek penggunaan resource
docker stats pdfvault
```

### Port 3000 sudah dipakai
Edit file `.env` dan ubah `APP_PORT` ke port lain, misalnya `8080`:
```
APP_PORT=8080
```
Lalu jalankan ulang:
```bash
docker compose down && docker compose up -d
```

### Reset data temp
```bash
docker compose down
docker volume rm pdflan_pdfvault_tmp
docker compose up -d
```
