# Setup PDFVault untuk Jaringan Lokal (LAN)

Aplikasi ini dapat dijalankan pada **satu PC Server** di dalam jaringan kantor Anda. Komputer staf (Client) tidak perlu menginstal aplikasi berat apa pun (seperti LibreOffice, Ghostscript, dll.), cukup mengakses aplikasi melalui browser web.

## 1. Persiapan PC Server

1. Pastikan Anda telah menginstal Node.js di PC ini.
2. Salin file `.env.example` menjadi `.env` di folder `backend/`.
3. Sesuaikan path konfigurasi pada `.env` dengan lokasi instalasi tools (LibreOffice, Ghostscript, qpdf, dll.) di PC Server ini.
4. (Opsional) Sesuaikan `APP_PORT` jika port `3000` sudah dipakai oleh aplikasi lain.

## 2. Menjalankan Aplikasi

Anda dapat menggunakan script otomatis yang sudah disediakan:
Klik ganda pada file `start-pdfvault-lan.bat`.
Atau jalankan perintah ini di terminal root folder:
```bash
npm run start:lan
```
Script ini akan:
- Mem-build tampilan web (frontend)
- Menjalankan backend server yang akan melayani frontend dan API secara bersamaan di satu port.

## 3. Konfigurasi Firewall Windows (Wajib)

Agar PC staf lain dapat mengakses server ini, Anda harus membuka port di Windows Firewall PC Server.
Buka **PowerShell sebagai Administrator** dan jalankan perintah berikut (asumsi port 3000):

```powershell
New-NetFirewallRule -DisplayName "PDFVault Local" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## 4. Cara Akses dari PC Client

1. Buka Command Prompt atau PowerShell di **PC Server**.
2. Ketik perintah:
   ```bash
   ipconfig
   ```
3. Cari baris **IPv4 Address**. Misalnya tertulis `192.168.1.10`.
4. Bagikan alamat ini ke staf Anda.
5. Staf cukup membuka web browser dan mengetik alamat berikut:
   `http://192.168.1.10:3000`

> [!WARNING]
> **Peringatan Keamanan**
> Aplikasi ini didesain khusus untuk penggunaan jaringan lokal (LAN) internal kantor.
> **JANGAN** mem-port-forward router Anda atau mengekspos aplikasi ini ke public internet. Terdapat risiko keamanan jika aplikasi ini dapat diakses oleh pihak luar.
